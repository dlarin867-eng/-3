import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

// radius-l (16px), bg-surface, border — карточка блюда/спортпита/дневника
// и т.п. все используют этот же базовый узел (§2.5).
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={[styles.card, className].filter(Boolean).join(" ")} {...rest} />;
}
