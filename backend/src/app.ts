import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRoutes } from "./api/routes/auth.js";
import { healthRoutes } from "./api/routes/health.js";
import { mealRoutes } from "./api/routes/meals.js";
import { supplementRoutes } from "./api/routes/supplements.js";
import { targetRoutes } from "./api/routes/targets.js";
import { userRoutes } from "./api/routes/users.js";
import { weightRoutes } from "./api/routes/weight.js";

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : true,
  });

  app.register(cors, { origin: true }); // сузить до реального домена фронтенда перед продом (блок 10)
  app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: env.JWT_EXPIRES_IN } });
  app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024 } }); // 15МБ — с запасом под фото с телефона

  app.setErrorHandler(errorHandler);

  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(userRoutes);
  app.register(mealRoutes);
  app.register(weightRoutes);
  app.register(supplementRoutes);
  app.register(targetRoutes);

  return app;
}
