import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../middleware/auth.js";
import { uploadMealPhoto } from "../../integrations/photo-storage.js";

const mealItemSchema = z.object({
  name: z.string().min(1),
  weightG: z.number().positive(),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
});

const createManualMealSchema = z.object({
  items: z.array(mealItemSchema).min(1),
});

export async function mealRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // Дневник (Экран 6) — сгруппировать по приёму пищи фронтенд делает сам
  // из loggedAt, бэкенд просто отдаёт плоский список с items.
  app.get("/meals", async (request) => {
    const userId = request.user.sub;
    return prisma.meal.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { loggedAt: "desc" },
      take: 200,
    });
  });

  // Ручной ввод (без фото/штрихкода) — самый простой путь, не требует
  // внешних интеграций, поэтому уже доступен в блоке 4.
  app.post("/meals/manual", async (request, reply) => {
    const userId = request.user.sub;
    const body = createManualMealSchema.parse(request.body);
    const meal = await prisma.meal.create({
      data: {
        userId,
        source: "manual",
        confirmedManually: true,
        items: { create: body.items },
      },
      include: { items: true },
    });
    reply.code(201);
    return meal;
  });

  // Приём фото и загрузка в хранилище готовы уже сейчас (блок 4, "Хранилище
  // фото"). Само распознавание блюда через Claude API — блок 5, поэтому здесь
  // запись сразу создаётся черновиком без confidence/items, и до готовности
  // интеграции наполняется вручную через PATCH ниже — так фронтенд может
  // разрабатывать экран 3 не дожидаясь блока 5.
  app.post("/meals/photo", async (request, reply) => {
    const userId = request.user.sub;
    const data = await request.file();
    if (!data) {
      reply.code(400);
      return { error: "Файл фото обязателен" };
    }
    const buffer = await data.toBuffer();
    const photoKey = await uploadMealPhoto(userId, buffer, data.mimetype);

    const meal = await prisma.meal.create({
      data: { userId, source: "photo", photoKey },
    });
    reply.code(202); // принято, распознавание ещё не произошло (блок 5)
    return meal;
  });

  const patchMealSchema = z.object({
    items: z.array(mealItemSchema).min(1),
  });

  // Ручная правка распознанного блюда (§3.4.2) — после неё confidence
  // считается "подтверждено пользователем".
  app.patch("/meals/:id", async (request, reply) => {
    const userId = request.user.sub;
    const { id } = request.params as { id: string };
    const body = patchMealSchema.parse(request.body);

    const meal = await prisma.meal.findFirst({ where: { id, userId } });
    if (!meal) {
      reply.code(404);
      return { error: "Запись не найдена" };
    }

    await prisma.mealItem.deleteMany({ where: { mealId: id } });
    const updated = await prisma.meal.update({
      where: { id },
      data: { confirmedManually: true, items: { create: body.items } },
      include: { items: true },
    });
    return updated;
  });

  app.delete("/meals/:id", async (request, reply) => {
    const userId = request.user.sub;
    const { id } = request.params as { id: string };
    const meal = await prisma.meal.findFirst({ where: { id, userId } });
    if (!meal) {
      reply.code(404);
      return { error: "Запись не найдена" };
    }
    await prisma.meal.delete({ where: { id } });
    reply.code(204);
  });
}
