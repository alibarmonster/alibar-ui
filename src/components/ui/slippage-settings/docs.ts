import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SlippageSettings } from "@/components/ui/slippage-settings/slippage-settings";

const [slippage, setSlippage] = useState(50); // basis points: 50 = 0.5%

<SlippageSettings value={slippage} onValueChange={setSlippage} />`,
  a11y: [
    "Presets are a labelled radio group; the custom field has its own label and sets aria-invalid on bad input.",
    "Warnings (too low, frontrun risk, invalid) are alerts with an icon and text, never color alone.",
    "The trigger names itself \"Slippage settings, 0.5%\". The popover is a Radix Popover with focus management and Escape to close.",
    "The active pill slides between presets and the custom field. Reduced motion moves it instantly.",
  ],
  notes: [
    "Values are basis points. Custom input is parsed with string math (no floats), accepts up to two decimals and commits on Enter or blur.",
    "Tune lowThreshold, highThreshold and max to match your protocol's limits.",
  ],
};
