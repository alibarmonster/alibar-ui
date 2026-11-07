"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClotheslineLink {
  label: string;
  href: string;
}

export interface ClotheslinePerson {
  id: string;
  name: string;
  role: string;
  /** Portrait image. Without it, a soft gradient with initials is drawn. */
  portrait?: string;
  /** Shown on the back of the card. */
  bio?: string;
  /** Shown as chips on the back. */
  skills?: string[];
  /** Links on the back; the first is also the front's "View profile" target. */
  links?: ClotheslineLink[];
}

export interface ClotheslineCardsProps extends Omit<ComponentProps<"section">, "title"> {
  /** People to hang on the line. @default six sample people */
  people?: ClotheslinePerson[];
  /** Small label above the headline. @default "The team" */
  eyebrow?: string;
  /** First line of the headline. @default "Meet the people" */
  title?: string;
  /** Second line of the headline, in the accent color. @default "behind the work." */
  accentTitle?: string;
  /** Side text next to the headline. */
  description?: string;
  /** Team size shown in the counter ("14 people · one team"). @default people.length */
  total?: number;
  /** Header on each card. @default "People · Studio" */
  cardLabel?: string;
  /** Footer hint. @default "Hover to shimmer · click or tap to flip" */
  hint?: string;
}

const SAMPLE: ClotheslinePerson[] = [
  { id: "raka", name: "Raka Pratama", role: "Creative Director", bio: "Leads brand films and launches, and still storyboards by hand.", skills: ["Direction", "Film"] },
  { id: "maya", name: "Maya Lindqvist", role: "Product Designer", bio: "Turns messy workflows into calm interfaces.", skills: ["Interaction", "Systems"] },
  { id: "lena", name: "Lena Okafor", role: "Motion Designer", bio: "Choreographs type and interface motion.", skills: ["Motion", "Type"] },
  { id: "jonas", name: "Jonas Mireles", role: "Frontend Engineer", bio: "Builds the interactive pieces, down to the last frame.", skills: ["React", "WebGL"] },
  { id: "aiko", name: "Aiko Brandt", role: "3D Artist", bio: "Sculpts soft, tactile objects and lights them like products.", skills: ["Sculpt", "Light"] },
  { id: "sana", name: "Sana Idris", role: "Illustrator", bio: "Draws characters, maps and spot art, pencil first.", skills: ["Drawing", "Print"] },
];

const CARD_WIDTH = 236;
const TAU = Math.PI * 2;

const hue = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface Swing {
  angle: number;
  velocity: number;
  pull: number;
  pullVelocity: number;
  phase: number;
  /** Drag targets while a card is held. */
  hold: { angle: number; pull: number } | null;
}

/**
 * Profile cards clipped to a sagging string, each swinging on a damped pendulum with a little wind
 * at its own phase. Moving the cursor across them pushes them aside; dragging a card pulls it (and
 * the string flexes), and it swings back on release. Hovering sweeps a holographic shimmer that
 * follows the pointer; a click or tap flips a card to its bio, skills and links. Narrow containers
 * scroll horizontally with snapping. Reduced motion keeps the cards still and crossfades the flip.
 */
