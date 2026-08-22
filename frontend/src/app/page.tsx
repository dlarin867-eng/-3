import type { Metadata } from "next";
import Link from "next/link";
import { ThemeSwitch } from "@/components/landing/ThemeSwitch";
import { PricingCards } from "@/components/landing/PricingCards";
import styles from "@/components/landing/Landing.module.css";

// Блок 9 задачника — лендинг, требования к дизайну.md §4. Дизайн и копирайт
// уже проверены артефактом-прототипом («Кольца и Дни», лендинг) — здесь тот
// же контент, перенесённый в реальный код на общих токенах приложения
// (не отдельная копия палитры/шрифтов).
export const metadata: Metadata = {
  title: "Кольца и Дни — норма КБЖУ под твой тренировочный график",
  description:
    "Сфотографировал еду — ИИ посчитал. Тренировка сегодня — углеводов и калорий больше автоматически. День отдыха — меньше. Без Excel и ручного пересчёта.",
  openGraph: {
    title: "Кольца и Дни",
    description: "Норма КБЖУ, которая меняется в день тренировки — как и должно быть.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <ThemeSwitch />

      <div className={styles.wrap}>
        <nav className={styles.nav}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#1a0f0a" strokeWidth={2.3}>
                <path d="M12 3c1.5 2.5 1 4-.5 5.5C10 10 9 11.5 9 13.5a3 3 0 0 0 6 0c0-1-.3-1.7-.8-2.3.8.6 1.8 1.8 1.8 3.8a5 5 0 0 1-10 0c0-3 1.5-4.5 3-6.3C10.3 7.3 11 5.5 12 3Z" />
              </svg>
            </span>
            Кольца и Дни
          </div>
          <Link href="/onboarding?entry=landing" className={styles.btnPrimarySmall}>
            Узнать свою норму
          </Link>
        </nav>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={`${styles.wrap} ${styles.heroInner}`}>
          <div>
            <h1 className={styles.heroTitle}>
              Твоя норма КБЖУ меняется в день тренировки. <em>Как и должно быть.</em>
            </h1>
            <p className={styles.heroSub}>
              Сфотографировал еду — ИИ посчитал. Тренировка сегодня — углеводов и калорий больше автоматически. День
              отдыха — меньше. Без Excel и ручного пересчёта.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/onboarding?entry=landing" className={styles.btnPrimary}>
                Узнать свою норму
              </Link>
              <a href="#demo" className={styles.btnSecondary}>
                Посмотреть как это работает
              </a>
            </div>
            <p className={styles.trustLine}>
              Считаем норму белка на основе позиции International Society of Sports Nutrition — не круглой цифры «для
              всех».
            </p>
          </div>

          <div className={styles.heroPhones} aria-hidden="true">
            <div className={`${styles.mockPhone} ${styles.p1}`}>
              <span className={`${styles.mockPill} ${styles.training}`}>
                <svg viewBox="0 0 24 24" width="10" fill="currentColor">
                  <path d="M12 2c1.2 2 .8 3.4-.4 4.6C10.4 7.8 9.5 9 9.5 10.8a2.5 2.5 0 0 0 5 0c0-.8-.25-1.4-.65-1.9.65.5 1.5 1.5 1.5 3.1a4.35 4.35 0 0 1-8.7 0c0-2.5 1.2-3.7 2.4-5.1C9.85 5.8 10.5 4.4 12 2Z" />
                </svg>
                Тренировка
              </span>
              <div className={styles.mockRing}>
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ring-track)" strokeWidth="9" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray="264"
                    strokeDashoffset="90"
                  />
                </svg>
                <div className={styles.mockRingNum}>
                  <b className="tabular">2 550</b>
                  <small>ккал</small>
                </div>
              </div>
            </div>
            <div className={`${styles.mockPhone} ${styles.p2}`}>
              <span className={`${styles.mockPill} ${styles.rest}`}>
                <svg viewBox="0 0 24 24" width="10" fill="currentColor">
                  <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
                </svg>
                Отдых
              </span>
              <div className={styles.mockRing}>
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ring-track)" strokeWidth="9" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--rest)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray="264"
                    strokeDashoffset="150"
                  />
                </svg>
                <div className={styles.mockRingNum}>
                  <b className="tabular">1 980</b>
                  <small>ккал</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>Проблема / решение</span>
          <h2 className={styles.sectionTitle}>Обычные счётчики не знают, что у тебя сегодня зал</h2>
          <div className={styles.compare}>
            <CompareRow oldText="Одна норма КБЖУ на весь месяц" newText="Норма пересчитывается по дню тренировки автоматически" />
            <CompareRow oldText="Углеводы — просто ещё одно число" newText="Углеводы циклируются: больше в день зала, меньше в день отдыха" />
            <CompareRow oldText="Протеин и креатин теряются среди «яблоко», «гречка»" newText="Спортпит — отдельная категория, ввод за 2 тапа" />
            <CompareRow oldText="Норма выставлена один раз и забыта" newText="Норма сама корректируется, если вес не двигается как должен" />
          </div>
          <p className={styles.bridgeLine}>Вот что это значит на практике ↓</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.feature}>
            <div>
              <span className={styles.eyebrow}>01 — главный дифференциатор</span>
              <h3 className={styles.featureTitle}>Циклирование углеводов по дням</h3>
              <p className={styles.featureText}>
                Тренировочный день ≠ день отдыха — и норма это знает. В день тренировки углеводы выше (гликоген,
                качество тренировки), в день отдыха — ниже, калорийность компенсируется жирами. Пересчёт автоматический.
              </p>
            </div>
            <div className={styles.featureVisual}>
              <div className={styles.carbCompare}>
                <div className={styles.carbRingWrap}>
                  <div className={styles.carbRing}>
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ring-track)" strokeWidth="10" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="70" />
                    </svg>
                    <div className={`${styles.carbRingVal} tabular`}>380 г</div>
                  </div>
                  <span className={styles.carbRingCap}>Тренировка</span>
                </div>
                <div className={styles.carbRingWrap}>
                  <div className={styles.carbRing}>
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ring-track)" strokeWidth="10" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--rest)" strokeWidth="10" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="200" />
                    </svg>
                    <div className={`${styles.carbRingVal} tabular`}>120 г</div>
                  </div>
                  <span className={styles.carbRingCap}>Отдых</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.feature}>
            <div>
              <span className={styles.eyebrow}>02</span>
              <h3 className={styles.featureTitle}>Протеин — это не гречка. Мы тоже так думаем.</h3>
              <p className={styles.featureText}>
                Быстрый ввод из справочника: «1 мерная ложка протеина», «1 капсула креатина» — без поиска и
                взвешивания. Приём креатина — привычка со стриком, не запись в дневнике еды.
              </p>
            </div>
            <div className={styles.featureVisual}>
              <div className={styles.sportGrid}>
                <div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <path d="M7 3h10l-1 5-3 3v7a3 3 0 0 1-6 0v-7L4 8Z" />
                  </svg>
                </div>
                <div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <rect x="6" y="4" width="12" height="16" rx="4" />
                  </svg>
                </div>
                <div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <rect x="8" y="2" width="8" height="20" rx="4" />
                  </svg>
                </div>
                <div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <path d="M9 3v6l-4 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-4-9V3" />
                  </svg>
                </div>
                <div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <path d="M4 12h16M4 12a4 4 0 0 1 4-4M20 12a4 4 0 0 1-4 4" />
                  </svg>
                </div>
                <div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.feature}>
            <div>
              <span className={styles.eyebrow}>03</span>
              <h3 className={styles.featureTitle}>Формула — это стартовая точка. Твой вес — это правда.</h3>
              <p className={styles.featureText}>
                Раз в 1-2 недели приложение сравнивает фактическую динамику веса с ожидаемой и предлагает
                скорректировать норму — как продвинутые трекеры для опытных атлетов, но с прицелом на тренировочный
                цикл.
              </p>
            </div>
            <div className={styles.featureVisual} style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
              <svg viewBox="0 0 320 100" height="100" width="100%">
                <polyline points="0,55 40,52 80,50 120,49 160,48 200,30 240,29 280,28 320,27" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="200" cy="30" r="4" fill="var(--warning)" />
              </svg>
              <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 12.5 }}>
                «Вес стабилен 3 недели → +150 ккал»
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="demo">
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>Демонстрация</span>
          <h2 className={styles.sectionTitle}>День из жизни, как он выглядит в приложении</h2>
          <div className={styles.demoStrip}>
            <DemoCard kicker="Утро" caption="Норма тренировочного дня">
              <span className={`${styles.mockPill} ${styles.training}`} style={{ alignSelf: "flex-start" }}>
                Тренировка
              </span>
              <div className={styles.mockRing} style={{ marginTop: "auto" }}>
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ring-track)" strokeWidth="9" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="90" />
                </svg>
                <div className={styles.mockRingNum}>
                  <b className="tabular">2 550</b>
                  <small>ккал</small>
                </div>
              </div>
            </DemoCard>
            <DemoCard kicker="Фото завтрака" caption="Ручная правка за секунду">
              <div
                style={{
                  marginTop: "auto",
                  border: "1.5px solid var(--warning)",
                  borderRadius: 14,
                  padding: 12,
                  background: "color-mix(in srgb, var(--warning) 6%, transparent)",
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,var(--accent),var(--rest))" }} />
                <div style={{ font: "600 12.5px var(--font-body)", marginTop: 8 }}>Овсянка с бананом</div>
                <div style={{ font: "600 10.5px var(--font-body)", color: "var(--warning)", marginTop: 2 }}>Проверьте вес</div>
              </div>
            </DemoCard>
            <DemoCard kicker="После тренировки" caption="Спортпит в 2 тапа">
              <div className={styles.sportGrid} style={{ marginTop: "auto", width: "100%" }}>
                <div>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <path d="M7 3h10l-1 5-3 3v7a3 3 0 0 1-6 0v-7L4 8Z" />
                  </svg>
                </div>
                <div>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <rect x="8" y="2" width="8" height="20" rx="4" />
                  </svg>
                </div>
                <div>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
              </div>
            </DemoCard>
            <DemoCard kicker="Вечер" caption="Вечерняя сводка с вариантами">
              <div style={{ marginTop: "auto" }}>
                <div style={{ font: "700 26px var(--font-display)" }}>38 г</div>
                <div style={{ font: "500 12.5px var(--font-body)", color: "var(--text-secondary)" }}>белка осталось добрать</div>
              </div>
            </DemoCard>
          </div>
          <p style={{ color: "var(--text-tertiary)", fontSize: 12.5 }}>
            ИИ иногда ошибается в оценке — поэтому каждую запись легко поправить вручную за секунду.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>Почему нам можно верить</span>
          <h2 className={styles.sectionTitle}>Прозрачность вместо придуманных цифр</h2>
          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <h3>Норма белка — не круглая цифра</h3>
              <p>
                1,4-2,0 г/кг при наборе и поддержании, 2,3-3,1 г/кг на сушке — диапазоны согласованы с позицией{" "}
                <b style={{ color: "var(--text-primary)" }}>International Society of Sports Nutrition</b>, а не
                выбраны «на глаз».
              </p>
            </div>
            <div className={styles.trustCard}>
              <h3>Как считается норма</h3>
              <ul className={styles.formulaList}>
                <li>
                  <b>1.</b> Базовый обмен веществ по формуле Миффлина-Сан Жеора
                </li>
                <li>
                  <b>2.</b> Норма белка по позиции ISSN
                </li>
                <li>
                  <b>3.</b> Углеводы — под тип дня (тренировка/отдых)
                </li>
                <li>
                  <b>4.</b> Дальше — автокоррекция по факту веса, раз в 1-2 недели
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="pricing">
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>Тарифы</span>
          <h2 className={styles.sectionTitle} style={{ textAlign: "center", maxWidth: "none", margin: "0 auto 32px" }}>
            Бесплатный слой реально работает. Pro — для тех, кому важно циклирование
          </h2>
          <PricingCards />
          <div className={styles.tableScroll}>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th>Функция</th>
                  <th>Базовый</th>
                  <th>Pro</th>
                </tr>
              </thead>
              <tbody>
                <FeatureRow label="Фото-распознавание еды" base pro />
                <FeatureRow label="Циклирование углеводов по дням" pro />
                <FeatureRow label="Спортпит: справочник и быстрый ввод" pro />
                <FeatureRow label="Напоминания вокруг тренировки" pro />
                <FeatureRow label="Автокоррекция нормы по весу" pro />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.finalCta}>
            <h2>Следующая тренировка уже в календаре. Твоя норма КБЖУ подстроится под неё сама.</h2>
            <Link href="/onboarding?entry=landing" className={styles.btnPrimary}>
              Начать считать по-тренировочному
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section} id="faq">
        <div className={styles.wrap} style={{ maxWidth: 820 }}>
          <span className={styles.eyebrow}>Вопросы</span>
          <h2 className={styles.sectionTitle}>FAQ</h2>
          <div style={{ marginTop: 24 }}>
            <FaqItem q="Чем это отличается от обычных счётчиков калорий?" defaultOpen>
              Три вещи: норма пересчитывается автоматически по дню тренировки, спортпит — отдельная категория без
              взвешивания, и норма сама корректируется по факту динамики веса, а не остаётся зашитой формулой навсегда.
            </FaqItem>
            <FaqItem q="Насколько точно ИИ считает калории по фото?">
              Честно: у оценки по фото есть погрешность, как и у любого ИИ-распознавания еды. Каждую запись легко
              поправить вручную за секунду, а раз в 1-2 недели приложение сверяет реальную динамику веса и
              подстраивает норму под факт.
            </FaqItem>
            <FaqItem q="Как приложение узнаёт, что сегодня тренировочный день?">
              Вы отмечаете тренировочные дни недели при онбординге (и можете поменять в любой момент в настройках) —
              интеграция с календарём тренировок появится позже.
            </FaqItem>
            <FaqItem q="Это подходит для сушки/на дефиците?">
              Да — на сушке норма белка повышается до 2,3-3,1 г/кг по позиции ISSN. Значения выше 3,0 г/кг требуют
              отдельного подтверждения прямо в приложении — это не медицинская рекомендация, а осознанный шаг с вашей
              стороны.
            </FaqItem>
            <FaqItem q="Нужно ли взвешивать еду?">
              Нет — фото, штрихкод или ручной ввод. Для спортпита — готовые порции («1 мерная ложка», «1 капсула») без
              весов вообще.
            </FaqItem>
            <FaqItem q="Это медицинский/диетологический совет?">
              Нет. Приложение не является медицинским или диетологическим инструментом — это инструмент подсчёта и
              планирования, не замена консультации врача или нутрициолога.
            </FaqItem>
            <FaqItem q="Что после бесплатного периода?">
              Триал Pro длится 7 дней. Если не отмените — спишется по выбранному тарифу, напомним за 2 дня. Базовые
              функции (фото, штрихкод, дневник) остаются бесплатными навсегда в любом случае.
            </FaqItem>
            <FaqItem q="Нужно ли вручную считать углеводы под тренировки?">
              Нет, это автоматика — вы просто отмечаете тренировочные дни один раз, дальше приложение пересчитывает
              углеводы и калории само каждый день.
            </FaqItem>
          </div>
          <p className={styles.faqCta}>
            Ещё есть вопросы?{" "}
            <Link href="/onboarding?entry=landing">Попробуй бесплатно — увидишь сам</Link>
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerLinks}>
            <a href="#">Политика приватности</a>
            <a href="#">Условия использования</a>
            <a href="#">Медицинский дисклеймер</a>
            <a href="#">Контакты</a>
          </div>
          <p className={styles.footerDisclaimer}>
            Приложение «Кольца и Дни» не является медицинским или диетологическим инструментом и не заменяет
            консультацию врача или дипломированного нутрициолога. Фото еды хранятся минимальный срок, необходимый для
            распознавания; аккаунт и все данные можно удалить в любой момент в настройках.
          </p>
          <p className={styles.footerCopy}>© 2026 Кольца и Дни</p>
        </div>
      </footer>
    </>
  );
}

