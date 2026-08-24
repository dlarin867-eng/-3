// Изолированный смок-тест механики OpenRouter — специально НЕ импортирует
// src/config/env.ts (тот требует DATABASE_URL/JWT_SECRET для полного
// приложения) и не идёт через openrouter-vision.ts/ai-vision.ts. Цель —
// проверить именно связку "ключ → запрос → ответ" напрямую, без остальной
// части бэкенда, которая тут не нужна.
//
// Запуск: npx tsx scripts/test-openrouter.ts путь\к\фото.jpg

import "dotenv/config";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || "openrouter/free";
const photoPath = process.argv[2];

if (!apiKey) {
  console.error("❌ OPENROUTER_API_KEY не найден в backend/.env — открой файл и вставь ключ между кавычками.");
  process.exit(1);
}
if (!photoPath) {
  console.error("❌ Укажи путь к фото еды: npx tsx scripts/test-openrouter.ts C:\\путь\\к\\фото.jpg");
  process.exit(1);
}

const ext = extname(photoPath).toLowerCase();
const mediaType = ext === ".png" ? "image/png" : "image/jpeg";
const imageBase64 = readFileSync(photoPath).toString("base64");

console.log(`→ Ключ найден (${apiKey.slice(0, 12)}...), модель: ${model}`);
console.log(`→ Отправляю фото (${(imageBase64.length / 1024).toFixed(0)} КБ base64) на OpenRouter...`);

const started = Date.now();

const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://kbzhu-frontend.vercel.app",
    "X-Title": "kbzhu-openrouter-test",
  },
  body: JSON.stringify({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Что изображено на фото? Ответь одним коротким предложением по-русски." },
          { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
        ],
      },
    ],
  }),
});

const elapsed = Date.now() - started;
console.log(`→ Ответ пришёл за ${elapsed} мс, статус ${response.status}`);

const body = await response.json();

if (!response.ok) {
  console.error("❌ OpenRouter вернул ошибку:");
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log("✅ Успех! Ответ модели:");
console.log(body.choices?.[0]?.message?.content ?? "(пустой content — см. полный ответ ниже)");
console.log("\nПолный JSON-ответ (для понимания структуры):");
console.log(JSON.stringify(body, null, 2));
