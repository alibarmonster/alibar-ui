import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LensTabBar, lensPanelId, lensTabId } from "@/components/ui/lens-tab-bar/lens-tab-bar";
import { House, Inbox, User } from "lucide-react";

const [value, setValue] = useState("home");

<LensTabBar
  id="app"
  value={value}
  onValueChange={setValue}
  tabs={[
    { value: "home", label: "Home", icon: <House />, activeIcon: <House className="fill-current" /> },
    { value: "inbox", label: "Inbox", icon: <Inbox />, badge: 3, badgeLabel: "3 unread" },
    { value: "profile", label: "Profile", icon: <User /> },
  ]}
/>

<div role="tabpanel" id={lensPanelId("app", "home")} aria-labelledby={lensTabId("app", "home")}>…</div>`,
  a11y: [
    "A tablist of real tab buttons with aria-selected and aria-controls, and a roving tabindex. ← → select and focus the previous or next tab (wrapping), Home and End the first and last.",
    "Each tab's accessible name includes its badge through badgeLabel (\"Inbox, 3 unread\"). Labels stay in the name even when labels=\"none\" hides them.",
    "The inverted copy under the lens is decorative and aria-hidden; only the bottom row is in the accessibility tree.",
    "With reduced motion the lens and labels jump straight to the selected tab, with no travel or lean.",
    "Wire panels with lensTabId and lensPanelId so each tab controls its panel and each panel is labelled by its tab.",
  ],
  notes: [
    "The row is rendered twice. The top copy (filled icons, contrasting labels on a dark pill) is clipped with an animated rounded clip-path that matches the lens, so whatever passes under the lens is redrawn inverted.",
    "Every part is a pure function of one continuous position: slot widths, label reveal, the lens position and width, and the clip. The lens slides and resizes as one shape on a single spring with no stretch or squash, and React never re-renders while you drag.",
    "Each slot is 44px plus its open label. Label widths are measured from hidden copies with a ResizeObserver whenever the tabs change. The label you leave fades out at once and the new one fades in only as the lens arrives, so two labels never show together.",
    "Grab the lens on the selected tab and drag or throw it: it lands where its momentum reaches, a quick flick always moves one tab, and it resists past either end. touch-action: pan-y keeps vertical swipes scrolling the page.",
  ],
};
