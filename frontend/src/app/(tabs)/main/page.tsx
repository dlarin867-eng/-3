"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DayPill } from "@/components/ui/DayPill";
import { MacroRing } from "@/components/ui/MacroRing";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DailyTarget } from "@/lib/types";
import styles from "./page.module.css";

type Upcoming = { type: "pre_workout_carb_warning" | "post_workout_protein_reminder" } | null;

export default function MainPage() {
  const { user } = useAuth();
  const [target, setTarget] = useState<DailyTarget | null>(null);
  const [upcoming, setUpcoming] = useState<Upcoming>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<DailyTarget>("/targets/today").then(setTarget).catch(() => setTarget(null));
    api
      .get<{ reminder: Upcoming }>("/targets/today/upcoming")
      .then((r) => setUpcoming(r.reminder))
      .catch(() => setUpcoming(null));
  }, []);

  async function toggleDayType() {
    if (!target || busy) return;
    setBusy(true);
    try {
      const updated = await api.post<DailyTarget>("/targets/today/toggle-day-type", {
        isTrainingDay: !target.isTrainingDay,
      });
      setTarget(updated);
    } finally {
      setBusy(false);
    }
  }

  if (!target) {
    return <p style={{ color: "var(--text-secondary)" }}>Загружаем норму на сегодня…</p>;
  }

  const dayColor = target.isTrainingDay ? "accent" : "rest";
  // Прогресс колец продукт покажет реальным (норма минус то, что уже
  // съедено за день) в связке с дневником — блок 8 продолжается; здесь
  // прогресс = 100% нормы, пока фактическое потребление за день не считается
  // на этом экране отдельным запросом.
  const progress = 1;

  return (
    <div className={styles.screen}>
      <DayPill isTrainingDay={target.isTrainingDay} onClick={toggleDayType} aria-busy={busy} />

      <div className={styles.ringBlock}>
        <MacroRing progress={progress} colorVar={dayColor} value={target.calories.toLocaleString("ru-RU")} label="ккал на сегодня" />
        <div className={styles.miniRings}>
          <MacroRing size="sm" progress={progress} colorVar="protein" value={String(target.proteinG)} />
          <MacroRing size="sm" progress={progress} colorVar={dayColor} value={String(target.carbsG)} />
          <MacroRing size="sm" progress={progress} colorVar="fat" value={String(target.fatG)} />
        </div>
        <div className={styles.miniCaptions}>
          <span>Белок, г</span>
          <span>Углеводы, г</span>
          <span>Жиры, г</span>
        </div>
      </div>

      {upcoming && (
        <div className={styles.upcoming}>
          {upcoming.type === "pre_workout_carb_warning"
            ? "Скоро тренировка — последний приём был низкоуглеводным, стоит добавить углеводов."
            : "После тренировки — не забудь про белок в течение 1-2 часов."}
        </div>
      )}

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

      {user && (
        <p style={{ marginTop: 20, color: "var(--text-tertiary)", font: "var(--text-caption)" }}>{user.email}</p>
      )}
    </div>
  );
}
