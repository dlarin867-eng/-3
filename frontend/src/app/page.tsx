import { redirect } from "next/navigation";

// Точка входа приложения — в реальном флоу тут решение "есть сессия -> /main,
// нет -> /onboarding" (авторизация, блок 8+). Пока просто ведёт в онбординг.
export default function RootPage() {
  redirect("/onboarding");
}
