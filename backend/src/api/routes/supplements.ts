import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../middleware/auth.js";

const logSupplementSchema = z.object({
  category: z.enum(["protein", "gainer", "creatine", "bcaa", "pre_workout", "other"]),
  servings: z.number().positive(),
});

export async function supplementRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // Ровно 2 действия до записи (категория -> добавить, ФТ-6.1-6.4) —
  // справочник самих продуктов (название, порция по умолчанию, КБЖУ) живёт
  // отдельно и наполняется в блоке 5 (интеграции); здесь только сам лог.
  app.get("/supplements", async (request) => {
    const userId = request.user.sub;
    return prisma.supplementLog.findMany({
      where: { userId },
      orderBy: { loggedAt: "desc" },
      take: 100,
    });
  });

  app.post("/supplements", async (request, reply) => {
    const userId = request.user.sub;
    const body = logSupplementSchema.parse(request.body);
    const log = await prisma.supplementLog.create({
      data: { userId, category: body.category, servings: body.servings },
    });
    reply.code(201);
    return log;
  });
}
