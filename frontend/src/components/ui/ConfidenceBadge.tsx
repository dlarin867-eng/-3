import styles from "./ConfidenceBadge.module.css";

export type Confidence = "high" | "medium" | "low";

// §3.4.1: confidence кодируется цветом + текстом + иконкой одновременно,
// никогда только цветом (доступность, §3.5). High/medium — без блокирующего
// текстового бейджа по спецификации (только обводка карточки — см. экран
// фото в блоке 8), сюда возвращается элемент только для medium/low, когда
// он реально нужен явным текстом ("проверьте вес", "сверено с базой").
export function ConfidenceBadge({ confidence, matchedDb }: { confidence: Confidence; matchedDb?: boolean }) {
  if (matchedDb) {
    return (
      <span className={`${styles.badge} ${styles.high}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
        </svg>
        сверено с базой
      </span>
    );
  }
  if (confidence === "low") {
    return (
      <span className={`${styles.badge} ${styles.low}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path d="M12 8v5M12 16.5v.01" />
        </svg>
        проверьте вес
      </span>
    );
  }
  return null;
}
