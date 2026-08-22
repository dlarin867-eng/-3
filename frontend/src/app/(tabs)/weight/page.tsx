"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { WeightLog, WeightSuggestion } from "@/lib/types";

export default function WeightPage() {
  const [logs, setLogs] = useState<WeightLog[] | null>(null);
  const [suggestion, setSuggestion] = useState<WeightSuggestion | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<WeightLog[]>("/weight").then(setLogs).catch(() => setLogs([]));
    api.get<WeightSuggestion | null>("/weight/suggestion").then(setSuggestion).catch(() => setSuggestion(null));
  }

  useEffect(load, []);

  async function addWeight() {
    const value = Number(inputValue.replace(",", "."));
    if (!value || saving) return;
    setSaving(true);
    try {
      await api.post("/weight", { weightKg: value });
      setInputValue("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function acceptSuggestion() {
    if (!suggestion) return;
    await api.post("/targets/today/apply-adjustment", { toCalories: suggestion.toCalories });
    setSuggestion(null);
  }

  const latest = logs?.[logs.length - 1];
  const prior = logs && logs.length > 1 ? logs[Math.max(0, logs.length - 8)] : undefined;
  const deltaKg = latest && prior ? latest.weightKg - prior.weightKg : null;

  return (
    <div>
      <h1 style={{ font: "var(--text-heading-l)", textAlign: "center", marginBottom: 6 }}>Вес тела</h1>

      {latest ? (
        <div style={{ textAlign: "center" }}>
          <div className="tabular" style={{ font: "700 44px var(--font-display)" }}>
            {latest.weightKg.toLocaleString("ru-RU")} кг
          </div>
          {deltaKg !== null && (
            <div style={{ font: "600 14px var(--font-body)", color: "var(--text-secondary)" }} className="tabular">
              {deltaKg >= 0 ? "+" : ""}
              {deltaKg.toFixed(1)} кг за последнее время
            </div>
          )}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Пока нет записей веса</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Вес, кг"
          inputMode="decimal"
          style={{
            flex: 1,
            padding: 14,
            borderRadius: "var(--radius-m)",
            border: "1.5px solid var(--border)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            font: "600 16px var(--font-body)",
          }}
        />
        <Button onClick={addWeight} disabled={saving || !inputValue}>
          Добавить
        </Button>
      </div>

      {suggestion && (
        <Card style={{ marginTop: 20 }}>
          <p style={{ font: "700 14px var(--font-body)" }}>Пора скорректировать норму</p>
          <p style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 4 }}>
            {suggestion.reason}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "12px 0",
              padding: "10px 12px",
              borderRadius: "var(--radius-m)",
              background: "var(--bg-elevated)",
            }}
          >
            <span className="tabular" style={{ font: "700 15px var(--font-display)" }}>
              {suggestion.fromCalories} → {suggestion.toCalories} ккал
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button fullWidth onClick={acceptSuggestion}>
              Принять
            </Button>
            <Button fullWidth variant="secondary" onClick={() => setSuggestion(null)}>
              Отклонить
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
