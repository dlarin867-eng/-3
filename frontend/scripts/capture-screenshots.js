// Скриншоты живого прода для поста в Telegram-канал. Обычный Node-скрипт
// (не .ts — во frontend нет tsx), использует Chromium, который уже стоит
// после блока 11 (Playwright).
const { chromium } = require("@playwright/test");
const path = require("path");

const BASE = process.env.E2E_BASE_URL || "https://kbzhu-frontend.vercel.app";
const OUT_DIR = path.join(__dirname, "..", "..", "backend", "scripts", "shots");
const PHOTO_PATH = process.argv[2] || "C:\\Users\\User\\Documents\\ShareX\\Screenshots\\2026-08\\chrome_LK9VCRKVgE.png";

const mobileViewport = { width: 390, height: 844 }; // iPhone 14-ish, но на chromium

async function main() {
  const fs = require("fs");
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();

  // 1. Лендинг — hero-секция, десктоп (лендинг рассчитан на широкий экран).
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}/`);
    await page.screenshot({ path: path.join(OUT_DIR, "1-landing.png") });
    await page.close();
    console.log("✅ 1-landing.png");
  }

  // 2-3. Онбординг демо-режимом -> /main -> /photo с реальным фото.
  const page = await browser.newPage({ viewport: mobileViewport });
  await page.goto(`${BASE}/onboarding`);
  await page.getByRole("button", { name: "Начать" }).click();
  await page.getByRole("button", { name: "Поддержание" }).click();
  await page.getByRole("button", { name: "Далее" }).click();
  await page.getByRole("button", { name: "Мужской" }).click();
  await page.getByRole("button", { name: "Далее" }).click();
  await page.getByLabel("Возраст, лет").fill("28");
  await page.getByLabel("Рост, см").fill("178");
  await page.getByLabel("Вес, кг").fill("82");
  await page.getByRole("button", { name: "Далее" }).click();
  await page.getByRole("button", { name: "Умеренная" }).click();
  await page.getByRole("button", { name: "Далее" }).click();
  await page.getByRole("button", { name: "Пн" }).click();
  await page.getByRole("button", { name: "Ср" }).click();
  await page.getByRole("button", { name: "Пт" }).click();
  await page.getByRole("button", { name: "Далее" }).click();
  await page.getByRole("button", { name: "Пропустить" }).click();
  await page.getByRole("button", { name: "Посмотреть демо без регистрации" }).click();
  await page.getByRole("heading", { name: /вот твоя норма на сегодня/ }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Начать пользоваться" }).click();
  await page.waitForURL(/\/main/);
  await page.getByText("ккал на сегодня").waitFor({ timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, "2-main.png") });
  console.log("✅ 2-main.png");

  // 4. /photo — до нескольких попыток, чтобы поймать успешное распознавание
  // (бесплатная модель нестабильна, см. журнал 2026-08-24), а не пустой fallback.
  let success = false;
  for (let attempt = 1; attempt <= 4 && !success; attempt++) {
    await page.goto(`${BASE}/photo`);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PHOTO_PATH);
    // "Распознаём блюдо…" -> результат (до RECOGNITION_TIMEOUT_MS=30с + запас)
    await page
      .locator("text=Распознаём блюдо")
      .waitFor({ state: "hidden", timeout: 35000 })
      .catch(() => {});
    const hasItems = await page
      .getByText("Подтвердить", { exact: true })
      .isVisible()
      .catch(() => false);
    console.log(`попытка ${attempt}: ${hasItems ? "распознано" : "fallback"}`);
    if (hasItems) {
      success = true;
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, "3-photo-result.png") });
      console.log("✅ 3-photo-result.png (успешное распознавание)");
    }
  }
  if (!success) {
    await page.screenshot({ path: path.join(OUT_DIR, "3-photo-result.png") });
    console.log("⚠ 3-photo-result.png (не удалось поймать успех за 4 попытки — сохранил fallback-состояние)");
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
