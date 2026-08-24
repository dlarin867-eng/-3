// Блок 5/11 — распознавание блюда по фото через OpenRouter (openrouter.ai)
// вместо прямого Anthropic API (см. claude-vision.ts). Тот же контракт
// recognizeMealPhoto(), тот же fallback на null при таймауте/без ключа —
// вызывающий код (api/routes/meals.ts, через ai-vision.ts) не знает и не
// должен знать, какой провайдер сейчас активен.
//
// Зачем отдельный файл, а не просто смена URL в claude-vision.ts:
// OpenRouter — не ещё один провайдер модели, а шлюз к сотням моделей разных
// провайдеров (OpenAI, Anthropic, Google, Meta, ...) через ОДИН ключ и ОДИН
// OpenAI-совместимый формат запроса (POST .../chat/completions,
// Authorization: Bearer <ключ>). Это ровно та механика, которая потом
// пригодится для Telegram-бота на курсе — код ниже написан так, чтобы
// комментарии объясняли "почему так", а не только "что".
//
// Почему JSON текстом, а не forced tool_choice (как в claude-vision.ts):
// OPENROUTER_MODEL по умолчанию — "openrouter/free", бесплатный роутер,
// который сам выбирает одну из доступных бесплатных моделей на каждый
// запрос. Нет гарантии, что конкретная модель под капотом вообще
// поддерживает строгий structured tool-calling конкретного провайдера.
// Универсальный контракт, который работает почти везде, — попросить модель
// вернуть чистый JSON текстом и распарсить его самим, а не полагаться на
// provider-specific structured output.

import { env } from "../config/env.js";
import type { RecognizedDish } from "./meal-recognition.types.js";

// НФТ 5.1: тот же бюджет по времени, что и у прямого Anthropic API — 8с,
// иначе таймаут -> ручной ввод (см. api/routes/meals.ts).
const RECOGNITION_TIMEOUT_MS = 8000;
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const PROMPT =
  "На фото — приём пищи человека, который тренируется в зале. Определи все блюда, " +
  "оцени вес порции и КБЖУ каждого, и честно оцени свою уверенность (confidence): " +
  "high — уверен в блюде и примерном весе, medium — уверен в блюде, но вес приблизительный, " +
  "low — не уверен в самом блюде или составе. Лучше занизить confidence, чем притвориться уверенным.\n\n" +
  "Верни ТОЛЬКО валидный JSON без markdown-разметки и пояснений, ровно в этой форме:\n" +
  '{"dishes":[{"name":"строка по-русски","weight_g":число,"calories":число,' +
  '"protein_g":число,"carbs_g":число,"fat_g":число,"confidence":"high|medium|low"}]}';

/**
 * Достаёт JSON-объект из текстового ответа модели. Даже с явным запросом
 * "только JSON" некоторые модели всё равно оборачивают ответ в ```json
 * fences или добавляют пояснение до/после — вырезаем сам объект по первой
 * и последней фигурной скобке, а не падаем на JSON.parse сырого текста.
 */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Возвращает null при таймауте/недоступности/отсутствии ключа — тот же
 * fallback-контракт, что и claude-vision.ts: вызывающий роут оставляет
 * запись черновиком без items, пользователь заполняет вручную.
 */
export async function recognizeMealPhoto(imageBase64: string, mediaType: string): Promise<RecognizedDish[] | null> {
  if (!env.OPENROUTER_API_KEY) return null; // ключ не настроен — тот же fallback, что и таймаут

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RECOGNITION_TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        // Необязательные заголовки — OpenRouter показывает их в своей
        // статистике/лидерборде запросов, на работу API не влияют.
        "HTTP-Referer": "https://kbzhu-frontend.vercel.app",
        "X-Title": "Кольца и Дни",
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return null; // например, невалидный ключ или модель недоступна — тот же fallback

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = body.choices?.[0]?.message?.content;
    if (!text) return null;

    const parsed = extractJson(text) as { dishes?: Array<Record<string, unknown>> } | null;
    if (!parsed?.dishes) return null;

    return parsed.dishes.map((d) => ({
      name: String(d.name),
      weightG: Number(d.weight_g),
      calories: Number(d.calories),
      proteinG: Number(d.protein_g),
      carbsG: Number(d.carbs_g),
      fatG: Number(d.fat_g),
      confidence: (d.confidence as RecognizedDish["confidence"]) ?? "low",
    }));
  } catch {
    return null; // таймаут или сетевая ошибка — тот же путь, что и "ключ не настроен"
  } finally {
    clearTimeout(timer);
  }
}
