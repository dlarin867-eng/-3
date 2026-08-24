// Проверка не общей механики, а именно продовой функции recognizeMealPhoto()
// из openrouter-vision.ts — того самого кода, который вызывает POST /meals/photo.
// Запуск: npx tsx scripts/test-recognize-meal.ts путь\к\фото.jpg
import "dotenv/config";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { recognizeMealPhoto } from "../src/integrations/openrouter-vision.js";

const photoPath = process.argv[2];
if (!photoPath) {
  console.error("Укажи путь к фото: npx tsx scripts/test-recognize-meal.ts путь\\к\\фото.jpg");
  process.exit(1);
}

const ext = extname(photoPath).toLowerCase();
const mediaType = ext === ".png" ? "image/png" : "image/jpeg";
const imageBase64 = readFileSync(photoPath).toString("base64");

console.log("→ Вызываю recognizeMealPhoto()...");
const started = Date.now();
const dishes = await recognizeMealPhoto(imageBase64, mediaType);
console.log(`→ Заняло ${Date.now() - started} мс`);

if (dishes === null) {
  console.log("❌ null — таймаут, ошибка API или ключ не настроен (см. openrouter-vision.ts)");
} else {
  console.log(`✅ Распознано блюд: ${dishes.length}`);
  console.table(dishes);
}
