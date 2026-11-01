import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PasswordInput } from "@/components/ui/password-input/password-input";

export function SignUpPassword() {
  return <PasswordInput aria-label="Password" autoComplete="new-password" showRequirements />;
}`,
  a11y: [
    "The visibility toggle is a button labelled \"Show password\" with aria-pressed and aria-controls, as recommended for toggle buttons.",
    "The strength level is announced through a polite live region (\"Password strength: Fair\") only when the level changes.",
    "Each checklist item has visually hidden \"Done:\" or \"Missing:\" text, so the state isn't conveyed by color alone.",
    "Strength labels stay in the foreground color; meter colors are decorative, so contrast never depends on them.",
    "With reduced motion enabled, the meter, checks and slash snap to their end state.",
  ],
  notes: [
    "Pass your own requirements to change both the score and the checklist; the score is the share of rules met, spread over four segments.",
    "The slash on the eye is cut with an SVG mask, so the icon reads correctly on hover backgrounds.",
  ],
};
