"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TabBar } from "@/components/ui/TabBar";
import { useAuth } from "@/lib/auth-context";

// Общая оболочка для 5 разделов с таб-баром (Главный/Дневник/Вес/Отчёты/
// Настройки). Фото/Штрихкод/Спортпит — отдельные полноэкранные роуты без
// таб-бара (открываются с главного экрана через быстрые действия, см.
// требования к дизайну.md §3.2 — "Ряд быстрых действий").
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/onboarding");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="app-container">
      <main style={{ flex: 1, overflowY: "auto", padding: "40px 16px 16px" }}>{children}</main>
      <TabBar />
    </div>
  );
}
