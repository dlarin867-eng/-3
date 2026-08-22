"use client";

import { useState } from "react";
import Link from "next/link";
import { DayPill } from "@/components/ui/DayPill";
import { MacroRing } from "@/components/ui/MacroRing";
import styles from "./page.module.css";

// Демонстрационные данные — реальный расчёт (норма на сегодня, тоггл типа
// дня) уже готов на backend (GET/POST /targets/today, блок 6). Подключение
// к API — блок 8; здесь только компонентная сборка экрана по §3.1.2/§3.2.
const DEMO = {
  training: { calories: 2550, kcalTotal: 2550, protein: 62, proteinTotal: 180, carbs: 210, carbsTotal: 380, fat: 48, fatTotal: 75 },
  rest: { calories: 1980, kcalTotal: 1980, protein: 62, proteinTotal: 180, carbs: 85, carbsTotal: 120, fat: 70, fatTotal: 90 },
};

export default function MainPage() {
  const [isTrainingDay, setIsTrainingDay] = useState(true);
  const t = isTrainingDay ? DEMO.training : DEMO.rest;
  const dayColor = isTrainingDay ? "accent" : "rest";

  return (
    <div className={styles.screen}>
      <DayPill isTrainingDay={isTrainingDay} onClick={() => setIsTrainingDay((v) => !v)} />

      <div className={styles.ringBlock}>
        <MacroRing progress={t.calories / t.kcalTotal} colorVar={dayColor} value={t.calories.toLocaleString("ru-RU")} label="ккал осталось" />
        <div className={styles.miniRings}>
          <MacroRing size="sm" progress={t.protein / t.proteinTotal} colorVar="protein" value={String(t.protein)} />
          <MacroRing size="sm" progress={t.carbs / t.carbsTotal} colorVar={dayColor} value={String(t.carbs)} />
          <MacroRing size="sm" progress={t.fat / t.fatTotal} colorVar="fat" value={String(t.fat)} />
        </div>
        <div className={styles.miniCaptions}>
          <span>Белок, г</span>
          <span>Углеводы, г</span>
          <span>Жиры, г</span>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Link href="/photo" className={styles.quickAction}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          Фото
        </Link>
        <Link href="/barcode" className={styles.quickAction}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M4 5v14M8 5v14M11 5v14M15 5v14M18 5v14M20 5v14" />
          </svg>
          Штрихкод
        </Link>
        <Link href="/sportpit" className={styles.quickAction}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M7 3h10l-1 5-3 3v7a3 3 0 0 1-6 0v-7L4 8Z" />
          </svg>
          Спортпит
        </Link>
      </div>
    </div>
  );
}
