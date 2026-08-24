// Диагностика: тот же запрос, что в openrouter-vision.ts, но с длинным
// таймаутом (30с вместо 8с) — чтобы понять, реальная ли это ошибка, или
// просто конкретная модель, которую в этот раз выбрал openrouter/free,
// думает дольше, чем отведённый бюджет НФТ 5.1.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const apiKey = process.env.OPENROUTER_API_KEY!;
const model = process.env.OPENROUTER_MODEL || "openrouter/free";
const photoPath = process.argv[2];
const ext = extname(photoPath).toLowerCase();
const mediaType = ext === ".png" ? "image/png" : "image/jpeg";
const imageBase64 = readFileSync(photoPath).toString("base64");

const PROMPT =
  "На фото — приём пищи человека, который тренируется в зале. Определи все блюда, " +
  "оцени вес порции и КБЖУ каждого, и честно оцени свою уверенность (confidence): " +
  "high — уверен в блюде и примерном весе, medium — уверен в блюде, но вес приблизительный, " +
  "low — не уверен в самом блюде или составе. Лучше занизить confidence, чем притвориться уверенным.\n\n" +
  "Верни ТОЛЬКО валидный JSON без markdown-разметки и пояснений, ровно в этой форме:\n" +
  '{"dishes":[{"name":"строка по-русски","weight_g":число,"calories":число,' +
  '"protein_g":число,"carbs_g":число,"fat_g":число,"confidence":"high|medium|low"}]}';

const started = Date.now();
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 60000);

try {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Title": "kbzhu-diag",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64}` } }] }],
    }),
  });
  const body = await response.json();
  console.log(`Заняло ${Date.now() - started} мс, модель под капотом: ${body.model}`);
  console.log("content:", body.choices?.[0]?.message?.content);
  console.log("reasoning_tokens:", body.usage?.completion_tokens_details?.reasoning_tokens ?? "н/д");
} finally {
  clearTimeout(timer);
}
