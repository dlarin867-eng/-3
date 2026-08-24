// Блок 11 — нагрузочное тестирование. Бьёт по РЕАЛЬНОМУ проду на Railway
// (не локальному dev-серверу) — та же БД, тот же инстанс, что видят живые
// пользователи. Специально НЕ гоняем большую нагрузку на /meals/photo —
// он завязан на бесплатный лимит OpenRouter (20 запросов/мин, 200/день,
// см. отчёты 2026-08-24), "нагрузка" туда упёрлась бы в чужой rate limit,
// а не показала бы реальную ёмкость нашего backend. Тот сценарий — отдельно,
// маленькой контролируемой партией, в load-test-photo.ts.
import autocannon from "autocannon";

const BASE = process.env.E2E_BASE_URL || "https://kbzhu-api-production.up.railway.app";

function run(opts: autocannon.Options): Promise<autocannon.Result> {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => (err ? reject(err) : resolve(result)));
  });
}

function printSummary(label: string, r: autocannon.Result) {
  console.log(`\n=== ${label} ===`);
  console.log(`Запросов: ${r.requests.total}, ошибок: ${r.errors}, таймаутов: ${r.timeouts}`);
  console.log(`Латентность (мс) — среднее: ${r.latency.average}, p50: ${r.latency.p50}, p99: ${r.latency.p99}, max: ${r.latency.max}`);
  console.log(`RPS — среднее: ${r.requests.average}`);
  console.log(`Коды ответов: ${JSON.stringify(r["2xx"] !== undefined ? { "2xx": r["2xx"] } : {})} non2xx: ${r.non2xx}`);
}

async function main() {
  const only = process.argv[2]; // "health" | "register" | "targets" | не задано — все три

  if (!only || only === "health") {
    // 1. Health — чистый baseline, ничего кроме самого сервера.
    const health = await run({
      url: `${BASE}/health`,
      connections: 50,
      duration: 10,
    });
    printSummary("GET /health — 50 соединений, 10с", health);
  }

  if (only === "health") return;
  // 2. Регистрация — запись в БД + bcrypt-хэш пароля + расчёт стартовой
  // нормы (Миффлин-Сан Жеора) на каждый запрос. Email должен быть
  // уникальным НА КАЖДЫЙ запрос (иначе 409 conflict) — setupClient
  // вызывается один раз на соединение, а не на запрос, поэтому body нужно
  // менять через setupRequest (per-request hook), а не setupClient.
  let i = 0;
  const register = await run({
    url: `${BASE}/auth/register`,
    connections: 20,
    duration: 10,
    requests: [
      {
        method: "POST",
        path: "/auth/register",
        headers: { "content-type": "application/json" },
        setupRequest: (request) => {
          request.body = JSON.stringify({
            email: `load-${Date.now()}-${Math.random().toString(36).slice(2)}-${i++}@kbzhu.local`,
            password: "loadtest12345",
            sex: "m",
            age: 28,
            heightCm: 178,
            bodyweightKg: 82,
            goal: "maintain",
            trainingDays: [1, 3, 5],
          });
          return request;
        },
      },
    ],
  });
  printSummary("POST /auth/register — 20 соединений, 10с (запись в БД + bcrypt)", register);

  if (only === "register") return;
  // 3. Чтение авторизованных данных — регистрируем одного пользователя,
  // дальше много параллельных GET с его токеном (самый частый паттерн
  // реального использования — открыл главный экран).
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `load-reader-${Date.now()}@kbzhu.local`,
      password: "loadtest12345",
      sex: "f",
      age: 30,
      heightCm: 165,
      bodyweightKg: 60,
      goal: "cut",
      trainingDays: [2, 4],
    }),
  });
  const { token } = (await regRes.json()) as { token: string };

  const targets = await run({
    url: `${BASE}/targets/today`,
    connections: 50,
    duration: 10,
    headers: { Authorization: `Bearer ${token}` },
  });
  printSummary("GET /targets/today (авторизованный) — 50 соединений, 10с", targets);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
