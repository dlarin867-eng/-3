import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

// Единая точка обработки ошибок — чтобы фронтенд везде получал один и тот же
// формат { error: string, details?: unknown }, а не "иногда JSON, иногда HTML".
export function errorHandler(
  err: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (err instanceof ZodError) {
    reply.code(400).send({ error: "Некорректные данные запроса", details: err.flatten() });
    return;
  }

  const statusCode = "statusCode" in err && err.statusCode ? err.statusCode : 500;
  if (statusCode >= 500) {
    request.log.error(err);
  }
  reply.code(statusCode).send({
    error: statusCode >= 500 ? "Внутренняя ошибка сервера" : err.message,
  });
}
