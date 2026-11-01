import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StatefulButton } from "@/components/ui/stateful-button/stateful-button";

export function SaveButton() {
  return (
    <StatefulButton onClick={() => saveSettings()} loadingLabel="Saving" successLabel="Saved">
      Save changes
    </StatefulButton>
  );
}`,
  a11y: [
    "While loading the button sets aria-busy and aria-disabled instead of disabled, so it keeps keyboard focus.",
    "Clicks are ignored until the button is back to idle, which prevents double submits.",
    "A polite status region announces the loading, success and error labels.",
    "With reduced motion enabled, labels cross-fade, the width snaps, the error shake is skipped and the spinner pulses instead of rotating.",
  ],
  notes: [
    "Return a promise from onClick to drive the states automatically: resolve for success, reject for error.",
    "Pass `state` to control it yourself, for example when the result comes from a form library.",
    "The width animates with a Motion layout animation, so the corner radius is set inline (10px, or 14px for lg) to stay round mid-animation.",
  ],
};
