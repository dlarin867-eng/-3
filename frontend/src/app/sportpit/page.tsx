"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { api } from "@/lib/api";
import type { SupplementCategory } from "@/lib/types";

// Справочник позиций — backend хранит только сам лог (POST /supplements),
// без каталога продуктов (это не было частью блока 5/6). Статичный список
// здесь — минимально достаточный, чтобы флоу "категория -> добавить" в 2
// тапа реально работал (ФТ-6.1-6.4); полноценный справочник ≥50 позиций
// с поиском — отдельная задача (не входит явно ни в один блок 1-11,
// стоит завести в план после MVP или уточнить в блоке 6/13).
const CATEGORIES: { v: SupplementCategory; label: string }[] = [
  { v: "protein", label: "Протеин" },
  { v: "gainer", label: "Гейнер" },
  { v: "creatine", label: "Креатин" },
  { v: "bcaa", label: "BCAA" },
  { v: "pre_workout", label: "Предтреник" },
  { v: "other", label: "Другое" },
];

export default function SportpitPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<SupplementCategory | null>(null);
  const [saving, setSaving] = useState(false);

  async function add(servings: number) {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await api.post("/supplements", { category: selected, servings });
      router.push("/main");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-container" style={{ padding: "40px 16px 16px" }}>
      <ScreenHeader title="Спортпит" />

      {!selected && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.v}
              type="button"
              onClick={() => setSelected(c.v)}
              style={{
                aspectRatio: "1",
                borderRadius: "var(--radius-l)",
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                font: "600 11px var(--font-body)",
                cursor: "pointer",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ color: "var(--text-secondary)", font: "var(--text-body-s)" }}>
            {CATEGORIES.find((c) => c.v === selected)?.label} — сколько порций?
          </p>
          {[1, 2].map((n) => (
            <button
              key={n}
              type="button"
              disabled={saving}
              onClick={() => add(n)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-m)",
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                font: "600 14px var(--font-body)",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {n} {n === 1 ? "порция" : "порции"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
