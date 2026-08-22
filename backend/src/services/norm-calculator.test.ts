import { describe, expect, it } from "vitest";
import { clampProteinGPerKg, computeBmr, computeDailyTarget } from "./norm-calculator.js";

describe("computeBmr", () => {
  it("считает по формуле Миффлина-Сан Жеора для мужчины", () => {
    // 10*82 + 6.25*178 - 5*28 + 5 = 820 + 1112.5 - 140 + 5 = 1797.5
    expect(computeBmr({ sex: "m", age: 28, heightCm: 178, bodyweightKg: 82 })).toBeCloseTo(1797.5, 1);
  });

  it("считает по формуле Миффлина-Сан Жеора для женщины", () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(computeBmr({ sex: "f", age: 25, heightCm: 165, bodyweightKg: 60 })).toBeCloseTo(1345.25, 1);
  });
});

describe("clampProteinGPerKg", () => {
  it("не трогает значения в разумном диапазоне", () => {
    expect(clampProteinGPerKg(1.8)).toBe(1.8);
    expect(clampProteinGPerKg(2.6)).toBe(2.6);
  });

  it("никогда не пропускает выше жёсткого потолка, даже если сломалась проверка выше по цепочке", () => {
    expect(clampProteinGPerKg(10)).toBeLessThanOrEqual(3.5);
  });

  it("не уходит ниже разумного минимума", () => {
    expect(clampProteinGPerKg(0.1)).toBeGreaterThanOrEqual(0.8);
  });
});

describe("computeDailyTarget", () => {
  const baseProfile = {
    sex: "m" as const,
    age: 28,
    heightCm: 178,
    bodyweightKg: 82,
    activityFactor: 1.375,
    goal: "maintain" as const,
    proteinTargetGPerKg: 1.8,
  };

  it("белок одинаков в тренировочный день и в день отдыха (ФТ-4.3)", () => {
    const training = computeDailyTarget(baseProfile, true);
    const rest = computeDailyTarget(baseProfile, false);
    expect(training.proteinG).toBe(rest.proteinG);
  });

  it("углеводов больше в тренировочный день, чем в день отдыха (ФТ-4.2)", () => {
    const training = computeDailyTarget(baseProfile, true);
    const rest = computeDailyTarget(baseProfile, false);
    expect(training.carbsG).toBeGreaterThan(rest.carbsG);
  });

  it("калорийность в день отдыха компенсируется в основном жирами, а не пропадает совсем", () => {
    const training = computeDailyTarget(baseProfile, true);
    const rest = computeDailyTarget(baseProfile, false);
    expect(rest.fatG).toBeGreaterThan(training.fatG);
    expect(rest.calories).toBeGreaterThan(0);
  });

  it("на сушке итоговые калории ниже, чем на наборе, при прочих равных", () => {
    const cut = computeDailyTarget({ ...baseProfile, goal: "cut", proteinTargetGPerKg: 2.6 }, true);
    const bulk = computeDailyTarget({ ...baseProfile, goal: "bulk" }, true);
    expect(cut.calories).toBeLessThan(bulk.calories);
  });

  it("жиры никогда не уходят в ноль даже при высоком белке и агрессивной сушке", () => {
    const target = computeDailyTarget(
      { ...baseProfile, goal: "cut", proteinTargetGPerKg: 3.1, bodyweightKg: 60 },
      false,
    );
    expect(target.fatG).toBeGreaterThan(0);
  });
});
