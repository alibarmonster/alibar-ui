import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PixelBloomSelect } from "@/components/ui/pixel-bloom-select/pixel-bloom-select";

<PixelBloomSelect
  label="Vibe"
  defaultValue="verdant-sigil"
  options={[
    { value: "verdant-sigil", label: "Verdant Sigil", palette: ["#0d1a12", "#3a6a3e", "#b6ca7c", "#f0f3d8"] },
    { value: "midnight-ledger", label: "Midnight Ledger", palette: ["#070b1f", "#24347a", "#7896ec", "#dfe7ff"] },
  ]}
  onValueChange={setVibe}
/>`,
  a11y: [
    "Select-only combobox pattern: the trigger is a combobox named by the label and current value; the list is a listbox of options with aria-selected and aria-activedescendant.",
    "Arrow keys, Home and End move the highlight, typing jumps to a matching label, Enter or Space chooses, Escape closes, and focus returns to the trigger.",
    "Option text is real DOM above the canvas, so it stays crisp and readable by screen readers. Under reduced motion the list simply fades in and out.",
  ],
  notes: [
    "Each cell of the pixel field has an 8×8 Bayer threshold. Opening sweeps a reveal edge from top to bottom: cells whose threshold is above the edge stay solid, the rest clear and leave a faint tint behind the text. The DOM list follows the same edge through a CSS mask.",
    "Closing solidifies the cells from the bottom up, then lets them fall with a little gravity and fade. The panel stays mounted (and inert to the pointer) until they have fallen.",
    "Colors come from each option's `palette` (2–8 hex colors, dark to light) or a preset by position. The highlighted option's palette dithers in over the current one, so each option previews its colors.",
  ],
};
