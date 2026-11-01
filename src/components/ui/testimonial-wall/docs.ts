import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TestimonialWall } from "@/components/ui/testimonial-wall/testimonial-wall";

<TestimonialWall
  testimonials={[{ quote: "…", name: "Maya Chen", title: "Head of Design, Lumivo", rating: 5 }]}
  height={520}
/>`,
  a11y: [
    "A labelled region of figures: each quote is a blockquote with a figcaption naming the person; star ratings read \"5 out of 5 stars\".",
    "Hovering or focusing the wall eases every column to a stop; the loop copies are aria-hidden and inert.",
    "With reduced motion nothing scrolls on its own: the wall becomes a normal scrollable area.",
  ],
  notes: [
    "Columns drop from three to two to one as the container narrows (container queries), and each runs at its own speed for depth.",
    "Avatars fall back to initials on a gradient generated from the name, so demos need no images.",
  ],
};
