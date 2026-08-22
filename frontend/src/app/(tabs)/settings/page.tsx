"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { api, ApiError, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const GOAL_LABEL = { bulk: "Набор массы", maintain: "Поддержание", cut: "Сушка" } as const;
const WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function applyTheme(theme: "system" | "light" | "dark") {
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", theme);
  } catch {
    // приватный режим — тема просто не переживёт перезагрузку, не критично
  }
}

export default function SettingsPage() {
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const [proteinInput, setProteinInput] = useState(user?.proteinTargetGPerKg.toString() ?? "");
  const [proteinError, setProteinError] = useState<string | null>(null);

  if (!user) return null;

  async function toggleDay(idx: number) {
    const days = user!.trainingDays.includes(idx)
      ? user!.trainingDays.filter((d) => d !== idx)
      : [...user!.trainingDays, idx];
    await api.patch("/me", { trainingDays: days });
    await refresh();
  }

  async function saveProtein(confirmedAboveLimit = false) {
    const value = Number(proteinInput.replace(",", "."));
    if (!value) return;
    setProteinError(null);
    try {
      await api.patch("/me/protein-target", { proteinTargetGPerKg: value, confirmedAboveLimit });
      await refresh();
    } catch (err) {
      // 422 = "выше 3,0 г/кг без подтверждения" (§3.1.8) — переспрашиваем один раз.
      if (err instanceof ApiError && err.status === 422 && !confirmedAboveLimit) {
        const ok = window.confirm(
          "Значение выше 3,0 г/кг — это больше стандартного спортивного диапазона. Приложение не медицинский " +
            "инструмент; при заболеваниях почек и других ограничениях стоит проконсультироваться с врачом. " +
            "Установить всё равно?",
        );
        if (ok) return saveProtein(true);
      } else {
        setProteinError(err instanceof ApiError ? err.message : "Не удалось сохранить");
      }
    }
  }

  async function deleteAccount() {
    if (!window.confirm("Удалить аккаунт и все данные без возможности восстановления?")) return;
    await api.delete("/me");
    setToken(null);
    logout();
    router.replace("/onboarding");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <h1 style={{ font: "var(--text-heading-l)" }}>Настройки</h1>

      <section>
        <h2 style={{ font: "var(--text-caption)", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>
          Цель
        </h2>
        <div style={{ padding: "12px 14px", borderRadius: "var(--radius-m)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          {GOAL_LABEL[user.goal]}
        </div>
      </section>

      <section>
        <h2 style={{ font: "var(--text-caption)", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>
          Норма белка
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={proteinInput}
            onChange={(e) => setProteinInput(e.target.value)}
            inputMode="decimal"
            style={{
              flex: 1,
              padding: 12,
              borderRadius: "var(--radius-m)",
              border: "1.5px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              font: "600 15px var(--font-body)",
            }}
          />
          <Button variant="secondary" onClick={() => saveProtein(false)}>
            Сохранить
          </Button>
        </div>
        {proteinError && <p style={{ color: "var(--danger)", font: "var(--text-body-s)", marginTop: 6 }}>{proteinError}</p>}
        <p style={{ font: "500 11.5px var(--font-body)", color: "var(--text-tertiary)", marginTop: 8 }}>
          Не является медицинской рекомендацией.
        </p>
      </section>

      <section>
        <h2 style={{ font: "var(--text-caption)", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>
          Тренировочные дни
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {WEEK.map((d, idx) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(idx)}
              style={{
                aspectRatio: "1",
                borderRadius: "var(--radius-m)",
                border: "1.5px solid var(--border)",
                background: user.trainingDays.includes(idx) ? "var(--accent)" : "var(--bg-surface)",
                color: user.trainingDays.includes(idx) ? "var(--accent-ink)" : "var(--text-secondary)",
                font: "600 12px var(--font-body)",
                cursor: "pointer",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ font: "var(--text-caption)", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>
          Тема
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => applyTheme("dark")}>
            Тёмная
          </Button>
          <Button variant="secondary" onClick={() => applyTheme("light")}>
            Светлая
          </Button>
          <Button variant="secondary" onClick={() => applyTheme("system")}>
            Авто
          </Button>
        </div>
      </section>

      <section>
        <h2 style={{ font: "var(--text-caption)", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>
          Приватность и дисклеймер
        </h2>
        <p style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          Приложение не является медицинским или диетологическим инструментом. Фото хранятся минимальный срок,
          необходимый для распознавания.
        </p>
        <Button variant="secondary" onClick={deleteAccount} style={{ marginTop: 12, color: "var(--danger)" }}>
          Удалить аккаунт
        </Button>
      </section>
    </div>
  );
}
