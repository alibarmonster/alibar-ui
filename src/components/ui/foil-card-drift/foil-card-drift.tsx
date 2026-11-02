"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type FoilDesign = "obsidian" | "sky" | "chrome" | "lime";

export interface FoilCard {
  id: string;
  /** Accessible name, e.g. "Obsidian card". */
  label: string;
  /** A built-in face. Ignored when `children` is set. @default "obsidian" */
  design?: FoilDesign;
  /** Name embossed on the card. */
  holder?: string;
  /** Your own card face; the foil and chip are still drawn on top. */
  children?: ReactNode;
}

export interface FoilCardDriftProps {
  /** Cards on the loop (3 or more look best). */
  cards: FoilCard[];
  /** Drift speed in px per second; negative drifts right. @default 46 */
  speed?: number;
  /** Space between card centers, as a share of the card width. @default 1.1 */
  spacing?: number;
  /** Card width in px. @default 240 */
  cardWidth?: number;
  /** Start paused. @default false */
  defaultPaused?: boolean;
  /** Accessible name for the strip. @default "Cards" */
  label?: string;
  /** Classes for the root. */
  className?: string;
}

/** A globe of arcs drawn as a mask, filled with foil. */
const EMBLEM = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="#000" stroke-width="5"><circle cx="50" cy="50" r="40"/><ellipse cx="50" cy="50" rx="18" ry="40"/><path d="M12 36h76M12 64h76M10 50h80"/></svg>',
)}")`;

function Face({ design, holder }: { design: FoilDesign; holder?: string }) {
  if (design === "sky") {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(#7fb6ff,#cfe6ff_55%,#7cc46b_56%,#5aa64c)]">
        <svg viewBox="0 0 300 190" className="absolute inset-0 size-full" aria-hidden="true">
          <g fill="#fff" opacity="0.9">
            <ellipse cx="70" cy="48" rx="34" ry="12" />
            <ellipse cx="200" cy="34" rx="44" ry="13" />
          </g>
          <g fill="none" stroke="#d7ff3a" strokeWidth="4" strokeLinecap="round">
            <path d="M40 120c20-30 40 30 60 0s40 30 60 0" />
            <path d="M230 70l8 16 18 3-13 12 3 18-16-9-16 9 3-18-13-12 18-3z" />
            <circle cx="150" cy="92" r="14" />
          </g>
          <circle cx="250" cy="140" r="12" fill="#ef4444" />
        </svg>
        {holder ? <span className="absolute bottom-4 left-5 text-[11px] font-semibold tracking-[0.12em] text-white uppercase drop-shadow">{holder}</span> : null}
      </div>
    );
  }
  if (design === "chrome") {
    return <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#d9dce1_0_2px,#c7cbd2_2px_4px),linear-gradient(135deg,#f5f6f8,#9aa1ab)] bg-blend-multiply" />;
  }
  if (design === "lime") {
    return <div className="absolute inset-0 bg-[#d7ff3a] bg-[linear-gradient(rgb(0_0_0/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(0_0_0/0.06)_1px,transparent_1px)] bg-[size:18px_18px]" />;
  }
  return <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#26272b,#0a0a0b_65%)]" />;
}

