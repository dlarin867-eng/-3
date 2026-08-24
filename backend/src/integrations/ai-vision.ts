// Единая точка входа для распознавания блюда по фото — выбирает провайдера
// по AI_PROVIDER (.env), сам вызывающий код (api/routes/meals.ts) не знает,
// Anthropic сейчас за этим стоит или OpenRouter. Переключение — одна
// переменная окружения, без изменений в роуте.
import { env } from "../config/env.js";
import { recognizeMealPhoto as recognizeViaAnthropic } from "./claude-vision.js";
import { recognizeMealPhoto as recognizeViaOpenRouter } from "./openrouter-vision.js";
import type { RecognizedDish } from "./meal-recognition.types.js";

export type { RecognizedDish };

export function recognizeMealPhoto(imageBase64: string, mediaType: string): Promise<RecognizedDish[] | null> {
  return env.AI_PROVIDER === "anthropic"
    ? recognizeViaAnthropic(imageBase64, mediaType)
    : recognizeViaOpenRouter(imageBase64, mediaType);
}
