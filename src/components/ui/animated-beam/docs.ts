import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AnimatedBeam } from "@/components/ui/animated-beam/animated-beam";

const container = useRef<HTMLDivElement>(null);
const from = useRef<HTMLDivElement>(null);
const to = useRef<HTMLDivElement>(null);

<div ref={container} className="relative flex justify-between">
  <div ref={from}>…</div>
  <div ref={to}>…</div>
  <AnimatedBeam containerRef={container} fromRef={from} toRef={to} curvature={30} />
</div>`,
  a11y: [
    "The beam is decorative (aria-hidden SVG). Convey what the connection means in text nearby.",
    "With reduced motion the pulse doesn't travel: the beam shows as a soft, still gradient line.",
  ],
  notes: [
    "Endpoints are measured relative to the container and re-measured with a ResizeObserver, so beams follow layout changes. The container must be positioned (relative).",
    "The pulse is a dash on a pathLength-normalized path, animated with the Web Animations API, and the gradient runs from start to end in user space, so the pulse changes color as it travels.",
  ],
};
