import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

// Основной CTA продукта (§3.2: "Подтвердить"/"Добавить" — full-width, 52px).
// Не переопределяй высоту/радиус точечно в экранах — если нужен другой размер,
// это повод обсудить с ui-ux-designer, а не расходиться по компонентам.
export function Button({ variant = "primary", fullWidth, className, ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], fullWidth ? styles.fullWidth : "", className]
    .filter(Boolean)
    .join(" ");
  return <button className={classes} {...rest} />;
}