function CompareRow({ oldText, newText }: { oldText: string; newText: string }) {
  return (
    <div className={styles.compareRow}>
      <div className={styles.old}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        {oldText}
      </div>
      <div className={styles.new}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M5 12l5 5L19 7" />
        </svg>
        {newText}
      </div>
    </div>
  );
}

function DemoCard({ kicker, caption, children }: { kicker: string; caption: string; children: React.ReactNode }) {
  return (
    <div className={styles.demoCard}>
      <div className={styles.demoShot}>
        <span className={styles.demoKicker}>{kicker}</span>
        {children}
      </div>
      <div className={styles.demoCaption}>{caption}</div>
    </div>
  );
}

function FeatureRow({ label, base, pro }: { label: string; base?: boolean; pro?: boolean }) {
  return (
    <tr>
      <td>{label}</td>
      <td>
        {base ? (
          <svg className={styles.yes} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M5 12l5 5L19 7" />
          </svg>
        ) : (
          <svg className={styles.no} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        )}
      </td>
      <td>
        {pro ? (
          <svg className={styles.yes} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M5 12l5 5L19 7" />
          </svg>
        ) : (
          <svg className={styles.no} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        )}
      </td>
    </tr>
  );
}

function FaqItem({ q, children, defaultOpen }: { q: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className={styles.faqItem} open={defaultOpen}>
      <summary>
        {q}
        <span className={styles.faqPlus}>+</span>
      </summary>
      <p className={styles.faqAnswer}>{children}</p>
    </details>
  );
}
