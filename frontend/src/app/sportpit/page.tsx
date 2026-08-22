import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PlaceholderScreen } from "@/components/dev/PlaceholderScreen";

export default function SportpitPage() {
  return (
    <div className="app-container" style={{ padding: "40px 16px 16px" }}>
      <ScreenHeader title="Спортпит" />
      <PlaceholderScreen title="" spec="требования к дизайну.md §3.1.3, §3.2 Экран 5" />
    </div>
  );
}
