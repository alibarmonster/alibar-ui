import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DraggableMarquee } from "@/components/ui/draggable-marquee/draggable-marquee";

export function Testimonials() {
  return (
    <DraggableMarquee aria-label="Testimonials" showControls>
      {quotes.map((q) => <QuoteCard key={q.id} {...q} />)}
    </DraggableMarquee>
  );
}`,
  a11y: [
    "Only the first copy of the items is exposed to assistive tech; the copies that make the loop seamless are aria-hidden and inert.",
    "It slows to a stop while hovered or while keyboard focus is inside, and showControls adds a pause button, so moving content can always be stopped.",
    "With reduced motion enabled, nothing moves: the copies are hidden and the row becomes a normal horizontally scrollable list.",
  ],
  notes: [
    "Drag or swipe to scrub. A flick carries on with its momentum and eases back to the cruising speed, and a drag never triggers a click on the item it started on.",
    "Enough copies are rendered to cover any width, and the loop wraps within one copy's width, so it never runs out. It pauses while offscreen.",
    "Vertical page scrolling still works on touch: only horizontal drags are captured.",
  ],
};
