"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import type { Meal } from "@/lib/types";
import styles from "./page.module.css";

// НФТ 5.1: не более 8с на распознавание, иначе — ручной ввод. Backend
// (POST /meals/photo) сам укладывается в этот бюджет и возвращает черновик
// без items при таймауте/недоступности Claude API — здесь просто разница
// между "meal.items.length > 0" (распознано) и пустым списком (черновик).
export default function PhotoPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api.post<Meal>("/meals/photo", form);
      setMeal(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить фото");
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    router.push("/main");
  }

  return (
    <div className="app-container">
      <div className={styles.body}>
        <ScreenHeader title="Фото еды" />

        {!meal && !loading && (
          <>
            <button className={styles.dropzone} type="button" onClick={() => fileRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              Сделать фото или выбрать из галереи
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <button className={styles.manualLink} type="button" onClick={() => router.push("/diary")}>
              Ввести вручную
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </>
        )}

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            Распознаём блюдо… (может занять до минуты — бесплатная модель ИИ, иначе — ручной ввод)
          </div>
        )}

        {meal && meal.items.length > 0 && (
          <>
            {meal.items.map((item) => (
              <div key={item.id} className={styles.mealCard}>
                <div className={styles.thumb} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ font: "600 15px var(--font-body)" }}>{item.name}</span>
                  </div>
                  {meal.confidence && <ConfidenceBadge confidence={meal.confidence} matchedDb={meal.matchedNutrientDb} />}
                  <div className={styles.macroLine}>
                    <div>
                      <b className="tabular">{Math.round(item.calories)}</b>
                      <span>ккал</span>
                    </div>
                    <div>
                      <b className="tabular">{Math.round(item.proteinG)}</b>
                      <span>белок</span>
                    </div>
                    <div>
                      <b className="tabular">{Math.round(item.fatG)}</b>
                      <span>жир</span>
                    </div>
                    <div>
                      <b className="tabular">{Math.round(item.carbsG)}</b>
                      <span>углев</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <Button fullWidth onClick={confirm}>
                Подтвердить
              </Button>
            </div>
          </>
        )}

        {meal && meal.items.length === 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ color: "var(--text-secondary)", font: "var(--text-body-s)" }}>
              Не удалось распознать автоматически — заполни вручную в дневнике.
            </p>
            <div style={{ marginTop: 16 }}>
              <Button fullWidth onClick={() => router.push("/diary")}>
                Заполнить вручную
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
