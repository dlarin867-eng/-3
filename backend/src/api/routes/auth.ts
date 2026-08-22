import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";

// Поля соответствуют шагам онбординг-квиза (требования к дизайну.md §5.1,
// шаги 1-4) — фронтенд отправляет их одним запросом после экрана "Результат".
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов"),
  sex: z.enum(["m", "f"]),
  age: z.number().int().min(14).max(100),
  heightCm: z.number().min(100).max(250),
  bodyweightKg: z.number().min(30).max(300),
  goal: z.enum(["bulk", "maintain", "cut"]),
  trainingDays: z.array(z.number().int().min(0).max(6)).default([]),
  workoutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Диапазоны г/кг белка по цели (ФТ-1.4) — стартовое значение до ручной
// тонкой настройки пользователем (§3.1.8, блок 6 — сама логика автокоррекции).
const DEFAULT_PROTEIN_G_PER_KG: Record<string, number> = {
  bulk: 1.8,
  maintain: 1.8,
  cut: 2.6,
};

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      reply.code(409);
      return { error: "Пользователь с таким email уже существует" };
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        sex: body.sex,
        age: body.age,
        heightCm: body.heightCm,
        bodyweightKg: body.bodyweightKg,
        goal: body.goal,
        proteinTargetGPerKg: DEFAULT_PROTEIN_G_PER_KG[body.goal],
        trainingDays: body.trainingDays,
        workoutTime: body.workoutTime,
      },
    });

    const token = app.jwt.sign({ sub: user.id });
    reply.code(201);
    return { token, user: toPublicUser(user) };
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      reply.code(401);
      return { error: "Неверный email или пароль" };
    }
    const token = app.jwt.sign({ sub: user.id });
    return { token, user: toPublicUser(user) };
  });
}

// Никогда не отдаём passwordHash наружу.
function toPublicUser(user: { passwordHash: string; [key: string]: unknown }) {
  const { passwordHash, ...rest } = user;
  return rest;
}
