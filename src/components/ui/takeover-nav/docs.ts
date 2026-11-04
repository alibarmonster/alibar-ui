import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TakeoverNav } from "@/components/ui/takeover-nav/takeover-nav";

<TakeoverNav name="Studio Name" items={items} corners={{ topLeft: address, bottomRight: <LanguageSwitch /> }} />`,
  a11y: [
    "The dot button reports `aria-expanded`, names itself Open or Close menu, and controls the menu.",
    "Escape closes the menu and returns focus; hovering or focusing a word fades the others but never hides them.",
    "Under reduced motion the color fades in instead of wiping down, and the words appear without rising.",
  ],
  notes: [
    "The bar is frosted glass (`backdrop-blur`), so it takes on the color of whatever is behind it, including the open menu.",
    "The giant words are the same `items` as the bar, stretched tall and narrow with a transform so any font works.",
    "`corners` fills the four corners of the open menu; the top two hide on narrow widths.",
  ],
};
