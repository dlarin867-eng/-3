"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Meal } from "@/lib/types";

// Автогруппировка по времени суток (§3.2, Экран 6) — точные границы не
// заданы в дизайн-документе, разумное допущение: завтрак/обед/ужин по
// времени лога. Спортпит визуально не смешан с едой (ФТ-6.1) — своя иконка.
function bucketFor(hour: number): string {
  if (hour < 11) return "Завтрак";
  if (hour < 16) return "Обед";
  if (hour < 22) return "Ужин";
  return "Поздний приём";
}

export default function DiaryPage() {
  const [meals, setMeals] = useState<Meal[] | null>(null);

  useEffect(() => {
    api.get<Meal[]>("/meals").then(setMeals).catch(() => setMeals([]));
  }, []);

  async function remove(id: string) {
    setMeals((m) => m?.filter((meal) => meal.id !== id) ?? null);
    await api.delete(`/meals/${id}`).catch(() => {});
  }

  if (!meals) return <p style={{ color: "var(--text-secondary)" }}>Загружаем дневник…</p>;
  if (meals.length === 0) {
    return (
      <div>
        <h1 style={{ font: "var(--text-heading-l)", marginBottom: 8 }}>Дневник</h1>
        <p style={{ color: "var(--text-secondary)", font: "var(--text-body-s)" }}>
          Пока пусто — добавь запись через фото, штрихкод или спортпит на главном экране.
        </p>
      </div>
    );
  }

  const groups = new Map<string, Meal[]>();
  for (const meal of meals) {
    const d = new Date(meal.loggedAt);
    const key = `${d.toLocaleDateString("ru-RU")} · ${bucketFor(d.getHours())}`;
    groups.set(key, [...(groups.get(key) ?? []), meal]);
  }

  return (
    <div>
      <h1 style={{ font: "var(--text-heading-l)", marginBottom: 12 }}>Дневник</h1>
      {[...groups.entries()].map(([key, group]) => {
        const totalKcal = group.reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.calories, 0), 0);
        return (
          <div key={key} style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                font: "600 13px var(--font-body)",
                color: "var(--text-secondary)",
              }}
            >
              <span>{key}</span>
              <span className="tabular">{Math.round(totalKcal)} ккал</span>
            </div>
            {group.map((meal) => {
              const name = meal.items[0]?.name ?? (meal.source === "photo" ? "Фото — распознаётся" : "Запись");
              const kcal = meal.items.reduce((s, i) => s + i.calories, 0);
              return (
                <div
                  key={meal.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 0",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-m)",
                      flex: "none",
                      background:
                        meal.source === "manual" || meal.source === "barcode"
                          ? "var(--bg-elevated)"
                          : "linear-gradient(135deg, var(--accent), var(--rest))",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "500 13.5px var(--font-body)" }}>{name}</div>
                    {meal.isOfflineDraft && (
                      <div style={{ font: "500 11.5px var(--font-body)", color: "var(--text-secondary)" }}>
                        Сохранено, отправим при подключении
                      </div>
                    )}
                  </div>
                  <span className="tabular" style={{ font: "600 13px var(--font-body)" }}>
                    {Math.round(kcal)}
                  </span>
                  <button
                    type="button"
                    aria-label="Удалить запись"
                    onClick={() => remove(meal.id)}
                    style={{ border: 0, background: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
