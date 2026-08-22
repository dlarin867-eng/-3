import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../middleware/auth.js";
import { uploadMealPhoto } from "../../integrations/photo-storage.js";
import { recognizeMealPhoto } from "../../integrations/claude-vision.js";
import { lookupBarcode } from "../../integrations/open-food-facts.js";
import { lookupFoodByName } from "../../integrations/usda-fdc.js";

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

  // Фото -> загрузка в хранилище -> распознавание через Claude API (ФТ-2.1-2.5).
  // НФТ 5.1: не более 8с, иначе таймаут -> ручной ввод — recognizeMealPhoto
  // сама укладывается в этот бюджет и возвращает null при таймауте/ошибке,
  // здесь просто разница в статусе ответа (200 распознано / 202 черновик).
  app.post("/meals/photo", async (request, reply) => {
    const userId = request.user.sub;
    const data = await request.file();
    if (!data) {
      reply.code(400);
      return { error: "Файл фото обязателен" };
    }
    const buffer = await data.toBuffer();
    const photoKey = await uploadMealPhoto(userId, buffer, data.mimetype);

    const dishes = await recognizeMealPhoto(buffer.toString("base64"), data.mimetype);

    if (!dishes || dishes.length === 0) {
      // Таймаут/ошибка/ключ не настроен — черновик без items, дальше
      // ручной ввод через PATCH ниже (тот же путь, что и раньше в блоке 4).
      const draft = await prisma.meal.create({ data: { userId, source: "photo", photoKey } });
      reply.code(202);
      return draft;
    }

    // Сверка с USDA (ФТ-2.5) — приоритет данных базы над оценкой ИИ, если нашлось.
    const items = await Promise.all(
      dishes.map(async (dish) => {
        const usdaMatch = await lookupFoodByName(dish.name);
        if (!usdaMatch) return { ...dish, matchedNutrientDb: false };
        const factor = dish.weightG / 100;
        return {
          name: dish.name,
          weightG: dish.weightG,
          calories: usdaMatch.caloriesPer100g * factor,
          proteinG: usdaMatch.proteinPer100g * factor,
          carbsG: usdaMatch.carbsPer100g * factor,
          fatG: usdaMatch.fatPer100g * factor,
          matchedDbName: usdaMatch.matchedName,
          matchedNutrientDb: true,
        };
      }),
    );

    // Confidence карточки блюда = самый низкий confidence среди распознанных
    // позиций — одна плашка "проверьте вес" на приём пищи, не на каждую позицию отдельно.
    const confidenceRank = { high: 0, medium: 1, low: 2 } as const;
    const worstConfidence = dishes.reduce(
      (worst, d) => (confidenceRank[d.confidence] > confidenceRank[worst] ? d.confidence : worst),
      "high" as (typeof dishes)[number]["confidence"],
    );
    const anyMatchedDb = items.some((i) => i.matchedNutrientDb);

    const meal = await prisma.meal.create({
      data: {
        userId,
        source: "photo",
        photoKey,
        confidence: worstConfidence,
        matchedNutrientDb: anyMatchedDb,
        items: { create: items.map(({ matchedNutrientDb: _mnd, ...item }) => item) },
      },
      include: { items: true },
    });
    return meal;
  });

  const barcodeSchema = z.object({ barcode: z.string().min(4) });

  // Штрихкод -> Open Food Facts, без ИИ-оценки (ФТ-3.2). "Не найдено" (ФТ-3.3) —
  // не ошибка, фронтенд показывает форму ручного создания.
  app.post("/meals/barcode", async (request, reply) => {
    const userId = request.user.sub;
    const body = barcodeSchema.parse(request.body);
    const product = await lookupBarcode(body.barcode);

    if (!product) {
      reply.code(404);
      return { error: "Продукт не найден в базе", barcode: body.barcode };
    }

    // Порция по умолчанию 100г — пользователь тут же корректирует степпером
    // на фронте (§3.1.4), это стартовая точка, не финальное значение.
    const meal = await prisma.meal.create({
      data: {
        userId,
        source: "barcode",
        matchedNutrientDb: true,
        confirmedManually: false,
        items: {
          create: {
            name: product.name,
            weightG: 100,
            calories: product.caloriesPer100g,
            proteinG: product.proteinPer100g,
            carbsG: product.carbsPer100g,
            fatG: product.fatPer100g,
            matchedDbName: product.name,
          },
        },
      },
      include: { items: true },
    });
    reply.code(201);
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
