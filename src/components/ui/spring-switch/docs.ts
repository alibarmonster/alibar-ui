import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SpringSwitch } from "@/components/ui/spring-switch/spring-switch";

export function NotificationsSetting() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="notifications">Notifications</label>
      <SpringSwitch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
    </div>
  );
}`,
  a11y: [
    "A native button with role=\"switch\" and aria-checked, so it is announced as a switch and toggles with Space or Enter.",
    "Pair it with a <label htmlFor> or pass aria-label; the thumb and color layers are aria-hidden.",
    "Small and medium sizes extend their hit area to about 40px without changing the layout.",
    "With reduced motion enabled, the thumb glides without overshoot, squash or stretch.",
  ],
  notes: [
    "The squash and stretch runs on every change, including changes from a controlled checked prop.",
    "Pass name to submit \"on\" with a form while checked, like a native checkbox.",
  ],
};
