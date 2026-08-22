// Блок 5 — распознавание блюда по фото через Claude API со структурированным
// JSON-выводом (ФТ-2.1-2.5). Известное системное ограничение (см.
// backend-developer.md "Контекст"): оценка калорий систематически занижена
// (MAPE 35-38%) — это не баг промпта, компенсируется автокоррекцией по весу
// (блок 6), а не попыткой "починить" точность одного запроса.

import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

export interface RecognizedDish {
  name: string;
  weightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: "high" | "medium" | "low";
}

// НФТ 5.1: время ответа на распознавание — не более 8с (P95), иначе таймаут
// -> ручной ввод (см. api/routes/meals.ts, который ловит этот таймаут).
const RECOGNITION_TIMEOUT_MS = 8000;

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

const dishesTool: Anthropic.Tool = {
  name: "report_dishes",
  description: "Вернуть список распознанных на фото блюд с оценкой КБЖУ.",
  input_schema: {
    type: "object",
    properties: {
      dishes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Название блюда по-русски" },
            weight_g: { type: "number", description: "Оценка веса порции в граммах" },
            calories: { type: "number" },
            protein_g: { type: "number" },
            carbs_g: { type: "number" },
            fat_g: { type: "number" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["name", "weight_g", "calories", "protein_g", "carbs_g", "fat_g", "confidence"],
        },
      },
    },
    required: ["dishes"],
  },
};

/**
 * Возвращает null при таймауте/недоступности — вызывающий роут (POST
 * /meals/photo) в этом случае оставляет запись черновиком без items,
 * пользователь заполняет вручную (НФТ 5.1: "иначе таймаут -> ручной ввод").
 * Не бросает исключение намеренно: отсутствие распознавания — ожидаемый,
 * а не аварийный исход.
 */
export async function recognizeMealPhoto(imageBase64: string, mediaType: string): Promise<RecognizedDish[] | null> {
  if (!client) return null; // ключ не настроен — тот же fallback, что и таймаут

  try {
    const response = await client.messages.create(
      {
        model: "claude-sonnet-5",
        max_tokens: 1024,
        tools: [dishesTool],
        tool_choice: { type: "tool", name: "report_dishes" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType as "image/jpeg", data: imageBase64 },
              },
              {
                type: "text",
                text:
                  "На фото — приём пищи человека, который тренируется в зале. Определи все блюда, " +
                  "оцени вес порции и КБЖУ каждого, и честно оцени свою уверенность (confidence): " +
                  "high — уверен в блюде и примерном весе, medium — уверен в блюде, но вес приблизительный, " +
                  "low — не уверен в самом блюде или составе. Лучше занизить confidence, чем притвориться уверенным.",
              },
            ],
          },
        ],
      },
      { timeout: RECOGNITION_TIMEOUT_MS },
    );

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return null;

    const input = toolUse.input as { dishes: Array<Record<string, unknown>> };
    return input.dishes.map((d) => ({
      name: String(d.name),
      weightG: Number(d.weight_g),
      calories: Number(d.calories),
      proteinG: Number(d.protein_g),
      carbsG: Number(d.carbs_g),
      fatG: Number(d.fat_g),
      confidence: (d.confidence as RecognizedDish["confidence"]) ?? "low",
    }));
  } catch {
    return null; // таймаут или ошибка API — тот же путь, что и "ключ не настроен"
  }
}
