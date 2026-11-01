import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ColorPicker } from "@/components/ui/color-picker/color-picker";

export function AccentSetting() {
  const [accent, setAccent] = useState("#2563eb");
  return <ColorPicker value={accent} onValueChange={setAccent} />;
}`,
  a11y: [
    "Swatches form a radiogroup with one tab stop. Arrow keys move through the grid (six per row), and each swatch is labelled with its hex value.",
    "The hue control is a slider with aria-valuetext in degrees; arrows step by 1 (Shift by 10), PageUp and PageDown by 30.",
    "The hex field is labelled \"Hex color\" and marks partial or invalid input with aria-invalid; it resets to the current color on blur.",
    "The eyedropper button only appears in browsers that support the EyeDropper API.",
    "With reduced motion enabled, the selection ring and hue thumb jump instead of gliding.",
  ],
  notes: [
    "Values are normalized to lowercase six-digit hex, and #abc is accepted in the field.",
    "Moving the hue keeps the current saturation and lightness; greys get a usable saturation so the change is visible.",
  ],
};
