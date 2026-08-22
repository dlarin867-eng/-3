// Блок 6 — тайминг напоминаний вокруг тренировки (ФТ-5.1-5.3) и вечерняя
// сводка по белку (ФТ-5.4). Чистые функции по времени — без сети/БД.

export type UpcomingReminder =
  | { type: "pre_workout_carb_warning"; hoursUntilWorkout: number }
  | { type: "post_workout_protein_reminder"; hoursSinceWorkout: number }
  | null;

/**
 * Блок "Ближайшее" на главном экране (§3.2, Экран 2). lastMealWasLowCarb —
 * решает сам вызывающий код на основе последней записи дневника, здесь
 * только тайминг относительно времени тренировки.
 */
export function evaluateUpcomingReminder(
  now: Date,
  workoutTime: string | null,
  isTrainingDay: boolean,
  lastMealWasLowCarb: boolean,
): UpcomingReminder {
  if (!isTrainingDay || !workoutTime) return null;

  const [hours, minutes] = workoutTime.split(":").map(Number);
  const workoutAt = new Date(now);
  workoutAt.setHours(hours, minutes, 0, 0);

  const diffHours = (workoutAt.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (diffHours > 0 && diffHours <= 2 && lastMealWasLowCarb) {
    return { type: "pre_workout_carb_warning", hoursUntilWorkout: diffHours };
  }
  if (diffHours < 0 && diffHours >= -2) {
    return { type: "post_workout_protein_reminder", hoursSinceWorkout: -diffHours };
  }
  return null;
}

/** "Сегодня не хватает N г белка" (§3.1.6) — никогда не показываем отрицательное. */
export function computeEveningProteinGap(targetProteinG: number, consumedProteinG: number): number {
  return Math.max(0, Math.round(targetProteinG - consumedProteinG));
}

/** Пора ли показать вечернюю сводку — сравнение текущего времени с eveningSummaryTime пользователя. */
export function isEveningSummaryTime(now: Date, eveningSummaryTime: string): boolean {
  const [hours, minutes] = eveningSummaryTime.split(":").map(Number);
  const summaryAt = new Date(now);
  summaryAt.setHours(hours, minutes, 0, 0);
  return now.getTime() >= summaryAt.getTime();
}
