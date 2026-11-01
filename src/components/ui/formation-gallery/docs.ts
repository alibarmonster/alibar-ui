import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FormationGallery } from "@/components/ui/formation-gallery/formation-gallery";

<div className="h-[34rem]">
  <FormationGallery items={photos} count={96} transition="gather" onFormationChange={(name) => console.log(name)}>
    <h2 className="text-2xl font-semibold">Ninety-six prints, four formations</h2>
  </FormationGallery>
</div>`,
  a11y: [
    "The canvas is decorative (aria-hidden). A visually hidden list of buttons, one per photo, opens any photo enlarged with its caption; Escape or the close button puts it back.",
    "The formation buttons report the current formation with aria-pressed. Space pauses spin, drift and the formation timer; hovering or opening a card pauses the timer too.",
    "Your centered content stays real, focusable DOM; it becomes inert (and the formation buttons too) while a card is open.",
    "With reduced motion nothing spins or drifts, formation changes and opening jump straight to the end, and the group tilt is off.",
    "Without WebGL the photos render as a plain, swipeable scroll-snap list.",
  ],
  notes: [
    "Every formation is a function of the card index and a few live values (spin angle, pan, time): rings share cards by circumference and counter-rotate, the spiral uses the golden angle, the globe is a Fibonacci sphere and the field is a seeded scatter that drifts and wraps.",
    "Transitions blend two live formations, so cards keep moving mid-flight. Each card starts up to 0.45 s late for an organic feel; gather clusters them in the center before bursting out, swirl interpolates angle and radius around the center with an extra half turn, direct flies straight.",
    "The clearance stays readable: cards fade out inside it, which also hides the front of the globe and field cards panned through the middle.",
    "160 cards plus their shadows are one instanced WebGL2 draw (320 instances). Cards morph between rounded squares and circles in the shader.",
    "wheel is off by default because the formations have no ends, so a wheel handler would trap page scrolling. Turn it on for full-screen use.",
  ],
};
