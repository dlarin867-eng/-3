import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../middleware/auth.js";

const updateProfileSchema = z.object({
  goal: z.enum(["bulk", "maintain", "cut"]).optional(),
  bodyweightKg: z.number().min(30).max(300).optional(),
  trainingDays: z.array(z.number().int().min(0).max(6)).optional(),
  workoutTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  eveningSummaryTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
});

// Ручная тонкая настройка белка (§3.1.8) — отдельный эндпоинт, а не часть
// updateProfileSchema, потому что значения выше 3.0 г/кг требуют явного
// подтверждающего диалога на фронте (proteinOverrideConfirmedAt).
const updateProteinSchema = z.object({
  proteinTargetGPerKg: z.number().min(0.8).max(4),
  confirmedAboveLimit: z.boolean().default(false),
});

export async function userRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  app.get("/me", async (request) => {
    const userId = request.user.sub;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  });

  // Изменение цели/тренировочных дней — тост "Норма пересчитана" фронтенд
  // показывает сам после успешного ответа (сам пересчёт daily_target — блок 6).
  app.patch("/me", async (request) => {
    const userId = request.user.sub;
    const body = updateProfileSchema.parse(request.body);
    const user = await prisma.user.update({ where: { id: userId }, data: body });
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  });

  app.patch("/me/protein-target", async (request, reply) => {
    const userId = request.user.sub;
    const body = updateProteinSchema.parse(request.body);

    // Значение выше 3.0 г/кг никогда не применяется без явного
    // подтверждения — сервер повторяет проверку, а не доверяет только фронту.
    if (body.proteinTargetGPerKg > 3.0 && !body.confirmedAboveLimit) {
      reply.code(422);
      return {
        error: "Значение выше 3.0 г/кг требует явного подтверждения (confirmedAboveLimit).",
      };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        proteinTargetGPerKg: body.proteinTargetGPerKg,
        proteinOverrideConfirmedAt: body.proteinTargetGPerKg > 3.0 ? new Date() : null,
      },
    });
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  });

  // Удаление аккаунта (Экран 9 "Приватность и дисклеймер") — каскад в схеме
  // удаляет meals/weight/supplements/dailyTargets вместе с пользователем.
  app.delete("/me", async (request, reply) => {
    const userId = request.user.sub;
    await prisma.user.delete({ where: { id: userId } });
    reply.code(204);
  });
}
