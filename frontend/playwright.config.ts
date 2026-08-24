import { defineConfig, devices } from "@playwright/test";

// Блок 11 — кроссбраузерное/мобильное тестирование. По факту сети в этой
// рабочей среде удалось скачать только движок Chromium — Firefox/WebKit
// не докачались (тот же класс сетевых ограничений, что раньше был с
// Railway, см. [[хостинг]]). Поэтому здесь три Chromium-профиля: десктоп +
// два мобильных вьюпорта (эмуляция размера экрана и user-agent, без
// реального WebKit-движка). Firefox/Safari — см. README.md рядом, нужна
// разовая ручная проверка с машины, где сеть открыта.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Сеть в этой рабочей среде временами отваливается на отдельные внешние
  // хосты (тот же класс перебоев, что раньше видели с Railway, см.
  // [[хостинг]]) — не системная блокировка, а именно временные обрывы.
  // Ретраи компенсируют это, не пряча реальные баги (сравните упавший тест
  // с одиночным ERR_CONNECTION_CLOSED и стабильно падающий тест — вторые
  // ретраи не спасут).
  retries: 2,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://kbzhu-frontend.vercel.app",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    // devices["Pixel 7"] уже настроен на движок chromium — годится как есть.
    { name: "mobile-chromium (Pixel 7)", use: { ...devices["Pixel 7"] } },
    // devices["iPhone 14"] по умолчанию тянет webkit (его тут нет) — берём
    // только вьюпорт/UA/touch от пресета, движок явно фиксируем на chromium.
    {
      name: "mobile-chromium (вьюпорт iPhone 14)",
      use: {
        browserName: "chromium",
        viewport: devices["iPhone 14"].viewport,
        userAgent: devices["iPhone 14"].userAgent,
        isMobile: devices["iPhone 14"].isMobile,
        hasTouch: devices["iPhone 14"].hasTouch,
        deviceScaleFactor: devices["iPhone 14"].deviceScaleFactor,
      },
    },
  ],
});
