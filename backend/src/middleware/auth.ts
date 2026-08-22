import type { FastifyReply, FastifyRequest } from "fastify";

// Прикрепляется через fastify.addHook('onRequest', ...) на защищённые роуты
// (см. app.ts). Не решает, ЧТО пользователю можно — только КТО он такой;
// проверку "чужие ли это данные" делает сам роут (см. api/routes/*).
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: "Не авторизован" });
  }
}
