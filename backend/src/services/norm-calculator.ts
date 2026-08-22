// Блок 6 — расчёт стартовой и дневной нормы КБЖУ.
// Источники: техзадание.md ФТ-1.2 (формула), ФТ-1.4/НФТ 5.4 (границы белка),
// ФТ-4.2 (диапазоны углеводов по типу дня), идея.md раздел 5 (структура данных).

export type Sex = "m" | "f";
export type Goal = "bulk" | "maintain" | "cut";

export interface UserProfileForCalc {
  sex: Sex;
  age: number;
  heightCm: number;
  bodyweightKg: number;
  activityFactor: number;
  goal: Goal;
  proteinTargetGPerKg: number;
}

export interface DailyMacroTarget {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

// НФТ 5.4: значения выше 3,0 г/кг требуют явного подтверждения (см.
// api/routes/users.ts) — это UX-гейт. Здесь, в самом расчёте, отдельный
// жёсткий потолок как defense-in-depth: что бы ни случилось выше по цепочке
// вызовов, автокоррекция и расчёт нормы никогда не подставят абсурдное
// значение белка в формулу.
const PROTEIN_HARD_CEILING_G_PER_KG = 3.5;

const GOAL_CALORIE_MULTIPLIER: Record<Goal, number> = {
  bulk: 1.12,
  maintain: 1.0,
  cut: 0.82,
};

// ФТ-4.2: 2,0-2,5 г/кг в тренировочный день, 0,5-1,0 г/кг в день отдыха.
// Берём середину диапазона как разумное значение по умолчанию.
const TRAINING_DAY_CARB_G_PER_KG = 2.2;
const REST_DAY_CARB_G_PER_KG = 0.7;

// Жиры не должны уходить в ноль даже при агрессивном дефиците — минимум для
// гормонального здоровья, стандартный ориентир спортивной диетологии.
const MIN_FAT_G_PER_KG = 0.6;

export function clampProteinGPerKg(value: number): number {
  return Math.min(Math.max(value, 0.8), PROTEIN_HARD_CEILING_G_PER_KG);
}

/** Базовый обмен веществ по формуле Миффлина-Сан Жеора (ФТ-1.2). */
export function computeBmr(profile: Pick<UserProfileForCalc, "sex" | "age" | "heightCm" | "bodyweightKg">): number {
  const base = 10 * profile.bodyweightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return profile.sex === "m" ? base + 5 : base - 161;
}

/**
 * Дневная норма КБЖУ с учётом типа дня (ФТ-4.1-4.4): белок постоянен,
 * углеводы циклируются, калорийность в день отдыха компенсируется жирами.
 */
export function computeDailyTarget(profile: UserProfileForCalc, isTrainingDay: boolean): DailyMacroTarget {
  const bmr = computeBmr(profile);
  const tdee = bmr * profile.activityFactor;
  const goalCalories = tdee * GOAL_CALORIE_MULTIPLIER[profile.goal];
  // Тренировочный день — чуть выше базовой цели (компенсация расхода на тренировке),
  // день отдыха — чуть ниже; сама компенсация калорийности идёт через углеводы/жиры ниже.
  const dayCalories = isTrainingDay ? goalCalories * 1.06 : goalCalories * 0.95;

  const proteinGPerKg = clampProteinGPerKg(profile.proteinTargetGPerKg);
  const proteinG = Math.round(proteinGPerKg * profile.bodyweightKg);

  const carbsPerKg = isTrainingDay ? TRAINING_DAY_CARB_G_PER_KG : REST_DAY_CARB_G_PER_KG;
  const carbsG = Math.round(carbsPerKg * profile.bodyweightKg);

  const proteinKcal = proteinG * 4;
  const carbsKcal = carbsG * 4;
  const minFatKcal = MIN_FAT_G_PER_KG * profile.bodyweightKg * 9;
  const fatKcal = Math.max(dayCalories - proteinKcal - carbsKcal, minFatKcal);
  const fatG = Math.round(fatKcal / 9);

  return {
    calories: Math.round(proteinKcal + carbsKcal + fatKcal),
    proteinG,
    carbsG,
    fatG,
  };
}
