// Блок 11 — кроссбраузерное/мобильное тестирование + UX онбординга.
// Гоняется на живом деплое (kbzhu-frontend.vercel.app по умолчанию, см.
// playwright.config.ts) — не на локальном dev-сервере, поэтому и правда
// бьёт по настоящему backend+БД на Railway, как и ручные проверки
// фаундера в блоке 10.
import { test, expect } from "@playwright/test";

test.describe("Лендинг", () => {
  test("ключевой контент присутствует", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Кольца и Дни").first()).toBeVisible();
    // Pricing и FAQ — секции из блока 9, проверяем что не потерялись.
    await expect(page.getByText(/FAQ|Частые вопросы/i)).toBeVisible();
  });

  test("нет горизонтального скролла (мобильный вьюпорт)", async ({ page }) => {
    await page.goto("/");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    // +1 — субпиксельные округления браузера, не считаем за реальный оверфлоу.
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("CTA лендинга пропускает шаг приветствия (§5.1)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Начать считать по-тренировочному" }).click();
    await expect(page).toHaveURL(/\/onboarding\?entry=landing/);
    // Первый шаг при entry=landing — "Твоя цель", не приветственный экран.
    await expect(page.getByRole("heading", { name: "Твоя цель" })).toBeVisible();
  });
});

test.describe("Онбординг → главный экран (демо-режим)", () => {
  test("полный квиз до /main с реальной регистрацией", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/onboarding");

    await page.getByRole("button", { name: "Начать" }).click();

    await expect(page.getByRole("heading", { name: "Твоя цель" })).toBeVisible();
    await page.getByRole("button", { name: "Поддержание" }).click();
    await page.getByRole("button", { name: "Далее" }).click();

    await expect(page.getByRole("heading", { name: "Пол" })).toBeVisible();
    await page.getByRole("button", { name: "Мужской" }).click();
    await page.getByRole("button", { name: "Далее" }).click();

    await expect(page.getByRole("heading", { name: "Возраст, рост и вес" })).toBeVisible();
    await page.getByLabel("Возраст, лет").fill("28");
    await page.getByLabel("Рост, см").fill("178");
    await page.getByLabel("Вес, кг").fill("82");
    await page.getByRole("button", { name: "Далее" }).click();

    await expect(page.getByRole("heading", { name: "Уровень активности" })).toBeVisible();
    await page.getByRole("button", { name: "Умеренная" }).click();
    await page.getByRole("button", { name: "Далее" }).click();

    await expect(page.getByRole("heading", { name: "Тренировочные дни" })).toBeVisible();
    await page.getByRole("button", { name: "Пн" }).click();
    await page.getByRole("button", { name: "Ср" }).click();
    await page.getByRole("button", { name: "Пт" }).click();
    await page.getByRole("button", { name: "Далее" }).click();

    await expect(page.getByRole("heading", { name: "Время тренировки" })).toBeVisible();
    await page.getByRole("button", { name: "Пропустить" }).click();

    await expect(page.getByRole("heading", { name: "Сохраним твою норму" })).toBeVisible();
    await page.getByRole("button", { name: "Посмотреть демо без регистрации" }).click();

    await expect(page.getByRole("heading", { name: /вот твоя норма на сегодня/ })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Начать пользоваться" }).click();

    await expect(page).toHaveURL(/\/main/);
    await expect(page.getByText("ккал на сегодня")).toBeVisible({ timeout: 10000 });
  });
});
