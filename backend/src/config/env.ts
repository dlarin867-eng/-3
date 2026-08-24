import "dotenv/config";
import { z } from "zod";

// Валидируем переменные окружения при старте — лучше упасть сразу с понятной
// ошибкой, чем на первом запросе к БД/S3 посреди работы.
const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL обязателен"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET должен быть длинной случайной строкой"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Распознавание фото блюда: по умолчанию через OpenRouter (единый ключ,
  // доступ к сотням моделей) — см. openrouter-vision.ts. "anthropic"
  // переключает на прямой Claude API (claude-vision.ts), если ANTHROPIC_API_KEY есть.
  AI_PROVIDER: z.enum(["openrouter", "anthropic"]).default("openrouter"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openrouter/free"),
  OPEN_FOOD_FACTS_BASE_URL: z.string().default("https://world.openfoodfacts.org"),
  USDA_FDC_API_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().default("kbzhu-meal-photos"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  PHOTO_RETENTION_DAYS: z.coerce.number().default(30),
});

export const env = envSchema.parse(process.env);
