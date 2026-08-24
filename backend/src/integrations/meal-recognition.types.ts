// Общий тип результата распознавания блюда по фото — вынесен отдельно, чтобы
// claude-vision.ts (прямой Anthropic API) и openrouter-vision.ts (через
// OpenRouter) реализовывали один и тот же контракт и были взаимозаменяемы
// для вызывающего кода (см. ai-vision.ts).
export interface RecognizedDish {
  name: string;
  weightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: "high" | "medium" | "low";
}