export function ClotheslineCards({
  people = SAMPLE,
  eyebrow = "The team",
  title = "Meet the people",
  accentTitle = "behind the work.",
  description = "Designers, engineers and storytellers who like making things that move. Pull a card or flip it over to say hello.",
  total,
  cardLabel = "People · Studio",
  hint = "Hover to shimmer · click or tap to flip",
  className,
  ...props
}: ClotheslineCardsProps) {
  const reduceMotion = useReducedMotion();
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(() => new Set());
  const trackRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const hangers = useRef<(HTMLDivElement | null)[]>([]);
  const swings = useRef<Swing[]>([]);
  const pointer = useRef({ x: 0, t: 0, card: -1, startX: 0, startY: 0, dragged: false, id: -1 });
  const count = total ?? people.length;
  const peopleKey = people.map((p) => p.id).join("|");

  const toggle = (id: string) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // One loop for every card: damped pendulums, wind, neighbors tugging on the string.
  useEffect(() => {
    const track = trackRef.current;
    const path = pathRef.current;
    if (!track || !path) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = 0;
    let time = 0;
    let visible = true;
    let clips: { x: number; y: number }[] = [];
    let width = 0;

    swings.current = peopleKey.split("|").map((_, i) => ({ angle: 0, velocity: 0, pull: 0, pullVelocity: 0, phase: (i * 2.399) % TAU, hold: null }));

    const measure = () => {
      width = track.scrollWidth;
      clips = hangers.current.map((el) => {
        const slot = el?.parentElement;
        const x = slot ? slot.offsetLeft + slot.offsetWidth / 2 : 0;
        return { x, y: 18 + 12 * Math.sin((Math.PI * x) / Math.max(1, width)) };
      });
    };

    const paint = () => {
      const s = swings.current;
      let d = `M 0 8`;
      let prev = { x: 0, y: 8 };
      clips.forEach((clip, i) => {
        const y = clip.y + (s[i]?.pull ?? 0);
        // Each span droops a little between its two clips.
        d += ` Q ${((prev.x + clip.x) / 2).toFixed(1)} ${(Math.max(prev.y, y) + 5).toFixed(1)} ${clip.x.toFixed(1)} ${y.toFixed(1)}`;
        prev = { x: clip.x, y };
        const el = hangers.current[i];
        if (el) el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) rotate(${(s[i]?.angle ?? 0).toFixed(4)}rad)`;
      });
      d += ` Q ${((prev.x + width) / 2).toFixed(1)} ${(prev.y + 5).toFixed(1)} ${width.toFixed(1)} 8`;
      path.setAttribute("d", d);
    };

    const step = (dt: number) => {
      time += dt;
      const s = swings.current;
      s.forEach((sw, i) => {
        if (sw.hold) {
          // Held: follow the pointer firmly.
          sw.velocity = (sw.hold.angle - sw.angle) * 18;
          sw.angle += (sw.hold.angle - sw.angle) * Math.min(1, dt * 18);
          sw.pull += (sw.hold.pull - sw.pull) * Math.min(1, dt * 18);
          sw.pullVelocity = 0;
          return;
        }
        const wind = 0.5 * Math.sin(time * 0.9 + sw.phase) + 0.3 * Math.sin(time * 1.7 + sw.phase * 2);
        // Neighbors tug through the string.
        const left = s[i - 1]?.angle ?? sw.angle;
        const right = s[i + 1]?.angle ?? sw.angle;
        const accel = -14 * sw.angle - 1.5 * sw.velocity + wind + (left + right - 2 * sw.angle) * 2.2;
        sw.velocity += accel * dt;
        sw.angle = Math.max(-0.9, Math.min(0.9, sw.angle + sw.velocity * dt));
        sw.pullVelocity += (-160 * sw.pull - 12 * sw.pullVelocity) * dt;
        sw.pull += sw.pullVelocity * dt;
      });
      // A pulled card drags the string, and its neighbors dip a little with it.
      s.forEach((sw, i) => {
        const neighbor = Math.max(s[i - 1]?.pull ?? 0, s[i + 1]?.pull ?? 0);
        if (!sw.hold && neighbor > sw.pull) sw.pull += (neighbor * 0.35 - sw.pull) * Math.min(1, dt * 6);
      });
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.033, (now - last) / 1000) : 0;
      last = now;
      step(dt);
      paint();
      schedule();
    };
    const schedule = () => {
      if (!raf && visible && !document.hidden && !media.matches) raf = requestAnimationFrame(tick);
      if (media.matches) {
        swings.current.forEach((sw) => Object.assign(sw, { angle: 0, velocity: 0, pull: 0, hold: null }));
        paint();
      }
    };

    const ro = new ResizeObserver(() => {
      measure();
      paint();
    });
    ro.observe(track);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      last = 0;
      schedule();
    });
    io.observe(track);
    const wake = () => {
      last = 0;
      schedule();
    };
    document.addEventListener("visibilitychange", wake);
    media.addEventListener("change", wake);
    measure();
    paint();
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      media.removeEventListener("change", wake);
    };
  }, [peopleKey]);

  /* ------------------------------------------------------------ pointer */

  const onTrackMove = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || event.pointerType === "touch") return;
    const p = pointer.current;
    const x = event.clientX - track.getBoundingClientRect().left;
    const dt = Math.max(0.008, (event.timeStamp - p.t) / 1000);
    const vx = p.t ? (x - p.x) / dt : 0;
    p.x = x;
    p.t = event.timeStamp;
    const s = swings.current;
    // Brush past: cards near the cursor swing the way it moves.
    hangers.current.forEach((el, i) => {
      const slot = el?.parentElement;
      if (!slot || !s[i] || s[i].hold) return;
      const rect = slot.getBoundingClientRect();
      const center = rect.left + rect.width / 2 - track.getBoundingClientRect().left;
      const near = 1 - Math.min(1, Math.abs(center - x) / (rect.width * 0.75));
      if (near > 0) s[i].velocity -= Math.max(-2000, Math.min(2000, vx)) * 0.00028 * near;
    });
    // Dragging a held card.
    if (p.card >= 0 && event.buttons === 1) {
      const dx = event.clientX - p.startX;
      const dy = event.clientY - p.startY;
      if (!p.dragged && Math.hypot(dx, dy) > 6) {
        p.dragged = true;
        // Capture only once it's a drag, so clicks on the card's buttons still land.
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (p.dragged && s[p.card]) s[p.card].hold = { angle: Math.max(-0.7, Math.min(0.7, -dx / 300)), pull: Math.max(0, Math.min(48, dy * 0.6)) };
    }
  };

  const onCardDown = (index: number) => (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("a, button")) return;
    Object.assign(pointer.current, { card: index, startX: event.clientX, startY: event.clientY, dragged: false, id: event.pointerId });
  };

  const release = () => {
    const p = pointer.current;
    const sw = swings.current[p.card];
    if (sw?.hold) {
      sw.velocity = (sw.hold.angle - 0) * -2;
      sw.hold = null;
    }
    p.card = -1;
  };

  const onCardClick = (id: string) => (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a, button")) return;
    // A drag that ends on the card isn't a click.
    if (pointer.current.dragged) {
      pointer.current.dragged = false;
      return;
    }
    toggle(id);
  };

  const onShimmer = (event: PointerEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.setProperty("--foil-x", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--foil-y", `${(y * 100).toFixed(1)}%`);
    el.style.setProperty("--foil-angle", `${(90 + Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI)).toFixed(1)}deg`);
  };

  return (
    <section className={cn("@container relative w-full", className)} {...props}>
      <header className="grid items-end gap-6 px-6 @3xl:grid-cols-[1.35fr_1fr] @3xl:px-10">
        <div>
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{eyebrow}</p>
          <h2 className="mt-3 text-[clamp(1.9rem,5cqi,3.4rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-foreground">
            {title}
            <br />
            <span className="text-primary">{accentTitle}</span>
          </h2>
        </div>
        <div className="space-y-3 @3xl:pb-1">
          {description ? <p className="max-w-md text-[15px] leading-7 text-muted-foreground">{description}</p> : null}
          <p className="font-mono text-[12px] text-foreground tabular-nums">
            {count} {count === 1 ? "person" : "people"} · one team
          </p>
        </div>
      </header>

      <div
        className="relative mt-6 overflow-x-auto overscroll-x-contain select-none [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        onPointerMove={onTrackMove}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={(e) => {
          if (e.buttons === 0) release();
        }}
      >
        <div ref={trackRef} className="relative mx-auto flex w-max min-w-full justify-center gap-5 px-8 pt-2 pb-20" role="list" aria-label={`${title} ${accentTitle}`}>
          <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 w-full overflow-visible">
            <path ref={pathRef} d="M 0 8 L 10000 8" fill="none" stroke="var(--color-muted-foreground)" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {people.map((person, i) => {
            const isFlipped = flipped.has(person.id);
            const first = person.links?.[0];
            return (
              <div key={person.id} role="listitem" className="relative shrink-0 snap-center" style={{ width: CARD_WIDTH }}>
                <div
                  ref={(el) => {
                    hangers.current[i] = el;
                  }}
                  className="origin-top will-change-transform"
                  style={{ transform: "translate3d(0, 24px, 0)" }}
                >
                  {/* The clip on the string. */}
                  <span aria-hidden="true" className="absolute top-[-9px] left-1/2 z-10 h-5 w-2.5 -translate-x-1/2 rounded-[3px] border border-[#8f6a45] bg-[#c99a6b] shadow-sm after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-[#8f6a45]" />
                  <div
                    className="group relative cursor-grab touch-pan-x select-none [perspective:1200px] active:cursor-grabbing"
                    onPointerDown={onCardDown(i)}
                    onPointerMove={onShimmer}
                    onClick={onCardClick(person.id)}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <motion.div
                      className="relative [transform-style:preserve-3d]"
                      initial={false}
                      animate={{ rotateY: reduceMotion ? 0 : isFlipped ? 180 : 0 }}
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 22 }}
                    >
                      <motion.article
                        aria-label={`${person.name}, ${person.role}`}
                        aria-hidden={isFlipped || undefined}
                        inert={isFlipped}
                        initial={false}
                        animate={{ opacity: reduceMotion && isFlipped ? 0 : 1 }}
                        className="relative overflow-hidden rounded-[18px] border border-border bg-card p-3 shadow-[0_18px_30px_-18px_rgb(0_0_0/0.35),0_2px_4px_rgb(0_0_0/0.05)] [backface-visibility:hidden]"
                      >
                        <div className="flex items-center justify-between px-1 pb-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                          <span>{cardLabel}</span>
                          <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        <div className="relative aspect-[4/5] overflow-hidden rounded-[12px]">
                          {person.portrait ? (
                            // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
                            <img src={person.portrait} alt="" draggable={false} className="size-full object-cover" />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="flex size-full items-center justify-center text-5xl font-semibold tracking-tight text-white/90"
                              style={{ background: `linear-gradient(150deg, hsl(${hue(person.name)} 70% 72%), hsl(${(hue(person.name) + 50) % 360} 65% 52%))` }}
                            >
                              {initials(person.name)}
                            </div>
                          )}
                        </div>
                        <div className="px-1 pt-3">
                          <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{person.name}</h3>
                          <p className="truncate text-[13px] text-muted-foreground">{person.role}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border px-1 pt-2.5">
                          <a
                            href={first?.href ?? "#"}
                            onClick={first ? undefined : (e) => e.preventDefault()}
                            className="focus-ring rounded text-[13px] font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            View profile
                          </a>
                          <button
                            type="button"
                            aria-pressed={isFlipped}
                            aria-label={`Flip ${person.name}'s card`}
                            onClick={() => toggle(person.id)}
                            className="focus-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground text-background transition-transform hover:translate-x-0.5"
                          >
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        {/* Holographic shimmer that follows the pointer. */}
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
                          style={
                            {
                              background:
                                "linear-gradient(var(--foil-angle, 115deg), transparent 12%, rgb(255 95 210 / 0.28) 30%, rgb(80 220 255 / 0.3) 46%, rgb(255 230 90 / 0.28) 62%, rgb(150 110 255 / 0.28) 78%, transparent 92%)",
                            } as CSSProperties
                          }
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
                          style={{ background: "radial-gradient(circle at var(--foil-x, 50%) var(--foil-y, 50%), rgb(255 255 255 / 0.85), transparent 45%)" }}
                        />
                      </motion.article>

                      <motion.div
                        aria-hidden={!isFlipped || undefined}
                        inert={!isFlipped}
                        initial={false}
                        animate={{ rotateY: reduceMotion ? 0 : 180, opacity: reduceMotion && !isFlipped ? 0 : 1 }}
                        transition={{ duration: 0 }}
                        className="absolute inset-0 flex flex-col overflow-hidden rounded-[18px] border border-border bg-foreground p-4 text-background [backface-visibility:hidden]"
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.1em] text-background/70 uppercase">
                          <span>{cardLabel}</span>
                          <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        <h3 className="mt-4 text-lg leading-tight font-semibold tracking-tight">{person.name}</h3>
                        <p className="text-[13px] text-background/70">{person.role}</p>
                        {person.bio ? <p className="mt-3 text-[13px] leading-5 text-background/85">{person.bio}</p> : null}
                        {person.skills?.length ? (
                          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
                            {person.skills.map((skill) => (
                              <li key={skill} className="rounded-full border border-background/25 px-2 py-0.5 text-[11.5px]">
                                {skill}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {person.links?.length ? (
                          <ul className="mt-3 space-y-1">
                            {person.links.map((link) => (
                              <li key={link.href}>
                                <a href={link.href} className="focus-ring inline-flex items-center gap-1 rounded text-[13px] underline-offset-4 hover:underline">
                                  {link.label}
                                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => toggle(person.id)}
                          className="focus-ring mt-auto inline-flex h-8 cursor-pointer items-center gap-1.5 self-start rounded-full bg-background px-3 text-[12.5px] font-medium text-foreground"
                        >
                          <ArrowLeft className="size-3.5" aria-hidden="true" />
                          Back
                        </button>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="px-6 font-mono text-[11px] text-muted-foreground @3xl:px-10">{hint}</p>
    </section>
  );
}
