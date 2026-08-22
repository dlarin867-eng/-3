"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api";
import type { Meal } from "@/lib/types";

// Реального сканера камерой в блоке 8 нет (нужна отдельная библиотека
// распознавания штрихкода из видеопотока — за рамками этого блока), поэтому
// ручной ввод штрихкода — не "заглушка вместо сканера", а рабочий fallback,
// который по спецификации (§3.1.4) и так обязателен ("Ввести вручную",
// всегда видима).
export default function BarcodePage() {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!barcode) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await api.post<Meal>("/meals/barcode", { barcode });
      setMeal(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(err instanceof ApiError ? err.message : "Не удалось выполнить поиск");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container" style={{ padding: "40px 16px 16px" }}>
      <ScreenHeader title="Штрихкод" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Введи номер штрихкода"
            style={{
              flex: 1,
              padding: 14,
              borderRadius: "var(--radius-m)",
              border: "1.5px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              font: "600 16px var(--font-body)",
            }}
          />
          <Button onClick={lookup} disabled={loading || !barcode}>
            Найти
          </Button>
        </div>

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

        {notFound && (
          <Card>
            <p style={{ font: "600 14px var(--font-body)" }}>Продукт не найден в базе</p>
            <p style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 4 }}>
              Сохранится для будущих сканирований после ручного заполнения.
            </p>
            <div style={{ marginTop: 12 }}>
              <Button fullWidth onClick={() => router.push("/diary")}>
                Создать вручную
              </Button>
            </div>
          </Card>
        )}

        {meal && (
          <Card>
            <p style={{ font: "600 14px var(--font-body)" }}>{meal.items[0]?.name}</p>
            <p style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
              {Math.round(meal.items[0]?.calories ?? 0)} ккал на 100 г
            </p>
            <div style={{ marginTop: 12 }}>
              <Button fullWidth onClick={() => router.push("/main")}>
                Добавить в дневник
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
