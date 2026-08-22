import styles from "./MacroRing.module.css";

export interface MacroRingProps {
  /** 0..1 — уже посчитанная вызывающим кодом доля от нормы (не сырые граммы). */
  progress: number;
  /** Токен цвета дуги — 'accent' | 'rest' | 'protein' | 'fat' и т.п. (см. globals.css). */
  colorVar: string;
  value: string;
  label?: string;
  size?: "lg" | "sm";
}

const SIZE_PX = { lg: 176, sm: 72 };
const STROKE_WIDTH = { lg: 12, sm: 5 };

// Единственный компонент колец на весь продукт (§3.1.2) — большое кольцо
// калорий и три малых (белок/углеводы/жиры) используют один и тот же узел,
// разница только в размере и цвете дуги. Белковое кольцо (ФТ-4.3) обязано
// получать colorVar="protein" всегда, независимо от типа дня — это
// единственный визуальный носитель правила "белок не зависит от дня".
export function MacroRing({ progress, colorVar, value, label, size = "lg" }: MacroRingProps) {
  const px = SIZE_PX[size];
  const stroke = STROKE_WIDTH[size];
  const radius = px / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <div className={`${styles.wrap} ${size === "sm" ? styles["size-sm"] : ""}`} style={{ width: px, height: px }}>
      <svg className={styles.svg} viewBox={`0 0 ${px} ${px}`}>
        <circle className={styles.track} cx={px / 2} cy={px / 2} r={radius} fill="none" strokeWidth={stroke} />
        <circle
          className={styles.progress}
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={`var(--${colorVar})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.num}>
        <span className={`${styles.value} tabular`}>{value}</span>
        {label && <span className={styles.label}>{label}</span>}
      </div>
    </div>
  );
}
