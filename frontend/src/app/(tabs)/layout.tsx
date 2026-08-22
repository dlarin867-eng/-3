import { TabBar } from "@/components/ui/TabBar";

// Общая оболочка для 5 разделов с таб-баром (Главный/Дневник/Вес/Отчёты/
// Настройки). Фото/Штрихкод/Спортпит — отдельные полноэкранные роуты без
// таб-бара (открываются с главного экрана через быстрые действия, см.
// требования к дизайну.md §3.2 — "Ряд быстрых действий").
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container">
      <main style={{ flex: 1, overflowY: "auto", padding: "40px 16px 16px" }}>{children}</main>
      <TabBar />
    </div>
  );
}
