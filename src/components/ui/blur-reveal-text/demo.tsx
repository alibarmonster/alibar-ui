"use client";

import { BlurRevealText } from "@/components/ui/blur-reveal-text/blur-reveal-text";

export function Default() {
  return (
    <figure className="max-w-lg text-center">
      <BlurRevealText
        as="blockquote"
        className="text-xl leading-snug font-medium tracking-tight text-balance text-foreground sm:text-2xl"
        text="Good motion is invisible. It explains where things came from, where they went, and then gets out of the way."
      />
      <figcaption className="mt-4 text-[13px] text-muted-foreground">Words resolve from blur as they enter the viewport.</figcaption>
    </figure>
  );
}

export function ByCharacter() {
  return (
    <BlurRevealText
      as="p"
      by="character"
      blur={14}
      offset={14}
      className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-5xl"
      text="Motion with intent"
    />
  );
}

const SECTIONS = [
  { title: "Measure first", body: "Every transition starts from a real layout, so nothing jumps when it settles." },
  { title: "Then move", body: "Only transform, opacity and filter animate, which keeps the main thread free at 60fps." },
  { title: "Respect the user", body: "With reduced motion on, every reveal becomes a quiet fade with no movement at all." },
  { title: "Get out of the way", body: "The best animation is the one you only notice when it's missing." },
];

export function OnScroll() {
  return (
    <div className="h-64 w-full max-w-md overflow-y-auto rounded-xl border border-border bg-background px-6 shadow-sm" tabIndex={0} aria-label="Scrollable notes">
      <p className="sticky top-0 bg-background/90 pt-5 pb-3 text-[13px] text-muted-foreground backdrop-blur">Scroll down ↓</p>
      <div className="space-y-16 pt-24 pb-24">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <BlurRevealText as="p" text={section.title} className="text-lg font-semibold tracking-tight text-foreground" amount={1} />
            <BlurRevealText text={section.body} className="mt-1.5 text-sm leading-relaxed text-muted-foreground" delay={0.15} amount={0.8} />
          </div>
        ))}
      </div>
    </div>
  );
}
