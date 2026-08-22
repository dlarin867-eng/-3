import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PlaceholderScreen } from "@/components/dev/PlaceholderScreen";

export default function BarcodePage() {
  return (
    <div className="app-container" style={{ padding: "40px 16px 16px" }}>
      <ScreenHeader title="Штрихкод" />
      <PlaceholderScreen title="" spec="требования к дизайну.md §3.1.4, §3.2 Экран 4" />
    </div>
  );
}
