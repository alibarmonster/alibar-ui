"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Shuffle } from "lucide-react";
import { backdrops } from "@/components/site/preview-backdrops";
import { getComponent } from "@/content/components";
import { cn } from "@/lib/utils";

/** Light backgrounds from the library that read well behind the hero copy, with props tuned for it. */
const SCENES: { slug: string; props?: Record<string, unknown>; className?: string }[] = [
  { slug: "ascii-koi-pond", props: { showCounter: false, koi: 6, lilyPads: 4 } },
  { slug: "pixel-landscape", props: { palette: "alpine", seed: 3, height: 0.4 } },
  { slug: "ascii-aquarium-background" },
  { slug: "dithered-waves" },
  { slug: "mesh-gradient", props: { colors: ["#FED7AA", "#FBCFE8", "#DDD6FE", "#E0F2FE"], speed: 1.4 } },
  { slug: "particle-field" },
  { slug: "dot-matrix-field" },
  { slug: "liquid-ripple" },
  // The mosaic always scatters to the far edge, so a mask keeps it to a band along the bottom.
  { slug: "pixel-mosaic", props: { edge: "top", fill: 0.3 }, className: "[mask-image:linear-gradient(to_top,#000_6%,transparent_26%)]" },
  { slug: "cloud-shader", props: { density: 3, speed: 0.6, quality: "medium", skyTopColor: "#DCEBFA" } },
];

const pick = (not?: number) => {
  let next = Math.floor(Math.random() * SCENES.length);
  if (next === not) next = (next + 1) % SCENES.length;
  return next;
};

/**
 * The landing hero's background: one of the library's animated backgrounds, chosen at random once
 * the browser is idle (so it never competes with the first paint). The pill in the corner names it,
 * links to it and shuffles to another.
 */
export function HeroBackdrop() {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const start = () => setIndex((i) => i ?? pick());
    const idle = window.requestIdleCallback?.(start, { timeout: 2000 });
    const timer = idle === undefined ? window.setTimeout(start, 900) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const scene = index === null ? null : SCENES[index];
  const entry = scene ? backdrops[scene.slug] : null;
  const name = scene ? (getComponent(scene.slug)?.name ?? scene.slug) : null;
  const Scene = entry?.Component;

  return (
    <>
      <AnimatePresence>
        {scene && Scene ? (
          <motion.div key={scene.slug} aria-hidden="true" className={cn("absolute inset-0", scene.className)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: "easeOut" }}>
            <Scene {...entry.props} {...scene.props} className="absolute inset-0 size-full" />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* A soft clearing behind the copy keeps it readable over any background. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_46%_40%_at_50%_46%,var(--background)_40%,transparent)] opacity-90" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />

      <div className="absolute right-4 bottom-4 z-10 flex items-center rounded-full border border-border bg-background/85 p-1 text-xs shadow-sm backdrop-blur sm:right-6" aria-live="polite">
        {scene ? (
          <Link href={`/components/${scene.slug}`} className="focus-ring group inline-flex h-7 items-center gap-1 rounded-full pr-2 pl-2.5 font-medium text-foreground hover:bg-surface">
            <span className="text-muted-foreground">Background:</span> {name}
            <ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex h-7 items-center px-2.5 text-muted-foreground">Loading background…</span>
        )}
        <button
          type="button"
          onClick={() => setIndex((i) => pick(i ?? undefined))}
          disabled={index === null}
          className="focus-ring group inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-3 font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
        >
          <Shuffle className="size-3.5 transition-transform duration-300 group-hover:rotate-180" aria-hidden="true" />
          Shuffle
        </button>
      </div>
    </>
  );
}
