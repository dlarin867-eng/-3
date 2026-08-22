import Link from "next/link";
import styles from "./ScreenHeader.module.css";

// «Назад» — иконка-стрелка в левом верхнем углу (требования к дизайну.md §3.2,
// Экран 1) — тот же паттерн переиспользуется для полноэкранных роутов
// фото/штрихкод/спортпит, открытых с главного экрана.
export function ScreenHeader({ title, backHref = "/main" }: { title: string; backHref?: string }) {
  return (
    <div className={styles.row}>
      <Link href={backHref} className={styles.back} aria-label="Назад">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className={styles.title}>{title}</h1>
    </div>
  );
}
