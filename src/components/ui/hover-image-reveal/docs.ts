import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import Link from "next/link";
import { HoverImageReveal } from "@/components/ui/hover-image-reveal/hover-image-reveal";

export function Work() {
  return (
    <HoverImageReveal
      linkComponent={Link}
      items={[
        { id: "aurora", title: "Aurora Design System", meta: "2026", href: "/work/aurora", image: <img src="/aurora.jpg" alt="" /> },
      ]}
    />
  );
}`,
  a11y: [
    "A plain list of links; the floating preview is decorative and aria-hidden.",
    "Keyboard focus shows the preview too, anchored beside the focused row.",
    "With reduced motion enabled, the preview follows without lag or tilt and swaps with a fade.",
  ],
  notes: [
    "The preview springs after the cursor, leans in the direction it's travelling, and flips to the left near the right edge.",
    "Each new image wipes up from the bottom with clip-path while the previous one fades out underneath.",
    "Touch devices don't get a floating preview; the list works as normal links.",
  ],
};
