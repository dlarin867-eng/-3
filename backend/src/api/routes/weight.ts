import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../middleware/auth.js";

const logWeightSchema = z.object({
  weightKg: z.number().min(30).max(300),
  loggedAt: z.string().datetime().optional(),
});

export async function weightRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // ФТ-7.2: ввод веса не реже раза в 2-3 дня — фронтенд использует это же
  // для построения тренда и определения, когда предложить корректировку (блок 6).
  app.get("/weight", async (request) => {
    const userId = request.user.sub;
    return prisma.weightLog.findMany({
      where: { userId },
      orderBy: { loggedAt: "asc" },
    });
  });

  app.post("/weight", async (request, reply) => {
    const userId = request.user.sub;
    const body = logWeightSchema.parse(request.body);
    const log = await prisma.weightLog.create({
      data: {
        userId,
        weightKg: body.weightKg,
        loggedAt: body.loggedAt ? new Date(body.loggedAt) : undefined,
      },
    });
    reply.code(201);
    return log;
  });
}
