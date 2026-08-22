import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../middleware/auth.js";
import { getOrCreateTodayTarget, recomputeTodayTarget } from "../../services/carb-cycling.js";
import { computeEveningProteinGap, evaluateUpcomingReminder } from "../../services/reminders.js";

const toggleSchema = z.object({ isTrainingDay: z.boolean() });
const applyAdjustmentSchema = z.object({ toCalories: z.number().int().positive() });

// Порог для эвристики "последний приём был низкоуглеводным" в блоке
// "Ближайшее" (§3.2, Экран 2) — точный порог не задан в дизайн-документе,
// это разумное продуктовое допущение, подлежит уточнению по факту
// использования (см. блок 12, метрики).
const LOW_CARB_SHARE_THRESHOLD = 0.2;

export async function targetRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  app.get("/targets/today", async (request) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.user.sub } });
    return getOrCreateTodayTarget(prisma, user);
  });

  // Ручной тоггл типа дня на главном экране (§3.4.3).
  app.post("/targets/today/toggle-day-type", async (request) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.user.sub } });
    const body = toggleSchema.parse(request.body);
    return recomputeTodayTarget(prisma, user, body.isTrainingDay);
  });

  app.get("/targets/today/upcoming", async (request) => {
    const userId = request.user.sub;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const target = await getOrCreateTodayTarget(prisma, user);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const lastMeal = await prisma.meal.findFirst({
      where: { userId, loggedAt: { gte: startOfToday } },
      orderBy: { loggedAt: "desc" },
      include: { items: true },
    });

    let lastMealWasLowCarb = false;
    if (lastMeal && lastMeal.items.length > 0) {
      const totals = lastMeal.items.reduce(
        (acc, i) => ({ calories: acc.calories + i.calories, carbsG: acc.carbsG + i.carbsG }),
        { calories: 0, carbsG: 0 },
      );
      const carbCalories = totals.carbsG * 4;
      lastMealWasLowCarb = totals.calories > 0 && carbCalories / totals.calories < LOW_CARB_SHARE_THRESHOLD;
    }

    const reminder = evaluateUpcomingReminder(new Date(), user.workoutTime, target.isTrainingDay, lastMealWasLowCarb);
    return { reminder };
  });

  // Принятие карточки-предложения корректировки (§3.1.5, ФТ-7.4). Само
  // предложение — /weight/suggestion (только считает, не применяет); этот
  // роут — единственное место, где calories на сегодня реально меняются
  // из-за автокоррекции, отдельно от ручного тоггла типа дня.
  app.post("/targets/today/apply-adjustment", async (request) => {
    const userId = request.user.sub;
    const body = applyAdjustmentSchema.parse(request.body);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = await prisma.dailyTarget.findUnique({ where: { userId_date: { userId, date: today } } });
    return prisma.dailyTarget.update({
      where: { userId_date: { userId, date: today } },
      data: { calories: body.toCalories, autoAdjustedFromCalories: current?.calories },
    });
  });

  // Недельная история для отчётов (§3.2, Экран 8) — только то, что реально
  // посчитано (дни, когда пользователь открывал приложение), не бэкфилл
  // задним числом на дни, для которых нормы никогда не существовало.
  app.get("/targets/history", async (request) => {
    const userId = request.user.sub;
    const since = new Date();
    since.setDate(since.getDate() - 7);
    since.setHours(0, 0, 0, 0);
    return prisma.dailyTarget.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "asc" },
    });
  });

  app.get("/targets/today/evening-summary", async (request) => {
    const userId = request.user.sub;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const target = await getOrCreateTodayTarget(prisma, user);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const meals = await prisma.meal.findMany({
      where: { userId, loggedAt: { gte: startOfToday } },
      include: { items: true },
    });
    const consumedProteinG = meals.flatMap((m) => m.items).reduce((sum, i) => sum + i.proteinG, 0);

    return { gapG: computeEveningProteinGap(target.proteinG, consumedProteinG) };
  });
}
