import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PlaceholderScreen } from "@/components/dev/PlaceholderScreen";

export default function PhotoPage() {
  return (
    <div className="app-container" style={{ padding: "40px 16px 16px" }}>
      <ScreenHeader title="Фото еды" />
      <PlaceholderScreen title="" spec="требования к дизайну.md §3.1.1, §3.2 Экран 3" />
    </div>
  );
}
