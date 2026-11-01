import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MorphingModal } from "@/components/ui/morphing-modal/morphing-modal";

export function Upgrade() {
  const [view, setView] = useState("plans");
  return (
    <MorphingModal
      trigger={<button>Upgrade</button>}
      view={view}
      title={view === "plans" ? "Choose a plan" : "Payment"}
    >
      {view === "plans" ? <Plans onNext={() => setView("payment")} /> : <Payment />}
    </MorphingModal>
  );
}`,
  a11y: [
    "Built on Radix Dialog: focus is trapped inside, Escape and the close button dismiss it, page scroll is locked and focus returns to the trigger.",
    "The title is the dialog's accessible name and the description is linked automatically.",
    "When the view changes, focus moves to the element marked data-autofocus in the new view (or the view itself), so keyboard and screen reader users never land on <body>.",
    "With reduced motion enabled, the panel resizes instantly and views cross-fade without blur or scale.",
  ],
  notes: [
    "Change the view prop to move between steps; the panel's height morphs with a Motion layout animation while the content cross-fades.",
    "The panel has an inline 20px radius so its corners stay round mid-morph.",
  ],
};
