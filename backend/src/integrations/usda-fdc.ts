// Блок 5 — USDA FoodData Central: сверка названия блюда, распознанного ИИ по
// фото, с базой нутриентов (ФТ-2.5 — "сверка названия с базой, приоритет
// данных базы"). Требует бесплатный ключ: https://fdc.nal.usda.gov/api-key-signup

import { env } from "../config/env.js";
import { fetchJson, ExternalApiError } from "./http-client.js";
import { nutrientCache } from "./cache.js";

export interface UsdaNutrients {
  matchedName: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

interface FdcSearchResponse {
  foods: Array<{
    description: string;
    foodNutrients: Array<{ nutrientName: string; value: number }>;
  }>;
}

const NUTRIENT_NAMES = {
  calories: "Energy",
  protein: "Protein",
  carbs: "Carbohydrate, by difference",
  fat: "Total lipid (fat)",
};

function extractNutrient(nutrients: FdcSearchResponse["foods"][number]["foodNutrients"], name: string): number {
  return nutrients.find((n) => n.nutrientName === name)?.value ?? 0;
}

/**
 * Ищет ближайшее совпадение по названию. Возвращает null, если ключ не
 * настроен или совпадений нет — вызывающий код (Claude-распознавание)
 * в этом случае просто не проставляет бейдж "сверено с базой", это не
 * блокирующая ошибка.
 */
export async function lookupFoodByName(name: string): Promise<UsdaNutrients | null> {
  if (!env.USDA_FDC_API_KEY) return null;

  return nutrientCache.wrap<UsdaNutrients | null>(`usda:${name.toLowerCase()}`, async () => {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${env.USDA_FDC_API_KEY}&query=${encodeURIComponent(name)}&pageSize=1&dataType=Foundation,SR%20Legacy`;

    let data: FdcSearchResponse;
    try {
      data = await fetchJson<FdcSearchResponse>(url, { timeoutMs: 5000, retries: 1 });
    } catch (err) {
      if (err instanceof ExternalApiError) return null; // не блокируем распознавание из-за сверки
      throw err;
    }

    const match = data.foods?.[0];
    if (!match) return null;

    return {
      matchedName: match.description,
      caloriesPer100g: extractNutrient(match.foodNutrients, NUTRIENT_NAMES.calories),
      proteinPer100g: extractNutrient(match.foodNutrients, NUTRIENT_NAMES.protein),
      carbsPer100g: extractNutrient(match.foodNutrients, NUTRIENT_NAMES.carbs),
      fatPer100g: extractNutrient(match.foodNutrients, NUTRIENT_NAMES.fat),
    };
  });
}
