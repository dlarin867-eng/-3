"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MacroRing } from "@/components/ui/MacroRing";
import { api, setToken, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DailyTarget, Goal, Sex, User } from "@/lib/types";
import styles from "./page.module.css";

// Канонический квиз — требования к дизайну.md §5.1. Шаг 0 обязателен только
// при прямом входе в продукт (§3.3); при переходе с лендинга (?entry=landing)
// пропускается — "hero-секция уже выполнила его функцию" (§5.1, сноска *).
// Шаг "Аккаунт" — не из дизайн-документа: сам продукт нигде не расписывает
// момент создания аккаунта для прямого входа (§4.3 описывает это только для
// воронки лендинга — регистрация после результата). Чтобы онбординг вообще
// мог сохранить норму, аккаунт создаётся прямо здесь, последним шагом перед
// расчётом — сознательное решение при переносе в код, не из документа.
type StepKey = "welcome" | "goal" | "sex" | "stats" | "activity" | "days" | "time" | "account" | "loading" | "result";
const FULL_STEPS: StepKey[] = ["welcome", "goal", "sex", "stats", "activity", "days", "time", "account", "loading", "result"];
const FROM_LANDING_STEPS: StepKey[] = FULL_STEPS.filter((s) => s !== "welcome");

const GOAL_OPTIONS: { v: Goal; b: string; s: string }[] = [
  { v: "bulk", b: "Набор массы", s: "Профицит калорий, акцент на белок" },
  { v: "maintain", b: "Поддержание", s: "Текущий вес, стабильная норма" },
  { v: "cut", b: "Сушка", s: "Дефицит калорий, повышенный белок" },
];
const ACTIVITY_OPTIONS = [
  { v: 1.2, b: "Сидячий", s: "Мало движения вне зала" },
  { v: 1.375, b: "Лёгкая", s: "Пешком, лёгкая работа на ногах" },
  { v: 1.55, b: "Умеренная", s: "Активная работа или быт" },
  { v: 1.725, b: "Высокая", s: "Физический труд" },
];
const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface Answers {
  goal?: Goal;
  sex?: Sex;
  age?: number;
  heightCm?: number;
  bodyweightKg?: number;
  activityFactor?: number;
  trainingDays: number[];
  workoutTime?: string;
  email?: string;
  password?: string;
}

// useSearchParams() (для ?entry=landing) требует Suspense-границу при
// статической сборке — сам квиз оборачиваем, чтобы не тянуть его за пределы
// компонента ради одного параметра.
export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingQuiz />
    </Suspense>
  );
}

function OnboardingQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const steps = useMemo(
    () => (searchParams.get("entry") === "landing" ? FROM_LANDING_STEPS : FULL_STEPS),
    [searchParams],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ trainingDays: [] });
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<DailyTarget | null>(null);
  const step = steps[stepIndex];

  const valid = useMemo(() => {
    switch (step) {
      case "goal":
        return !!answers.goal;
      case "sex":
        return !!answers.sex;
      case "stats":
        return !!answers.age && !!answers.heightCm && !!answers.bodyweightKg;
      case "activity":
        return !!answers.activityFactor;
      case "days":
        return answers.trainingDays.length > 0;
      case "account":
        return !!answers.email && !!answers.password && answers.password.length >= 8;
      default:
        return true;
    }
  }, [step, answers]);

  function next() {
    setError(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }
  function toggleDay(idx: number) {
    setAnswers((a) => ({
      ...a,
      trainingDays: a.trainingDays.includes(idx) ? a.trainingDays.filter((d) => d !== idx) : [...a.trainingDays, idx],
    }));
  }

  // Демо-режим: пользователь так и не должен думать про email/пароль, чтобы
  // просто увидеть, как приложение считает норму — аккаунт создаётся сам,
  // по-настоящему (тот же /auth/register, та же реальная норма), только
  // данные для входа сгенерированы, а не введены руками.
  async function submitDemo() {
    const suffix = Math.random().toString(36).slice(2, 10);
    await submit({ email: `demo-${suffix}@kbzhu.local`, password: `demo-${suffix}-pass` });
  }

  async function submit(overrides?: { email: string; password: string }) {
    const email = overrides?.email ?? answers.email;
    const password = overrides?.password ?? answers.password;
    setStepIndex(steps.indexOf("loading"));
    setError(null);
    try {
      const { token } = await api.post<{ token: string; user: User }>("/auth/register", {
        email,
        password,
        sex: answers.sex,
        age: answers.age,
        heightCm: answers.heightCm,
        bodyweightKg: answers.bodyweightKg,
        goal: answers.goal,
        trainingDays: answers.trainingDays,
        workoutTime: answers.workoutTime || undefined,
      });
      setToken(token);
      const today = await api.get<DailyTarget>("/targets/today");
      setTarget(today);
      await refresh();
      setStepIndex(steps.indexOf("result"));
    } catch (err) {
      setStepIndex(steps.indexOf("account"));
      if (err instanceof ApiError) {
        // details — это fieldErrors от zod (см. backend errorHandler.ts) — показываем
        // их явно, а не только общую фразу, чтобы реально понять, что не так.
        const fieldErrors = (err.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors;
        const specifics = fieldErrors
          ? Object.entries(fieldErrors)
              .filter(([, msgs]) => msgs?.length)
              .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
              .join("; ")
          : "";
        setError(specifics ? `${err.message} — ${specifics}` : err.message);
      } else {
        setError("Не удалось создать аккаунт. Попробуй ещё раз.");
      }
    }
  }

  const progressPct = (Math.min(stepIndex, steps.length - 2) / (steps.length - 2)) * 100;

  return (
    <div className={styles.wrap}>
      {step !== "loading" && step !== "result" && (
        <div className={styles.progress}>
          <span className={styles.progressBar} style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {stepIndex > 0 && step !== "loading" && step !== "result" && (
        <div className={styles.backRow}>
          <button className={styles.backBtn} onClick={back} aria-label="Назад" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      )}

      {step === "welcome" && (
        <div className={styles.step}>
          <MacroRing progress={0.62} colorVar="accent" value="" size="lg" />
          <h1 style={{ textAlign: "center" }}>Твоя норма КБЖУ меняется в день тренировки</h1>
          <p className={styles.sub} style={{ textAlign: "center" }}>
            Сфотографировал еду — ИИ посчитал. Дальше приложение подстраивает норму под твой тренировочный график
            само.
          </p>
          <div className={styles.ctaRow}>
            <Button onClick={next}>Начать</Button>
            <p className={styles.disclaimer}>Не является медицинским или диетологическим инструментом</p>
          </div>
        </div>
      )}

      {step === "goal" && (
        <div className={styles.step}>
          <h1>Твоя цель</h1>
          <p className={styles.sub}>Определяет диапазон белка и дневную норму</p>
          <div className={styles.cards}>
            {GOAL_OPTIONS.map((o) => (
              <button
                key={o.v}
                type="button"
                className={`${styles.card} ${answers.goal === o.v ? styles.cardActive : ""}`}
                onClick={() => setAnswers((a) => ({ ...a, goal: o.v }))}
              >
                <b>{o.b}</b>
                <span>{o.s}</span>
              </button>
            ))}
          </div>
          <div className={styles.ctaRow}>
            <Button disabled={!valid} onClick={next}>
              Далее
            </Button>
          </div>
        </div>
      )}

      {step === "sex" && (
        <div className={styles.step}>
          <h1>Пол</h1>
          <p className={styles.sub}>Нужен для формулы расчёта нормы</p>
          <div className={styles.cards}>
            <button
              type="button"
              className={`${styles.card} ${answers.sex === "m" ? styles.cardActive : ""}`}
              onClick={() => setAnswers((a) => ({ ...a, sex: "m" }))}
            >
              <b>Мужской</b>
            </button>
            <button
              type="button"
              className={`${styles.card} ${answers.sex === "f" ? styles.cardActive : ""}`}
              onClick={() => setAnswers((a) => ({ ...a, sex: "f" }))}
            >
              <b>Женский</b>
            </button>
          </div>
          <div className={styles.ctaRow}>
            <Button disabled={!valid} onClick={next}>
              Далее
            </Button>
          </div>
        </div>
      )}

      {step === "stats" && (
        <div className={styles.step}>
          <h1>Возраст, рост и вес</h1>
          <p className={styles.sub}>Три числа для формулы Миффлина-Сан Жеора</p>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="age">Возраст, лет</label>
              <input
                id="age"
                type="number"
                inputMode="numeric"
                min={14}
                max={90}
                value={answers.age ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, age: Number(e.target.value) || undefined }))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="height">Рост, см</label>
              <input
                id="height"
                type="number"
                inputMode="numeric"
                min={130}
                max={220}
                value={answers.heightCm ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, heightCm: Number(e.target.value) || undefined }))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="weight">Вес, кг</label>
            <input
              id="weight"
              type="number"
              inputMode="numeric"
              min={35}
              max={200}
              value={answers.bodyweightKg ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, bodyweightKg: Number(e.target.value) || undefined }))}
            />
          </div>
          <div className={styles.ctaRow}>
            <Button disabled={!valid} onClick={next}>
              Далее
            </Button>
          </div>
        </div>
      )}

      {step === "activity" && (
        <div className={styles.step}>
          <h1>Уровень активности</h1>
          <p className={styles.sub}>Помимо тренировок в зале</p>
          <div className={styles.cards}>
            {ACTIVITY_OPTIONS.map((o) => (
              <button
                key={o.v}
                type="button"
                className={`${styles.card} ${answers.activityFactor === o.v ? styles.cardActive : ""}`}
                onClick={() => setAnswers((a) => ({ ...a, activityFactor: o.v }))}
              >
                <b>{o.b}</b>
                <span>{o.s}</span>
              </button>
            ))}
          </div>
          <div className={styles.ctaRow}>
            <Button disabled={!valid} onClick={next}>
              Далее
            </Button>
          </div>
        </div>
      )}

      {step === "days" && (
        <div className={styles.step}>
          <h1>Тренировочные дни</h1>
          <p className={styles.sub}>Влияет на циклирование углеводов</p>
          <div className={styles.weekGrid}>
            {WEEK_DAYS.map((d, idx) => (
              <button
                key={d}
                type="button"
                className={`${styles.weekDay} ${answers.trainingDays.includes(idx) ? styles.weekDayActive : ""}`}
                onClick={() => toggleDay(idx)}
              >
                {d}
              </button>
            ))}
          </div>
          <div className={styles.ctaRow}>
            <Button disabled={!valid} onClick={next}>
              Далее
            </Button>
          </div>
        </div>
      )}

      {step === "time" && (
        <div className={styles.step}>
          <h1>Время тренировки</h1>
          <p className={styles.sub}>Опционально — можно пропустить</p>
          <div className={styles.field}>
            <label htmlFor="time">Примерное время</label>
            <input
              id="time"
              type="time"
              value={answers.workoutTime ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, workoutTime: e.target.value }))}
            />
          </div>
          <div className={styles.ctaRow}>
            <Button onClick={next}>Далее</Button>
            <button className={styles.skip} type="button" onClick={next}>
              Пропустить
            </button>
          </div>
        </div>
      )}

      {step === "account" && (
        <div className={styles.step}>
          <h1>Сохраним твою норму</h1>
          <p className={styles.sub}>Аккаунт нужен, чтобы норма и дневник не потерялись</p>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={answers.email ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, email: e.target.value }))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              minLength={8}
              value={answers.password ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, password: e.target.value }))}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.ctaRow}>
            <Button disabled={!valid} onClick={() => submit()}>
              Рассчитать мою норму КБЖУ
            </Button>
            <button className={styles.skip} type="button" onClick={submitDemo}>
              Посмотреть демо без регистрации
            </button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p className={styles.sub}>Считаем твою тренировочную норму КБЖУ…</p>
        </div>
      )}

      {step === "result" && target && (
        <div className={styles.step}>
          <div className={styles.resultHead}>
            <h1>На основе твоих ответов — вот твоя норма на сегодня</h1>
          </div>
          <MacroRing
            progress={0.62}
            colorVar={target.isTrainingDay ? "accent" : "rest"}
            value={target.calories.toLocaleString("ru-RU")}
            label="ккал сегодня"
          />
          <p className={styles.sub} style={{ textAlign: "center" }}>
            {target.proteinG} г белка · {target.carbsG} г углеводов · {target.fatG} г жиров
          </p>
          <div className={styles.ctaRow}>
            <Button onClick={() => router.replace("/main")}>Начать пользоваться</Button>
            <p className={styles.disclaimer}>Не является медицинским или диетологическим инструментом</p>
          </div>
        </div>
      )}
    </div>
  );
}
