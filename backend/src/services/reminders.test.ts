import { describe, expect, it } from "vitest";
import { computeEveningProteinGap, evaluateUpcomingReminder, isEveningSummaryTime } from "./reminders.js";

describe("evaluateUpcomingReminder", () => {
  it("не тренировочный день -> ничего", () => {
    const now = new Date("2026-08-24T17:00:00");
    expect(evaluateUpcomingReminder(now, "18:30", false, true)).toBeNull();
  });

  it("тренировка через 1.5 часа и последний приём низкоуглеводный -> предупреждение по углеводам", () => {
    const now = new Date("2026-08-24T17:00:00");
    const result = evaluateUpcomingReminder(now, "18:30", true, true);
    expect(result?.type).toBe("pre_workout_carb_warning");
  });

  it("тренировка через 1.5 часа, но последний приём НЕ низкоуглеводный -> ничего", () => {
    const now = new Date("2026-08-24T17:00:00");
    expect(evaluateUpcomingReminder(now, "18:30", true, false)).toBeNull();
  });

  it("тренировка была час назад -> напоминание про белок", () => {
    const now = new Date("2026-08-24T19:30:00");
    const result = evaluateUpcomingReminder(now, "18:30", true, false);
    expect(result?.type).toBe("post_workout_protein_reminder");
  });

  it("тренировка была 5 часов назад -> уже не актуально", () => {
    const now = new Date("2026-08-24T23:30:00");
    expect(evaluateUpcomingReminder(now, "18:30", true, false)).toBeNull();
  });
});

describe("computeEveningProteinGap", () => {
  it("считает разницу нормы и съеденного", () => {
    expect(computeEveningProteinGap(180, 142)).toBe(38);
  });

  it("никогда не уходит в минус, если белка съедено больше нормы", () => {
    expect(computeEveningProteinGap(180, 200)).toBe(0);
  });
});

describe("isEveningSummaryTime", () => {
  it("до времени сводки -> false", () => {
    expect(isEveningSummaryTime(new Date("2026-08-24T19:00:00"), "20:00")).toBe(false);
  });

  it("после времени сводки -> true", () => {
    expect(isEveningSummaryTime(new Date("2026-08-24T20:05:00"), "20:00")).toBe(true);
  });
});
