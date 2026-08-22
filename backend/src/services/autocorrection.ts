// Блок 6 — еженедельная автокоррекция нормы по факту динамики веса
// (ФТ-7.3-7.4): раз в 7-14 дней сравниваем фактический тренд с ожидаемым для
// цели и предлагаем сдвиг калорий. Чистая функция — сама решает, не пишет в
// БД (запись/применение — дело роута, см. api/routes/weight.ts).

import type { Goal } from "./norm-calculator.js";

export interface WeightPoint {
  weightKg: number;
  loggedAt: Date;
}

export interface AutocorrectionSuggestion {
  fromCalories: number;
  toCalories: number;
  deltaCalories: number;
  reason: string;
}

// Разумные недельные ориентиры для тренирующихся (не медицинская норма —
// эвристика для решения "двигается ли вес туда, куда должен").
const EXPECTED_WEEKLY_RATE_KG: Record<Goal, number> = {
  bulk: 0.25,
  maintain: 0,
  cut: -0.5,
};
const TOLERANCE_KG_PER_WEEK = 0.15;
const ADJUSTMENT_STEP_CALORIES = 150;
const MIN_SPAN_DAYS = 7;
const MAX_SPAN_DAYS = 14;
const MIN_POINTS = 3;

export function evaluateAutocorrection(
  goal: Goal,
  weightLogs: WeightPoint[],
  currentDailyCalories: number,
  now = new Date(),
): AutocorrectionSuggestion | null {
  const windowStart = new Date(now.getTime() - MAX_SPAN_DAYS * 24 * 60 * 60 * 1000);
  const recent = weightLogs
    .filter((l) => l.loggedAt >= windowStart && l.loggedAt <= now)
    .sort((a, b) => a.loggedAt.getTime() - b.loggedAt.getTime());

  if (recent.length < MIN_POINTS) return null; // недостаточно данных за окно — не предлагаем наугад

  const first = recent[0];
  const last = recent[recent.length - 1];
  const spanDays = (last.loggedAt.getTime() - first.loggedAt.getTime()) / (24 * 60 * 60 * 1000);
  if (spanDays < MIN_SPAN_DAYS) return null; // ФТ-7.3: не чаще раза в 7-14 дней

  const deltaKg = last.weightKg - first.weightKg;
  const weeklyRateKg = deltaKg / (spanDays / 7);
  const expected = EXPECTED_WEEKLY_RATE_KG[goal];

  const onTrack =
    goal === "maintain"
      ? Math.abs(weeklyRateKg) <= TOLERANCE_KG_PER_WEEK
      : goal === "bulk"
        ? weeklyRateKg >= expected - TOLERANCE_KG_PER_WEEK
        : weeklyRateKg <= expected + TOLERANCE_KG_PER_WEEK; // cut

  if (onTrack) return null;

  // Не движется как должен: сушка не худеет / набор не растёт -> добавить
  // калорий на наборе, убрать на сушке. На поддержании — вернуть к нулю.
  const direction =
    goal === "cut" ? -1 : goal === "bulk" ? 1 : weeklyRateKg > 0 ? -1 : 1;
  const deltaCalories = direction * ADJUSTMENT_STEP_CALORIES;
  const toCalories = currentDailyCalories + deltaCalories;

  const trendText =
    goal === "cut"
      ? "вес не снижается как ожидалось"
      : goal === "bulk"
        ? "вес не растёт как ожидалось"
        : "вес заметно уходит от стабильного";

  return {
    fromCalories: currentDailyCalories,
    toCalories,
    deltaCalories,
    reason: `За последние ${Math.round(spanDays)} дн. ${trendText} (${weeklyRateKg >= 0 ? "+" : ""}${weeklyRateKg.toFixed(2)} кг/нед).`,
  };
}
