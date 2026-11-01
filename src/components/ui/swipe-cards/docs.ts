import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { useRef } from "react";
import { SwipeCards, type SwipeCardsHandle } from "@/components/ui/swipe-cards/swipe-cards";

export function Deck({ people }: { people: Person[] }) {
  const deck = useRef<SwipeCardsHandle>(null);
  return (
    <>
      <SwipeCards
        ref={deck}
        className="h-80 w-64"
        items={people}
        getKey={(p) => p.id}
        getLabel={(p) => p.name}
        renderCard={(p) => <ProfileCard person={p} />}
        onSwipe={(p, direction) => console.log(p.name, direction)}
      />
      <button onClick={() => deck.current?.swipe("left")}>Pass</button>
    </>
  );
}`,
  a11y: [
    "The stack is one tab stop: left and right arrow keys swipe the top card, and each swipe is announced (“Kept Maya Chen. 3 left.”).",
    "Always offer buttons too: the ref's swipe(direction) drives them, so dragging is never the only way.",
    "With reduced motion enabled, cards don't rotate and leave with a short fade.",
  ],
  notes: [
    "A swipe commits past `threshold` px, or with a fast flick. The card leaves with the drag's own velocity, and the next card rises while it flies off.",
    "Size the stack with className (e.g. h-80 w-64); cards fill it. Remount with a new key to start over.",
    "The card's rotation follows the drag, and optional stamps fade in on each side.",
  ],
};
