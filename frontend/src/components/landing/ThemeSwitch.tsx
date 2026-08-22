"use client";

import { useEffect, useState } from "react";
import styles from "./Landing.module.css";

type ThemeChoice = "dark" | "light" | "system";

// Тот же ключ localStorage("theme"), что и переключатель темы в Настройках
// продукта (§2.1) — обязателен на лендинге и согласован с продуктом
// (те же токены светлой/тёмной темы, требования к дизайну.md §2.1).
export function ThemeSwitch() {
  const [active, setActive] = useState<ThemeChoice>("system");

  useEffect(() => {
    // .then() вместо прямого вызова — react-hooks/set-state-in-effect
    // требует, чтобы setState происходил из колбэка, а не синхронно в теле
    // эффекта (см. тот же приём в lib/auth-context.tsx).
    Promise.resolve().then(() => {
      try {
        const saved = localStorage.getItem("theme");
        if (saved === "light" || saved === "dark") setActive(saved);
      } catch {
        // приватный режим — остаёмся на "system"
      }
    });
  }, []);

  function apply(choice: ThemeChoice) {
    setActive(choice);
    if (choice === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", choice);
    try {
      if (choice === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", choice);
    } catch {
      // не критично — просто не переживёт перезагрузку
    }
  }

  return (
    <div className={styles.themeSwitch} role="group" aria-label="Тема">
      <button type="button" className={active === "dark" ? styles.active : ""} onClick={() => apply("dark")}>
        Тёмная
      </button>
      <button type="button" className={active === "light" ? styles.active : ""} onClick={() => apply("light")}>
        Светлая
      </button>
      <button type="button" className={active === "system" ? styles.active : ""} onClick={() => apply("system")}>
        Система
      </button>
    </div>
  );
}