function DriftCard({ card, index, count, offset, spacingPx, width, height }: { card: FoilCard; index: number; count: number; offset: MotionValue<number>; spacingPx: number; width: number; height: number }) {
  const design = card.design ?? "obsidian";
  const loop = count * spacingPx;
  // Position on the loop relative to the center, wrapped to [-loop/2, loop/2).
  const x = useTransform(offset, (o) => {
    const raw = index * spacingPx + o;
    return ((((raw + loop / 2) % loop) + loop) % loop) - loop / 2;
  });
  const s = useTransform(x, (v) => Math.max(-1.6, Math.min(1.6, v / (spacingPx * 1.6))));
  const rotateY = useTransform(s, (v) => -v * 26);
  const rotateZ = useTransform(s, (v) => v * 5 - 3);
  const z = useTransform(s, (v) => -Math.abs(v) * 140);
  const opacity = useTransform(s, (v) => 1 - Math.max(0, Math.abs(v) - 1.1) * 1.6);
  // The foil shifts with the card's turn, like a hologram catching light.
  const foilPos = useTransform(s, (v) => `${50 + v * 60}% 50%`);
  const foil = useMotionTemplate`${foilPos}`;

  return (
    <motion.div
      role="listitem"
      aria-label={card.label}
      className="absolute top-1/2 left-1/2"
      style={{ x, z, rotateY, rotateZ, rotateX: 6, opacity, width, height, marginLeft: -width / 2, marginTop: -height / 2 }}
    >
      <div className="relative size-full overflow-hidden rounded-[14px] shadow-[0_30px_40px_-24px_rgb(0_0_0/0.45),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
        {card.children ?? <Face design={design} holder={card.holder} />}
        {design === "obsidian" && !card.children ? (
          <motion.span
            aria-hidden="true"
            className="absolute top-1/2 left-[28%] size-[46%] -translate-x-1/2 -translate-y-1/2"
            style={{
              backgroundImage: "linear-gradient(110deg,#ffffff 10%,#7dd3fc 25%,#c084fc 38%,#fde68a 50%,#ffffff 60%,#86efac 72%,#f9a8d4 85%,#ffffff 95%)",
              backgroundSize: "300% 100%",
              backgroundPosition: foil,
              WebkitMaskImage: EMBLEM,
              maskImage: EMBLEM,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }}
          />
        ) : null}
        {/* Chip. */}
        <span aria-hidden="true" className="absolute top-1/2 right-[12%] h-[21%] w-[13%] -translate-y-1/2 rounded-[18%] border border-white/30 bg-[linear-gradient(135deg,#55575c,#2a2b2f)]" />
        {/* A faint holographic sheen over the whole card. */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{ backgroundImage: "linear-gradient(115deg,transparent 30%,rgb(255 255 255/0.5) 45%,rgb(147 197 253/0.35) 52%,rgb(244 114 182/0.3) 58%,transparent 70%)", backgroundSize: "260% 100%", backgroundPosition: foil }}
        />
      </div>
    </motion.div>
  );
}

/**
 * Payment-style cards drifting past in 3D: each card turns, recedes and fades as it moves away from
 * the center, and a holographic foil shifts with its angle. Hover slows the drift, dragging scrubs it,
 * and a pause button stops it. Built-in faces: obsidian with a foil emblem, sky, chrome and lime.
 */
export function FoilCardDrift({ cards, speed = 46, spacing = 1.1, cardWidth = 240, defaultPaused = false, label = "Cards", className }: FoilCardDriftProps) {
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(defaultPaused);
  const offset = useMotionValue(0);
  const rate = useRef(1);
  const hover = useRef(false);
  const drag = useRef<{ x: number; o: number } | null>(null);
  const width = cardWidth;
  const height = Math.round(cardWidth / 1.586);
  const spacingPx = width * spacing;
  const still = paused || !!reduceMotion;

  useAnimationFrame((_, delta) => {
    if (drag.current) return;
    const target = still ? 0 : hover.current ? 0.15 : 1;
    rate.current += (target - rate.current) * Math.min(1, delta / 250);
    if (Math.abs(rate.current) < 0.001) return;
    offset.set(offset.get() - speed * rate.current * (delta / 1000));
  });

  return (
    <div
      className={cn("relative w-full touch-pan-y overflow-hidden select-none [perspective:1400px]", className)}
      style={{ height: height + 140 }}
      onPointerEnter={(e) => e.pointerType !== "touch" && (hover.current = true)}
      onPointerLeave={() => {
        hover.current = false;
        drag.current = null;
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        drag.current = { x: e.clientX, o: offset.get() };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => drag.current && offset.set(drag.current.o + (e.clientX - drag.current.x))}
      onPointerUp={() => (drag.current = null)}
    >
      <div role="list" aria-label={label} className="absolute inset-0 cursor-grab [transform-style:preserve-3d] active:cursor-grabbing">
        {cards.map((card, i) => (
          <DriftCard key={card.id} card={card} index={i} count={Math.max(cards.length, 3)} offset={offset} spacingPx={spacingPx} width={width} height={height} />
        ))}
      </div>
      {!reduceMotion ? (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the card drift" : "Pause the card drift"}
          aria-pressed={paused}
          className="absolute right-3 bottom-3 grid size-9 cursor-pointer place-items-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}
