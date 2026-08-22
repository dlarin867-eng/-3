// Типы зеркалят backend/prisma/schema.prisma — продукты разные npm-пакеты,
// поэтому типы продублированы, а не импортированы. Если меняешь схему в
// backend, не забудь поправить и здесь (оба места указаны в комментариях).

export type Goal = "bulk" | "maintain" | "cut";
export type Sex = "m" | "f";
export type Confidence = "high" | "medium" | "low";
export type SupplementCategory = "protein" | "gainer" | "creatine" | "bcaa" | "pre_workout" | "other";

export interface User {
  id: string;
  email: string;
  sex: Sex;
  age: number;
  heightCm: number;
  bodyweightKg: number;
  goal: Goal;
  proteinTargetGPerKg: number;
  activityFactor: number;
  trainingDays: number[];
  workoutTime: string | null;
  eveningSummaryTime: string;
  theme: "system" | "light" | "dark";
}

export interface DailyTarget {
  id: string;
  date: string;
  isTrainingDay: boolean;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  autoAdjustedFromCalories: number | null;
}

export interface MealItem {
  id: string;
  name: string;
  weightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  matchedDbName: string | null;
}

export interface Meal {
  id: string;
  source: "photo" | "barcode" | "manual";
  loggedAt: string;
  confidence: Confidence | null;
  matchedNutrientDb: boolean;
  confirmedManually: boolean;
  isOfflineDraft: boolean;
  items: MealItem[];
}

export interface WeightLog {
  id: string;
  weightKg: number;
  loggedAt: string;
}

export interface WeightSuggestion {
  fromCalories: number;
  toCalories: number;
  deltaCalories: number;
  reason: string;
}

export interface SupplementLog {
  id: string;
  category: SupplementCategory;
  servings: number;
  loggedAt: string;
}
