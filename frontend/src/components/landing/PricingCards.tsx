"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Landing.module.css";

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path d="M5 12l5 5L19 7" />
  </svg>
);

// Тариф 3 ("Pro+") сознательно не показан — требования к дизайну.md §4.5:
// "если в MVP этого функционала ещё нет — третий тариф на лендинге не
// показывать вообще, чтобы не продавать несуществующую ценность".
export function PricingCards() {
  const [billing, setBilling] = useState<"month" | "year">("year");
  const proPrice = billing === "year" ? 299 : 399;
  const proNote = billing === "year" ? "≈ 10 ₽/день, счёт раз в год" : "Оплата помесячно, можно отменить в любой момент";

  return (
    <>
      <div className={styles.billingSwitch}>
        <div className={styles.billingSeg}>
          <button type="button" className={billing === "month" ? styles.active : ""} onClick={() => setBilling("month")}>
            Помесячно
          </button>
          <button type="button" className={billing === "year" ? styles.active : ""} onClick={() => setBilling("year")}>
            Ежегодно <span className={styles.save}>−25%</span>
          </button>
        </div>
      </div>

      <div className={styles.priceGrid}>
        <div className={styles.priceCard}>
          <h3>Базовый</h3>
          <div className={styles.priceVal}>0 ₽</div>
          <div className={styles.priceNote}>Бесплатно навсегда</div>
          <ul>
            <li>
              <CheckIcon />
              Фото-распознавание еды
            </li>
            <li>
              <CheckIcon />
              Штрихкод и ручной ввод
            </li>
            <li>
              <CheckIcon />
              Базовый расчёт КБЖУ
            </li>
            <li>
              <CheckIcon />
              Дневник питания
            </li>
          </ul>
          <Link href="/onboarding?entry=landing" className={styles.btnSecondary}>
            Начать бесплатно
          </Link>
        </div>

        <div className={`${styles.priceCard} ${styles.priceCardPro}`}>
          <span className={styles.priceBadge}>Популярный</span>
          <h3>Pro</h3>
          <div className={`${styles.priceVal} tabular`}>
            {proPrice} ₽<span>/мес</span>
          </div>
          <div className={styles.priceNote}>{proNote}</div>
          <ul>
            <li>
              <CheckIcon />
              Всё из Базового
            </li>
            <li>
              <CheckIcon />
              Циклирование углеводов по дням
            </li>
            <li>
              <CheckIcon />
              Спортпит: справочник + 2 тапа
            </li>
            <li>
              <CheckIcon />
              Тайминг вокруг тренировки
            </li>
            <li>
              <CheckIcon />
              Автокоррекция нормы по весу
            </li>
          </ul>
          <Link href="/onboarding?entry=landing" className={styles.btnPrimary}>
            Попробовать бесплатно 7 дней
          </Link>
          <p className={styles.priceFine}>Отменить можно в любой момент, напомним за 2 дня до списания.</p>
        </div>
      </div>
    </>
  );
}
