import { describe, expect, it } from "vitest";
import { isTrainingDay } from "./carb-cycling.js";

describe("isTrainingDay", () => {
  it("понедельник = индекс 0", () => {
    const monday = new Date("2026-08-24T12:00:00"); // 24.08.2026 — понедельник
    expect(isTrainingDay([0], monday)).toBe(true);
    expect(isTrainingDay([1], monday)).toBe(false);
  });

  it("воскресенье = индекс 6", () => {
    const sunday = new Date("2026-08-30T12:00:00"); // 30.08.2026 — воскресенье
    expect(isTrainingDay([6], sunday)).toBe(true);
    expect(isTrainingDay([0], sunday)).toBe(false);
  });

  it("пустой список тренировочных дней -> всегда день отдыха", () => {
    expect(isTrainingDay([], new Date())).toBe(false);
  });
});
