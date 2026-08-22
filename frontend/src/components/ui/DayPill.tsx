import type { ButtonHTMLAttributes } from "react";
import styles from "./DayPill.module.css";

export interface DayPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isTrainingDay: boolean;
}

// Единственный визуальный язык типа дня во всём продукте (§5.2) — форма,
// иконка и цвет здесь не должны разъезжаться с лендингом/отчётами: любое
// другое место, показывающее тип дня, обязано переиспользовать этот компонент,
// а не рисовать свою пилюлю.
export function DayPill({ isTrainingDay, className, ...rest }: DayPillProps) {
  const classes = [styles.pill, isTrainingDay ? styles.training : styles.rest, className].filter(Boolean).join(" ");
  return (
    <button className={classes} type="button" {...rest}>
      {isTrainingDay ? (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2c1.2 2 .8 3.4-.4 4.6C10.4 7.8 9.5 9 9.5 10.8a2.5 2.5 0 0 0 5 0c0-.8-.25-1.4-.65-1.9.65.5 1.5 1.5 1.5 3.1a4.35 4.35 0 0 1-8.7 0c0-2.5 1.2-3.7 2.4-5.1C9.85 5.8 10.5 4.4 12 2Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        </svg>
      )}
      {isTrainingDay ? "Тренировочный день" : "День отдыха"}
    </button>
  );
}
