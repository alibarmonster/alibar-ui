import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TickerHeader } from "@/components/ui/ticker-header/ticker-header";

<TickerHeader brand={<Logo />} items={items} actions={actions} announcements={["Version 4 is out", "Join the live workshop"]} />`,
  a11y: [
    "The strip pauses on hover and while it holds focus, and has a dismiss button.",
    "Under reduced motion it shows the first message, still.",
    "Repeated copies of the messages are hidden from screen readers.",
  ],
  notes: [
    "The strip folds away once the page scrolls; pass `scrollContainer` for a scrolling panel.",
    "`duration` sets the seconds per loop.",
  ],
};
