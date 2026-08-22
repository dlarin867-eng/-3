// Блок 6 — циклирование углеводов по тренировочным/нетренировочным дням
// (ФТ-4.1, ФТ-4.4) и получение/создание записи daily_targets на сегодня.

import type { PrismaClient } from "@prisma/client";
import { computeDailyTarget, type UserProfileForCalc } from "./norm-calculator.js";

/** trainingDays хранится как 0=Пн..6=Вс (см. schema.prisma) — JS Date.getDay() 0=Вс..6=Сб. */
export function isTrainingDay(trainingDays: number[], date: Date): boolean {
  const dayOfWeekMondayFirst = (date.getDay() + 6) % 7;
  return trainingDays.includes(dayOfWeekMondayFirst);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface UserForTarget extends UserProfileForCalc {
  id: string;
  trainingDays: number[];
}

/**
 * Идемпотентно: если норма на сегодня уже посчитана — отдаёт её, не
 * пересчитывает заново (иначе кольца на главном экране "прыгали" бы при
 * каждом обновлении страницы). Пересчёт по требованию — только через явный
 * триггер (ручной тоггл типа дня, §3.4.3 — это отдельный эндпоинт).
 */
export async function getOrCreateTodayTarget(prisma: PrismaClient, user: UserForTarget, now = new Date()) {
  const date = startOfDay(now);
  const existing = await prisma.dailyTarget.findUnique({
    where: { userId_date: { userId: user.id, date } },
  });
  if (existing) return existing;

  const training = isTrainingDay(user.trainingDays, date);
  const macros = computeDailyTarget(user, training);
  return prisma.dailyTarget.create({
    data: { userId: user.id, date, isTrainingDay: training, ...macros },
  });
}

/**
 * Ручной тоггл типа дня на главном экране (§3.4.3) — пересчитывает и
 * перезаписывает норму на сегодня, сохраняя предыдущее значение калорий для
 * тоста "Норма обновлена: +134 г углеводов на сегодня".
 */
export async function recomputeTodayTarget(
  prisma: PrismaClient,
  user: UserForTarget,
  forceTrainingDay: boolean,
  now = new Date(),
) {
  const date = startOfDay(now);
  const previous = await prisma.dailyTarget.findUnique({
    where: { userId_date: { userId: user.id, date } },
  });
  const macros = computeDailyTarget(user, forceTrainingDay);
  return prisma.dailyTarget.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, isTrainingDay: forceTrainingDay, ...macros },
    update: {
      isTrainingDay: forceTrainingDay,
      ...macros,
      autoAdjustedFromCalories: previous?.calories,
    },
  });
}
