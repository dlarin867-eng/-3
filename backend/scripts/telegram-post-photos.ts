// Публикация альбома фото в Telegram-канал (sendMediaGroup) — та же
// механика Bot API, что и telegram-post.ts, просто multipart вместо JSON.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHANNEL;

if (!token || !chatId) {
  console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL не заданы в .env");
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Использование: npx tsx scripts/telegram-post-photos.ts фото1.png фото2.png ...");
  process.exit(1);
}

const CAPTION =
  `Как это выглядит в реальном приложении — не мокапы, живой прод 👆

Лендинг → главный экран (норма пересчиталась под тренировочный день) → результат распознавания фото еды.`;

async function main() {
  const form = new FormData();
  const media = files.map((filePath, i) => {
    const field = `photo${i}`;
    form.append(field, new Blob([readFileSync(filePath)]), basename(filePath));
    return {
      type: "photo",
      media: `attach://${field}`,
      ...(i === 0 ? { caption: CAPTION } : {}),
    };
  });
  form.append("chat_id", chatId);
  form.append("media", JSON.stringify(media));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
    method: "POST",
    body: form,
  });
  const body = await res.json();
  if (!body.ok) {
    console.error("❌ Telegram API вернул ошибку:", JSON.stringify(body, null, 2));
    process.exit(1);
  }
  const msg = body.result[0];
  console.log("✅ Опубликовано:", `https://t.me/${msg.chat.username}/${msg.message_id}`);
}

main();
