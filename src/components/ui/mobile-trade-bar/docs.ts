import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MobileTradeBar } from "@/components/ui/mobile-trade-bar/mobile-trade-bar";

// Fixed to the viewport on small screens; hide it from md up with className
<MobileTradeBar market={market} className="md:hidden" />

// Inside a framed preview: pass the scrolling element and use contained
<MobileTradeBar market={market} scrollContainer={scrollerRef} contained />`,
  a11y: [
    "The Yes and No buttons include the price. Opening one moves focus into the sheet, which is a labelled modal dialog; closing returns focus to the button that opened it.",
    "Escape, the backdrop and the close button all dismiss the sheet. Dragging the handle is optional; the handle is also a button that toggles the tall snap point.",
    "With reduced motion the button-to-sheet morph and spring snaps become instant.",
  ],
  notes: [
    "The bar hides when the page scrolls down and returns on scroll up. Pass scrollContainer when the scrolling element is not the window.",
    "The sheet has two snap points (68% and 92% of the container); a fast or long downward drag closes it.",
    "The sheet contains Trade Ticket, so pricing, impact and confirmation behave exactly as in #165.",
  ],
};
