import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

// Inter — интерфейс и тело текста; Manrope — крупные цифры и заголовки.
// Golos Text как резерв не подключаем на старте (см. требования к дизайну.md
// §2.3) — добавить, если Manrope не даст нужного начертания на реальных цифрах.
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Кольца и Дни",
  description: "ИИ-счётчик калорий для тех, кто тренируется в зале",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#121216" },
  ],
};

// Тему читаем и применяем ДО гидратации React (иначе — вспышка не той темы
// на долю секунды). localStorage — единственный источник истины для явного
// выбора пользователя; если он ничего не выбирал, тема решается media query
// в globals.css самим браузером, и этот скрипт ничего не трогает.
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
