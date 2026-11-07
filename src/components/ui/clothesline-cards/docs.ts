import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ClotheslineCards } from "@/components/ui/clothesline-cards/clothesline-cards";

<ClotheslineCards
  eyebrow="People / 2026"
  title="Fourteen people,"
  accentTitle="one long line."
  description="Pull a card to give it a swing, or flip it to read the back."
  total={14}
  people={[
    { id: "maya", name: "Maya Lindqvist", role: "Product Designer", portrait: "/team/maya.webp", bio: "…", skills: ["Interaction"], links: [{ label: "Portfolio", href: "/maya" }] },
  ]}
/>`,
  a11y: [
    "The cards are a list. Each front is an article named by the person and role, with a real “View profile” link and a round button (aria-pressed) that flips the card; the back has its own Back button.",
    "The face that is turned away is inert and hidden from screen readers, so Tab only reaches what is visible.",
    "Swinging, the shimmer and dragging are pointer extras. Under reduced motion the cards hang still, the shimmer is off and the flip is a crossfade.",
  ],
  notes: [
    "One requestAnimationFrame loop drives every card as a damped pendulum (spring and damping) with a little wind at its own phase, plus a tug from its neighbors through the string. It writes transforms and the string's SVG path directly, so nothing re-renders while cards swing, and it pauses offscreen and in hidden tabs.",
    "Moving a mouse across the cards pushes them the way it moves. Dragging a card swings it and pulls its clip down; the string sags with it and the neighbors dip a little. Touch keeps native horizontal scrolling, and a tap flips.",
    "The shimmer is two layers driven by CSS variables set on pointer move: an iridescent band whose angle follows the pointer, and a soft highlight under it. People without a portrait get a gradient with their initials.",
  ],
};
