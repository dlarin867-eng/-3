// Публикация поста в Telegram-канал через Bot API — та же механика, что и
// с OpenRouter: токен в .env, обычный HTTP-запрос, ничего специфичного
// не нужно. Пригодится один в один для Telegram-бота на курсе.
//
// Запуск: npx tsx scripts/telegram-post.ts "текст поста в HTML-разметке Telegram"
// (или без аргумента — постит текст, зашитый ниже, как дефолт)
import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHANNEL; // "@username" или числовой chat_id

if (!token || !chatId) {
  console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL не заданы в .env");
  process.exit(1);
}

const text =
  process.argv[2] ??
  `🟢 <b>Кольца и Дни</b> — счётчик калорий для тех, кто реально тренируется

Обычные трекеры дают одну норму КБЖУ на весь месяц. Но дни у тебя не одинаковые: в день тренировки телу нужно больше углеводов, в день отдыха — меньше.

Что умеет:
📸 Фото еды → ИИ сам считает калории и БЖУ
🔁 Норма пересчитывается автоматически: тренировочный день / день отдыха
💪 Спортпит (протеин, креатин, гейнер) — отдельно от обычной еды, без поиска и взвешивания
⚖️ Автокоррекция нормы по факту динамики веса — не по формуле, а по тому, что реально происходит с телом

Сейчас — рабочая бета. Можно посмотреть демо без регистрации: https://kbzhu-frontend.vercel.app

📌 Если будете пробовать загрузить фото — откройте ссылку в обычном браузере (⋮ → «Открыть в браузере»), не во встроенном — так камера сработает без сбоев.

Дальше докручиваем по фидбэку — пишите сюда, что не так и чего не хватает.`;

async function main() {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      link_preview_options: { url: "https://kbzhu-frontend.vercel.app" },
    }),
  });
  const body = await res.json();
  if (!body.ok) {
    console.error("❌ Telegram API вернул ошибку:", JSON.stringify(body, null, 2));
    process.exit(1);
  }
  console.log("✅ Опубликовано:", `https://t.me/${body.result.chat.username}/${body.result.message_id}`);
}

main();
