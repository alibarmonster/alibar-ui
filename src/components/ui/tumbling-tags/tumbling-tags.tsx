"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type TagTone = "ink" | "mint" | "sand" | "ember" | { background: string; color: string };

export interface TumblingTag {
  label: string;
  /** Colors of the block. @default "ink" */
  tone?: TagTone;
  /** Makes the block a link. */
  href?: string;
}

export interface TumblingTagsProps {
  /** Blocks from the bottom of the pile up; the first ones land first. */
  tags: TumblingTag[];
  /** Change this value to drop the blocks again. */
  replayKey?: string | number;
  /** Faint blocks along the left and right edges. @default true */
  ghosts?: boolean;
  /** Block height in px. @default 60 */
  blockHeight?: number;
  /** Accessible name for the group. @default "Products" */
  label?: string;
  /** Classes for the root. */
  className?: string;
}

const TONES: Record<Exclude<TagTone, object>, { background: string; color: string }> = {
  ink: { background: "#1f2b27", color: "#f4f6f4" },
  mint: { background: "#c9e6dc", color: "#1f2b27" },
  sand: { background: "#efd5b8", color: "#b44a14" },
  ember: { background: "#cc5216", color: "#fff7ef" },
};

const hash = (n: number) => {
  let h = Math.imul(n + 1, 2654435761);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};

/** Pile rows from the bottom: 2, 1, 2, 1… blocks per row. */
function rowsOf<T>(items: T[]) {
  const rows: T[][] = [];
  let i = 0;
  while (i < items.length) {
    const take = rows.length % 2 === 0 ? 2 : 1;
    rows.push(items.slice(i, i + take));
    i += take;
  }
  return rows;
}

/**
 * Labelled blocks that drop in from above, tumble and settle into a tilted pile (like products
 * stacked on a hero), with faint ghost blocks along the edges. They straighten and lift on hover,
 * and drop again when they scroll into view or `replayKey` changes.
 */
export function TumblingTags({ tags, replayKey, ghosts = true, blockHeight = 60, label = "Products", className }: TumblingTagsProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = rowsOf(tags.map((tag, i) => ({ tag, i })));
  const gap = 12;
  const rowStep = blockHeight + 12;
  const pileWidth = Math.min(width - 32, 680);
  const height = rows.length * rowStep + 48;

  // Rest positions: rows stack upward from the floor, blocks share the row's width.
  const placed = rows.flatMap((row, r) => {
    const each = row.length === 1 ? pileWidth * 0.58 : (pileWidth - gap) / 2;
    return row.map(({ tag, i }, k) => {
      const nudge = (hash(i * 7 + 3) - 0.5) * pileWidth * (row.length === 1 ? 0.18 : 0.06);
      const x = (width - (row.length === 1 ? each : pileWidth)) / 2 + k * (each + gap) + nudge;
      const y = height - 24 - (r + 1) * rowStep;
      // The floor row sits flat; higher rows tilt more.
      const rotate = r === 0 ? 0 : (hash(i * 13 + 1) - 0.5) * Math.min(14, 5 + r * 3);
      return { tag, i, x, y, w: each, rotate, order: r * 2 + k };
    });
  });

  // Ghosts fill only the space beside the pile, running off the edges.
  const side = (width - pileWidth) / 2 - 20;
  const ghostRows = ghosts && side > 24 ? [0, 1, 2].map((r) => ({ y: height - 24 - (r + 1) * rowStep, offset: hash(r + 40) * Math.min(80, side * 0.4) })) : [];
  const dropped = inView;

  return (
    <div ref={ref} role="group" aria-label={label} className={cn("relative w-full overflow-hidden", className)} style={{ height }}>
      {ghostRows.flatMap((g, r) =>
        [-1, 1].map((dir) => (
          <span
            key={`${r}${dir}`}
            aria-hidden="true"
            className="absolute rounded-xl bg-[#e3efea]/70"
            style={{ top: g.y, height: blockHeight, width: side + 60 - g.offset, ...(dir < 0 ? { left: -60 } : { right: -60 }) }}
          />
        )),
      )}
      {placed.map(({ tag, i, x, y, w, rotate, order }) => {
        const tone = typeof tag.tone === "object" ? tag.tone : TONES[tag.tone ?? "ink"];
        const fromRotate = (hash(i * 5 + 9) - 0.5) * 70;
        const fromX = (hash(i * 3 + 2) - 0.5) * 120;
        const content = <span className="truncate">{tag.label}</span>;
        const Block = tag.href ? motion.a : motion.div;
        return (
          <Block
            key={`${replayKey ?? "tags"}-${i}`}
            {...(tag.href ? { href: tag.href } : {})}
            className="absolute flex items-center rounded-xl px-6 text-[clamp(14px,2.2vw,18px)] font-medium shadow-[0_10px_24px_-14px_rgb(0_0_0/0.45)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ left: x, top: y, width: w, height: blockHeight, background: tone.background, color: tone.color }}
            initial={reduceMotion ? { opacity: 0 } : { y: -(y + blockHeight + 80), x: fromX, rotate: fromRotate, opacity: 1 }}
            animate={dropped ? (reduceMotion ? { opacity: 1 } : { y: 0, x: 0, rotate, opacity: 1 }) : undefined}
            whileHover={reduceMotion ? undefined : { rotate: 0, y: -6, transition: { type: "spring", stiffness: 400, damping: 20 } }}
            transition={reduceMotion ? { duration: 0.25, delay: order * 0.05 } : { type: "spring", stiffness: 210, damping: 13, mass: 0.9, delay: order * 0.16 }}
          >
            {content}
          </Block>
        );
      })}
    </div>
  );
}
