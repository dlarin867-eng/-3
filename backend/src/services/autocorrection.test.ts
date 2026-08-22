import { describe, expect, it } from "vitest";
import { evaluateAutocorrection, type WeightPoint } from "./autocorrection.js";

const now = new Date("2026-08-22T12:00:00");

function daysAgo(n: number): Date {
  return new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
}

describe("evaluateAutocorrection", () => {
  it("недостаточно точек за окно -> ничего не предлагает", () => {
    const logs: WeightPoint[] = [
      { weightKg: 80, loggedAt: daysAgo(10) },
      { weightKg: 79, loggedAt: daysAgo(2) },
    ];
    expect(evaluateAutocorrection("cut", logs, 2400, now)).toBeNull();
  });

  it("окно короче 7 дней -> не предлагает, даже если точек достаточно (ФТ-7.3)", () => {
    const logs: WeightPoint[] = [
      { weightKg: 80, loggedAt: daysAgo(3) },
      { weightKg: 79.8, loggedAt: daysAgo(2) },
      { weightKg: 79.7, loggedAt: daysAgo(1) },
    ];
    expect(evaluateAutocorrection("cut", logs, 2400, now)).toBeNull();
  });

  it("сушка: вес снижается как ожидалось -> ничего не предлагает", () => {
    const logs: WeightPoint[] = [
      { weightKg: 82, loggedAt: daysAgo(14) },
      { weightKg: 81, loggedAt: daysAgo(7) },
      { weightKg: 81.3, loggedAt: daysAgo(0) }, // -0.7кг за 14дн ≈ -0.35кг/нед, в допуске около -0.5
    ];
    expect(evaluateAutocorrection("cut", logs, 2400, now)).toBeNull();
  });

  it("сушка: вес стоит на месте -> предлагает убрать калории", () => {
    const logs: WeightPoint[] = [
      { weightKg: 82.0, loggedAt: daysAgo(14) },
      { weightKg: 82.1, loggedAt: daysAgo(7) },
      { weightKg: 82.0, loggedAt: daysAgo(0) },
    ];
    const suggestion = evaluateAutocorrection("cut", logs, 2400, now);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.deltaCalories).toBeLessThan(0);
    expect(suggestion!.toCalories).toBe(2400 + suggestion!.deltaCalories);
  });

  it("набор массы: вес не растёт -> предлагает добавить калории", () => {
    const logs: WeightPoint[] = [
      { weightKg: 75.0, loggedAt: daysAgo(14) },
      { weightKg: 75.0, loggedAt: daysAgo(7) },
      { weightKg: 75.0, loggedAt: daysAgo(0) },
    ];
    const suggestion = evaluateAutocorrection("bulk", logs, 2800, now);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.deltaCalories).toBeGreaterThan(0);
  });

  it("поддержание: вес стабилен -> ничего не предлагает", () => {
    const logs: WeightPoint[] = [
      { weightKg: 78.0, loggedAt: daysAgo(14) },
      { weightKg: 78.02, loggedAt: daysAgo(7) },
      { weightKg: 78.05, loggedAt: daysAgo(0) },
    ];
    expect(evaluateAutocorrection("maintain", logs, 2500, now)).toBeNull();
  });

  it("поддержание: вес заметно уходит вниз -> предлагает добавить калории", () => {
    const logs: WeightPoint[] = [
      { weightKg: 78.0, loggedAt: daysAgo(14) },
      { weightKg: 77.2, loggedAt: daysAgo(7) },
      { weightKg: 76.5, loggedAt: daysAgo(0) },
    ];
    const suggestion = evaluateAutocorrection("maintain", logs, 2500, now);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.deltaCalories).toBeGreaterThan(0);
  });
});
