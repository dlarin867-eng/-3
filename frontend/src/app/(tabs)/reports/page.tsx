"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DailyTarget, Meal } from "@/lib/types";

interface ReportsData {
  history: DailyTarget[];
  avgProteinG: number;
}

// Date.now() и производные от него значения считаются один раз при загрузке
// данных (внутри эффекта), а не при каждом рендере — react-hooks/purity не
// разрешает читать время напрямую в теле компонента.
async function loadReportsData(): Promise<ReportsData> {
  const [history, meals] = await Promise.all([
    api.get<DailyTarget[]>("/targets/history").catch(() => [] as DailyTarget[]),
    api.get<Meal[]>("/meals").catch(() => [] as Meal[]),
  ]);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentMeals = meals.filter((m) => new Date(m.loggedAt).getTime() >= sevenDaysAgo);
  const totalProtein = recentMeals.flatMap((m) => m.items).reduce((sum, i) => sum + i.proteinG, 0);
  const daysWithData = new Set(recentMeals.map((m) => new Date(m.loggedAt).toDateString())).size || 1;

  return { history, avgProteinG: Math.round(totalProtein / daysWithData) };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);

  useEffect(() => {
    loadReportsData().then(setData);
  }, []);

  if (!data) return <p style={{ color: "var(--text-secondary)" }}>Загружаем отчёты…</p>;

  const { history, avgProteinG } = data;
  const maxCalories = Math.max(...history.map((h) => h.calories), 1);

  return (
    <div>
      <h1 style={{ font: "var(--text-heading-l)", marginBottom: 8 }}>Отчёты</h1>
      <p style={{ color: "var(--text-secondary)", font: "var(--text-body-s)" }}>
        Калории за неделю — цвет столбца = тип дня
      </p>

      {history.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)", marginTop: 16 }}>
          Пока нет данных за неделю — норма считается по дням, когда открываешь приложение.
        </p>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, margin: "16px 0 6px" }}>
          {history.map((day) => (
            <div
              key={day.id}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${(day.calories / maxCalories) * 100}%`,
                  borderRadius: "6px 6px 3px 3px",
                  background: day.isTrainingDay ? "var(--accent)" : "var(--rest)",
                }}
              />
              <span style={{ font: "600 10.5px var(--font-body)", color: "var(--text-tertiary)" }}>
                {new Date(day.date).toLocaleDateString("ru-RU", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 18, textAlign: "center" }}>
        <div className="tabular" style={{ font: "700 32px var(--font-display)" }}>
          {avgProteinG} г
        </div>
        <span style={{ font: "var(--text-caption)", color: "var(--text-secondary)" }}>среднее по белку</span>
      </div>
    </div>
  );
}
