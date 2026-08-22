import type { FastifyInstance } from "fastify";
import { prisma } from "../../db/client.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ status: "ok" }));

  // Отдельная проверка БД — полезно для мониторинга (блок 10), чтобы отличить
  // "процесс жив" от "процесс жив, но не может достучаться до Postgres".
  app.get("/health/db", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch (err) {
      reply.code(503);
      return { status: "unavailable" };
    }
  });
}
