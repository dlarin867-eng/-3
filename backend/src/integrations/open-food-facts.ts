// Блок 5 — интеграция Open Food Facts (штрихкоды, ФТ-3.1-3.3).
// Публичный API, ключ не нужен: https://world.openfoodfacts.org/data

import { env } from "../config/env.js";
import { fetchJson, ExternalApiError } from "./http-client.js";
import { nutrientCache } from "./cache.js";

export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  photoUrl?: string;
}

interface OffApiResponse {
  status: 0 | 1;
  product?: {
    product_name?: string;
    image_front_small_url?: string;
    nutriments?: {
      "energy-kcal_100g"?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
    };
  };
}

/**
 * Возвращает null, если штрихкод не найден в базе — это НЕ ошибка (ФТ-3.3,
 * состояние "Не найдено" ведёт на форму ручного создания), поэтому null
 * отдельно от ExternalApiError (сеть недоступна/таймаут — реальная проблема).
 */
export async function lookupBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  return nutrientCache.wrap<OpenFoodFactsProduct | null>(`off:${barcode}`, async () => {
    const url = `${env.OPEN_FOOD_FACTS_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`;
    const data = await fetchJson<OffApiResponse>(url, { timeoutMs: 5000, retries: 1 });

    if (data.status !== 1 || !data.product) return null;

    const n = data.product.nutriments ?? {};
    if (n["energy-kcal_100g"] == null) return null; // нет данных о калорийности — считаем "не найдено"

    return {
      barcode,
      name: data.product.product_name ?? "Без названия",
      caloriesPer100g: n["energy-kcal_100g"],
      proteinPer100g: n.proteins_100g ?? 0,
      carbsPer100g: n.carbohydrates_100g ?? 0,
      fatPer100g: n.fat_100g ?? 0,
      photoUrl: data.product.image_front_small_url,
    };
  });
}

export { ExternalApiError };
