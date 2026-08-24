// Блок 11 — контролируемая (не массовая) проверка /meals/photo под
// параллельной нагрузкой. Специально малое число запросов — endpoint
// зависит от бесплатного лимита OpenRouter (20/мин, 200/день, см. отчёты
// 2026-08-24), гнать туда сотни запросов бессмысленно и вредно (упрёмся
// в чужой лимит, а не измерим свой backend). Цель теста — не пропускная
// способность, а конкретный вопрос: если 5 человек одновременно грузят
// фото, тормозит ли это друг друга сильнее, чем сумма их собственных
// задержек (проверка, что Node/Fastify не блокируется на долгих внешних
// fetch-вызовах — они асинхронные и не должны сериализоваться).
import { readFileSync } from "node:fs";

const BASE = process.env.E2E_BASE_URL || "https://kbzhu-api-production.up.railway.app";
const photoPath = process.argv[2];
const N = Number(process.argv[3] || 5);

if (!photoPath) {
  console.error("Использование: npx tsx scripts/load-test-photo.ts путь\\к\\фото.jpg [число_параллельных]");
  process.exit(1);
}

const imageBuffer = readFileSync(photoPath);

async function oneRequest(idx: number) {
  const started = Date.now();
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `loadphoto-${Date.now()}-${idx}@kbzhu.local`,
      password: "loadtest12345",
      sex: "m",
      age: 28,
      heightCm: 178,
      bodyweightKg: 82,
      goal: "maintain",
      trainingDays: [1, 3, 5],
    }),
  });
  const { token } = (await regRes.json()) as { token: string };

  const form = new FormData();
  form.append("file", new Blob([imageBuffer]), "meal.jpg");
  const photoRes = await fetch(`${BASE}/meals/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const elapsed = Date.now() - started;
  const body = (await photoRes.json()) as { items?: unknown[] };
  const recognized = Array.isArray(body.items) && body.items.length > 0;
  return { idx, status: photoRes.status, elapsedMs: elapsed, recognized };
}

async function main() {
  console.log(`→ Запускаю ${N} параллельных загрузок фото на ${BASE}...`);
  const started = Date.now();
  const results = await Promise.all(Array.from({ length: N }, (_, i) => oneRequest(i)));
  const totalElapsed = Date.now() - started;

  console.table(results);
  const maxSingle = Math.max(...results.map((r) => r.elapsedMs));
  console.log(`\nОбщее время на все ${N} запросов параллельно: ${totalElapsed}мс`);
  console.log(`Самый долгий одиночный запрос: ${maxSingle}мс`);
  console.log(
    totalElapsed < maxSingle * 1.5
      ? "✅ Параллельные запросы не сериализуются — общее время близко к самому долгому одиночному (event loop не блокируется)."
      : "⚠ Общее время заметно больше самого долгого одиночного — похоже на сериализацию, стоит присмотреться.",
  );
}

main();
