import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { IconHeadline } from "@/components/ui/icon-headline/icon-headline";

<IconHeadline
  parts={[
    "Where",
    { icons: [<RocketIcon key="r" />, <MusicIcon key="m" />], backgrounds: ["#f43f5e", "#8b5cf6"] },
    "teams find designs that work",
  ]}
/>`,
  a11y: [
    "Screen readers hear the words only: the heading carries the text as its name, and the icon tiles are aria-hidden.",
    "Icons swap on a timer that pauses in hidden tabs. Under reduced motion the words and tiles fade in, and the icons don't cycle.",
  ],
  notes: [
    "Tiles are sized in em, so they scale with the heading's font size and sit on the text's line like a word.",
    "Each slot can hold one icon (it just pops in) or several (it flips through them, staggered across slots). Set `interval` to 0 to keep the first icon.",
    "Use your own icon art; the demo uses plain line icons on colored tiles rather than any real company's app icon.",
  ],
};
