"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { animate, AnimatePresence, LayoutGroup, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { Dialog } from "radix-ui";
import { ArrowLeft, ArrowRight, ArrowUpRight, Moon, Pause, Play, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface PaneMedia {
  type: "image" | "video";
  /** Image or video URL. A video without a playable src shows its poster with a simulated progress line. */
  src: string;
  /** Still shown for videos before they play (and in the stack). */
  poster?: string;
  /** Running time shown on video panes, e.g. "0:42". */
  duration?: string;
}

export interface PaneProject {
  id: string;
  title: string;
  category: string;
  client?: string;
  year?: number | string;
  tools?: string[];
  description?: string;
  media: PaneMedia;
}

export interface PaneStackOwner {
  name: string;
  role: string;
  /** IANA time zone for the local time in the header. @default "Asia/Jakarta" */
  timeZone?: string;
  /** Short booking status next to the live dot. @default "Booking from June" */
  status?: string;
}

export interface PaneStackPortfolioProps extends Omit<ComponentProps<"section">, "onSelect"> {
  /** Projects in stack order. @default twelve sample projects with generated art */
  projects?: PaneProject[];
  /** Filter chips, in order. "All" is always first. @default the categories found in `projects` */
  categories?: string[];
  /** Replaces the built-in header (owner pill, links, booking status, local time and Dark toggle). */
  header?: ReactNode;
  /** Owner shown in the built-in header. */
  owner?: PaneStackOwner;
  /** Called when a project opens in the detail view. */
  onSelect?: (project: PaneProject) => void;
  /** Where "Start a project" goes. @default "#contact" */
  ctaHref?: string;
}

/* ------------------------------------------------------------------ sample */

const ART: [string, string, string, string][] = [
  ["#fbe3d6", "#f2a28a", "#e5644e", "#b9362f"],
  ["#d9efec", "#7cc7bd", "#2f8f87", "#16514d"],
  ["#ece4d8", "#c9b79e", "#9b8467", "#5e4c38"],
  ["#e4e1f7", "#9f94e0", "#5b4cc4", "#2b2370"],
  ["#0b1a3a", "#2563eb", "#38bdf8", "#a5f3fc"],
  ["#071a1d", "#14b8a6", "#5eead4", "#ccfbf1"],
  ["#f3ead9", "#e0cba6", "#c9774a", "#2f4a5c"],
  ["#140a26", "#7c3aed", "#ec4899", "#f9a8d4"],
  ["#eef1f4", "#cfd8e3", "#a9b8c9", "#5d6b7c"],
  ["#1d2b4f", "#3c5a8f", "#8fa9d6", "#f2c38b"],
  ["#f6d2b1", "#e48b52", "#b9502a", "#6e2a17"],
  ["#efe3d0", "#f9d9a6", "#d2b48c", "#7a6a55"],
];

/** A soft generated still: a gradient sweep with a lit sphere and its shadow. */
function sampleArt(i: number) {
  const [a, b, c, d] = ART[i % ART.length];
  const x = 380 + ((i * 97) % 240);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="s" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></radialGradient><filter id="f"><feGaussianBlur stdDeviation="24"/></filter></defs><rect width="1200" height="750" fill="url(#g)"/><ellipse cx="${x}" cy="610" rx="240" ry="34" fill="${d}" opacity=".35" filter="url(#f)"/><circle cx="${x}" cy="390" r="${150 + (i % 4) * 18}" fill="url(#s)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SAMPLE: PaneProject[] = [
  ["Coral Bloom", "3D", "Lumivo", 2026, "A soft-body coral that opens like a flower."],
  ["Glass Garden", "3D", "Tessaly", 2025, "Blown-glass plants growing in a light box."],
  ["Soft Monolith", "3D", "Halvane", 2026, "A rounded slab in brushed clay."],
  ["Orbit Room", "3D", "Orbiq", 2025, "Rings and spheres balanced in a sunlit room."],
  ["Tidal Type", "Motion", "Driftwell", 2026, "Letterforms that roll in and out like surf."],
  ["Signal Drift", "Motion", "Pylonix", 2025, "Data lines drifting through fog."],
  ["Paper Engines", "Motion", "Mosaiq", 2026, "Folded paper machines that click along."],
  ["Night Loop", "Motion", "Nimbra", 2025, "A looping drive through neon rain."],
  ["Salt Flats", "Stills", "Corvane", 2025, "Pale horizons at first light."],
  ["Quiet Harbor", "Stills", "Fernwick", 2026, "Moored boats and still water at blue hour."],
  ["Red Desert Study", "Stills", "Quorvex", 2024, "Wind-cut dunes in long shadow."],
  ["Window Light", "Stills", "Brightloom", 2026, "Afternoon light moving across a wall."],
].map(([title, category, client, year, description], i) => ({
  id: String(title).toLowerCase().replace(/\s+/g, "-"),
  title: String(title),
  category: String(category),
  client: String(client),
  year: Number(year),
  description: String(description),
  tools: category === "Stills" ? ["Medium format"] : category === "Motion" ? ["Animation", "Compositing"] : ["Modeling", "Path tracing"],
  media: category === "Motion" ? { type: "video" as const, src: "", poster: sampleArt(i), duration: `0:${String(28 + ((i * 13) % 40)).padStart(2, "0")}` } : { type: "image" as const, src: sampleArt(i) },
}));

/* ------------------------------------------------------------------ helpers */

const SPRING = { type: "spring", stiffness: 210, damping: 30 } as const;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const pad = (n: number) => String(n).padStart(2, "0");
const still = (m: PaneMedia) => (m.type === "video" ? (m.poster ?? m.src) : m.src);
const seconds = (text?: string) => {
  const [m, s] = (text ?? "0:30").split(":").map(Number);
  return (m || 0) * 60 + (s || 0) || 30;
};

const subscribeMinute = (cb: () => void) => {
  const id = window.setInterval(cb, 15000);
  return () => window.clearInterval(id);
};

function LocalTime({ timeZone }: { timeZone: string }) {
  const text = useSyncExternalStore(
    subscribeMinute,
    () => new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date()),
    () => "--:--",
  );
  return <span className="tabular-nums">{text}</span>;
}

/* ------------------------------------------------------------------ pane */

interface PaneProps {
  project: PaneProject;
  index: number;
  total: number;
  position: MotionValue<number>;
  compact: boolean;
  isFront: boolean;
  hideMedia: boolean;
  reduce: boolean;
  onActivate: () => void;
  layoutKey: string;
}

function Pane({ project, index, total, position, compact, isFront, hideMedia, reduce, onActivate, layoutKey }: PaneProps) {
  // The pane's slot animates when filtering re-indexes the stack.
  const slot = useMotionValue(index);
  useEffect(() => {
    const controls = animate(slot, index, reduce ? { duration: 0 } : SPRING);
    return () => controls.stop();
  }, [slot, index, reduce]);
  const k = useTransform(() => slot.get() - position.get());
  const x = useTransform(k, (v) => (compact ? "0%" : v >= 0 ? `${Math.min(v, 6) * 23}%` : `${v * 70}%`));
  const y = useTransform(k, (v) => (compact ? (v >= 0 ? `${Math.min(v, 5) * 9}%` : `${v * 110}%`) : v >= 0 ? `${-Math.min(v, 6) * 11}%` : `${-v * 16}%`));
  const scale = useTransform(k, (v) => (v >= 0 ? 1 - Math.min(v, 6) * (compact ? 0.07 : 0.11) : 1 + v * 0.04));
  const rotateY = useTransform(k, (v) => (compact || reduce ? 0 : -16 + Math.min(Math.max(v, 0), 3) * 2));
  const opacity = useTransform(k, (v) => (v >= 0 ? clamp(1 - Math.max(0, v - (compact ? 3 : 4.2)) * 0.8, 0, 1) : clamp(1 + v * 1.4, 0, 1)));
  const zIndex = useTransform(k, (v) => 100 - Math.round(v * 10));
  const pointerEvents = useTransform(opacity, (o) => (o < 0.1 ? "none" : "auto"));
  const shade = useTransform(k, (v) => clamp(Math.abs(v) * 0.12, 0, 0.45));

  return (
    <motion.div
      style={{ x, y, scale, rotateY, opacity, zIndex, pointerEvents, transformOrigin: compact ? "50% 0%" : "0% 100%" }}
      className={cn("absolute aspect-[16/10]", compact ? "inset-x-[5%] top-[14%]" : "top-[24%] left-[6%] w-[46%]")}
    >
      {/* Entering and leaving (filters) animate in here, so the outer z-index keeps ordering the stack. */}
      <motion.div
        className="relative size-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60, transition: { duration: duration.base, ease: ease.out } }}
        transition={{ duration: reduce ? 0 : duration.slow, ease: ease.out }}
      >
      <div aria-hidden="true" className="absolute inset-x-[10%] -bottom-5 h-8 rounded-[50%] bg-black/35 blur-xl" />
      <button
        type="button"
        tabIndex={isFront ? 0 : -1}
        aria-label={isFront ? `Open ${project.title}, ${index + 1} of ${total}` : `Show ${project.title}`}
        onClick={onActivate}
        className="focus-ring relative block size-full cursor-pointer overflow-hidden rounded-[18px] bg-black/10 text-left shadow-[0_1px_2px_rgb(0_0_0/0.1),0_24px_48px_-20px_rgb(0_0_0/0.45)]"
      >
        {hideMedia ? null : (
          <motion.div layoutId={`${layoutKey}-media-${project.id}`} transition={reduce ? { duration: 0 } : SPRING} className="absolute inset-0 overflow-hidden rounded-[18px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic */}
            <img src={still(project.media)} alt="" draggable={false} className="size-full object-cover" />
          </motion.div>
        )}
        <motion.span aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: shade }} />
        {project.media.type === "video" && project.media.duration ? (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[11px] text-white backdrop-blur">
            <Play className="size-3 fill-current" aria-hidden="true" />
            {project.media.duration}
          </span>
        ) : null}
      </button>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ main */

/**
 * A portfolio of large project panes standing in a diagonal row that recedes into depth: the active
 * pane at the front left, the rest stepping back and up to the right, smaller and turned on Y. Wheel,
 * drag, arrow keys and a scrubber move through the stack on a spring; clicking a back pane brings it
 * forward. Filter chips re-stack the panes, an Index view lays every project out in a grid, and the
 * front pane morphs into a detail view with a player, meta table and previous/next. DOM and CSS 3D
 * driven by Motion values; narrow containers get a vertical swipe deck.
 */
export function PaneStackPortfolio({
  projects = SAMPLE,
  categories,
  header,
  owner = { name: "Alibar", role: "Motion & 3D designer" },
  onSelect,
  ctaHref = "#contact",
  className,
  ...props
}: PaneStackPortfolioProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const layoutKey = useId();
  const liveId = useId();
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<"overview" | "index">("overview");
  const [filter, setFilter] = useState("All");
  const [front, setFront] = useState(0);
  const [detail, setDetail] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const position = useMotionValue(0);
  const drag = useRef({ active: false, moved: false, start: 0, startPos: 0, last: 0, lastT: 0, velocity: 0, id: -1 });
  const wheel = useRef({ acc: 0, t: 0 });

  const chips = ["All", ...(categories ?? [...new Set(projects.map((p) => p.category))])];
  const visible = filter === "All" ? projects : projects.filter((p) => p.category === filter);
  const total = visible.length;
  const current = visible[Math.min(front, total - 1)];
  const detailProject = projects.find((p) => p.id === detail) ?? null;
  const detailIndex = detailProject ? visible.findIndex((p) => p.id === detailProject.id) : -1;

  const goTo = (i: number) => {
    const target = clamp(Math.round(i), 0, Math.max(0, total - 1));
    setFront(target);
    animate(position, target, reduceMotion ? { duration: 0 } : SPRING);
    // Keyboard users follow the new front pane.
    requestAnimationFrame(() => {
      const stage = stageRef.current;
      if (stage?.contains(document.activeElement)) stage.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus({ preventScroll: true });
    });
  };

  // Keep `front` in step with the stack while it is dragged.
  useMotionValueEvent(position, "change", (v) => {
    const i = clamp(Math.round(v), 0, Math.max(0, total - 1));
    if (drag.current.active && i !== front) setFront(i);
  });

  // Container width decides between the diagonal stack and the vertical deck.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(([entry]) => setCompact((entry?.contentRect.width ?? 1000) < 560));
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // Wheel moves one pane per notch-worth of scroll, and lets the page scroll at either end.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || view !== "overview") return;
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const target = Math.round(position.get()) + Math.sign(delta);
      if (target < 0 || target > total - 1) return;
      event.preventDefault();
      const w = wheel.current;
      if (event.timeStamp - w.t > 220) w.acc = 0;
      w.t = event.timeStamp;
      w.acc += delta;
      if (Math.abs(w.acc) >= 40) {
        w.acc = 0;
        const i = clamp(Math.round(position.get()) + Math.sign(delta), 0, total - 1);
        setFront(i);
        animate(position, i, reduceMotion ? { duration: 0 } : SPRING);
      }
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [view, total, position, reduceMotion]);

  const changeFilter = (next: string) => {
    setFilter(next);
    setFront(0);
    animate(position, 0, reduceMotion ? { duration: 0 } : SPRING);
  };

  const open = (project: PaneProject) => {
    setDetail(project.id);
    onSelect?.(project);
  };

  const step = () => (stageRef.current?.clientWidth ?? 800) * (compact ? 0.5 : 0.22);

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    Object.assign(drag.current, { active: false, moved: false, start: compact ? event.clientY : event.clientX, startPos: position.get(), last: compact ? event.clientY : event.clientX, lastT: event.timeStamp, velocity: 0, id: event.pointerId });
    drag.current.active = true;
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const at = compact ? event.clientY : event.clientX;
    if (!d.moved && Math.abs(at - d.start) > 6) {
      d.moved = true;
      // Capture only once it is a drag, so clicks on panes still land.
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!d.moved) return;
    const dt = Math.max(1, event.timeStamp - d.lastT);
    d.velocity = (at - d.last) / dt;
    d.last = at;
    d.lastT = event.timeStamp;
    position.set(clamp(d.startPos - (at - d.start) / step(), -0.4, total - 0.6));
  };
  const onUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved) goTo(position.get() - (d.velocity * 220) / step());
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (event.key in keys) {
      event.preventDefault();
      goTo(front + keys[event.key]);
    } else if (event.key === "Home") goTo(0);
    else if (event.key === "End") goTo(total - 1);
  };

  const theme = dark
    ? { "--ps-bg": "#0f0f11", "--ps-fg": "#f4f4f5", "--ps-muted": "#a1a1aa", "--ps-surface": "#1b1b1f", "--ps-line": "rgb(255 255 255 / 0.12)" }
    : { "--ps-bg": "#f5f4f0", "--ps-fg": "#111113", "--ps-muted": "#5f5f66", "--ps-surface": "#ffffff", "--ps-line": "rgb(0 0 0 / 0.1)" };

  return (
    <section
      ref={rootRef}
      aria-label={`${owner.name}: selected work`}
      className={cn("@container relative isolate w-full overflow-clip rounded-[28px] bg-[var(--ps-bg)] text-[var(--ps-fg)] transition-colors duration-500", className)}
      style={theme as CSSProperties}
      {...props}
    >
      {/* Header slot. */}
      <div className="relative z-[200] flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pt-5 text-[13px] @3xl:px-7 @3xl:pt-6">
        {header ?? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--ps-surface)] py-1 pr-3 pl-1 shadow-xs ring-1 ring-[var(--ps-line)]">
              <span className="flex size-6 items-center justify-center rounded-full bg-[var(--ps-fg)] text-[11px] font-semibold text-[var(--ps-bg)]">{owner.name[0]}</span>
              <span className="font-medium">{owner.name}</span>
              <span className="text-[var(--ps-muted)]">{owner.role}</span>
            </span>
            <nav aria-label="Site" className="flex items-center gap-4">
              <a href="#studio" className="focus-ring rounded underline-offset-4 hover:underline">
                Studio
              </a>
              <a href="#contact" className="focus-ring rounded underline-offset-4 hover:underline">
                Contact
              </a>
            </nav>
            <span className="ml-auto inline-flex items-center gap-2 text-[var(--ps-muted)]">
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60 motion-reduce:hidden" />
                <span className="relative size-2 rounded-full bg-emerald-500" />
              </span>
              {owner.status ?? "Booking from June"}
            </span>
            <span className="hidden font-mono text-[12px] text-[var(--ps-muted)] @md:inline">
              {(owner.timeZone ?? "Asia/Jakarta").split("/").pop()?.replace(/_/g, " ")} <LocalTime timeZone={owner.timeZone ?? "Asia/Jakarta"} />
            </span>
            <button
              type="button"
              aria-pressed={dark}
              onClick={() => setDark((d) => !d)}
              className="focus-ring inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--ps-surface)] px-3 ring-1 ring-[var(--ps-line)]"
            >
              {dark ? <Sun className="size-3.5" aria-hidden="true" /> : <Moon className="size-3.5" aria-hidden="true" />}
              Dark
            </button>
          </>
        )}
      </div>

      <LayoutGroup id={layoutKey}>
        <div className={cn("relative", compact ? "h-[600px]" : "h-[max(520px,56.25cqw)]")}>
          {/* Filter chips. */}
          <div
            role="group"
            aria-label="Filter projects"
            className={cn("absolute z-[150] flex gap-1.5", compact || view === "index" ? "inset-x-5 top-3 overflow-x-auto @3xl:inset-x-7" : "top-6 right-7 flex-col items-end")}
          >
            {chips.map((chip) => {
              const count = chip === "All" ? projects.length : projects.filter((p) => p.category === chip).length;
              return (
                <button
                  key={chip}
                  type="button"
                  aria-pressed={filter === chip}
                  onClick={() => changeFilter(chip)}
                  className={cn(
                    "focus-ring inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 text-[13px] ring-1 transition-colors",
                    filter === chip ? "bg-[var(--ps-fg)] text-[var(--ps-bg)] ring-transparent" : "bg-[var(--ps-surface)] ring-[var(--ps-line)] hover:bg-[var(--ps-bg)]",
                  )}
                >
                  {chip}
                  <span className="font-mono text-[11px] opacity-60 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            {view === "overview" ? (
              <motion.div
                key="overview"
                ref={stageRef}
                role="region"
                aria-roledescription="carousel"
                aria-label="Projects"
                tabIndex={-1}
                onKeyDown={onKey}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onDragStart={(e) => e.preventDefault()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: duration.quick } }}
                className={cn("absolute inset-0 touch-pan-y overflow-clip outline-none [perspective:1600px] select-none", compact && "touch-pan-x")}
              >
                <AnimatePresence>
                  {visible.map((project, i) => (
                      <Pane
                          key={project.id}
                          project={project}
                          index={i}
                          total={total}
                          position={position}
                          compact={compact}
                          isFront={i === front}
                          hideMedia={detail === project.id}
                          reduce={reduceMotion}
                          layoutKey={layoutKey}
                          onActivate={() => {
                            if (drag.current.moved) return;
                            if (i === front) open(project);
                            else goTo(i);
                          }}
                        />
                  ))}
                </AnimatePresence>

                {/* Caption of the front pane. */}
                <div className={cn("pointer-events-none absolute z-[150]", compact ? "inset-x-5 bottom-20" : "bottom-[11%] left-[6%]")}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {current ? (
                      <motion.p
                        key={current.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: duration.base, ease: ease.out }}
                        className="flex items-baseline gap-3"
                      >
                        <span className="font-mono text-[13px] text-[var(--ps-muted)] tabular-nums">{pad(front + 1)}</span>
                        <span className="text-[clamp(1.25rem,3cqi,2rem)] font-semibold tracking-tight">{current.title}</span>
                        <span className="text-[13px] text-[var(--ps-muted)]">{current.category}</span>
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
                <p id={liveId} className="sr-only" aria-live="polite">
                  {current ? `${front + 1} of ${total}: ${current.title}, ${current.category}` : ""}
                </p>
              </motion.div>
            ) : (
              <motion.ul
                key="index"
                aria-label="All projects"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: duration.quick } }}
                className={cn("absolute inset-0 grid content-start gap-4 overflow-y-auto px-5 pt-16 pb-24 @3xl:grid-cols-4 @3xl:px-7", "grid-cols-2")}
              >
                {visible.map((project, i) => (
                  <li key={project.id}>
                    <button type="button" onClick={() => open(project)} className="focus-ring group block w-full cursor-pointer rounded-[14px] text-left">
                      <span className="relative block aspect-[16/10] overflow-hidden rounded-[14px] bg-black/10">
                        {detail === project.id ? null : (
                          <motion.span layoutId={`${layoutKey}-media-${project.id}`} transition={reduceMotion ? { duration: 0 } : SPRING} className="absolute inset-0 block overflow-hidden rounded-[14px]">
                            {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic */}
                            <img src={still(project.media)} alt="" draggable={false} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.06] motion-reduce:transition-none" />
                          </motion.span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-3 text-[12px] text-white transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0">
                          {project.description}
                        </span>
                      </span>
                      <span className="mt-2 flex items-baseline gap-2 text-[13px]">
                        <span className="font-mono text-[var(--ps-muted)] tabular-nums">{pad(i + 1)}</span>
                        <span className="font-medium">{project.title}</span>
                        <span className="ml-auto text-[var(--ps-muted)]">{project.category}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          {/* Bottom bar: view toggle and scrubber. */}
          <div className="absolute inset-x-5 bottom-5 z-[150] flex items-center gap-4 @3xl:inset-x-7">
            <div role="group" aria-label="View" className="inline-flex rounded-full bg-[var(--ps-surface)] p-1 ring-1 ring-[var(--ps-line)]">
              {(["overview", "index"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={cn("focus-ring h-7 cursor-pointer rounded-full px-3 text-[12.5px] capitalize transition-colors", view === v ? "bg-[var(--ps-fg)] text-[var(--ps-bg)]" : "text-[var(--ps-muted)] hover:text-[var(--ps-fg)]")}
                >
                  {v}
                </button>
              ))}
            </div>
            {view === "overview" && total > 1 ? <Scrubber position={position} total={total} front={front} title={current?.title ?? ""} onChange={goTo} /> : null}
          </div>
        </div>

        <Detail
          project={detailProject}
          index={detailIndex}
          total={total}
          layoutKey={layoutKey}
          reduce={reduceMotion}
          dark={dark}
          theme={theme}
          ctaHref={ctaHref}
          onClose={() => setDetail(null)}
          onStep={(dir) => {
            const next = visible[(detailIndex + dir + total) % total];
            if (!next) return;
            setDetail(next.id);
            goTo((detailIndex + dir + total) % total);
            onSelect?.(next);
          }}
          returnFocus={() => stageRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus({ preventScroll: true })}
        />
      </LayoutGroup>
    </section>
  );
}

/* ------------------------------------------------------------------ scrubber */

function Scrubber({ position, total, front, title, onChange }: { position: MotionValue<number>; total: number; front: number; title: string; onChange: (i: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const left = useTransform(position, (p) => `${clamp(p / Math.max(1, total - 1), 0, 1) * 100}%`);
  const pick = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    onChange(((clientX - rect.left) / rect.width) * (total - 1));
  };
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 font-mono text-[12px] tabular-nums">
      <span>{pad(front + 1)}</span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Project"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={front + 1}
        aria-valuetext={`${front + 1} of ${total}: ${title}`}
        onKeyDown={(e) => {
          const map: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
          if (e.key in map) {
            e.preventDefault();
            onChange(front + map[e.key]);
          }
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) pick(e.clientX);
        }}
        className="focus-ring relative h-6 flex-1 cursor-pointer touch-none rounded"
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-[var(--ps-line)]" />
        {Array.from({ length: total }, (_, i) => (
          <span key={i} aria-hidden="true" className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-[var(--ps-muted)] opacity-50" style={{ left: `${(i / Math.max(1, total - 1)) * 100}%` }} />
        ))}
        <motion.span aria-hidden="true" className="absolute top-1/2 h-3 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ps-fg)]" style={{ left }} />
      </div>
      <span className="text-[var(--ps-muted)]">{pad(total)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ detail */

interface DetailProps {
  project: PaneProject | null;
  index: number;
  total: number;
  layoutKey: string;
  reduce: boolean;
  dark: boolean;
  theme: Record<string, string>;
  ctaHref: string;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
  returnFocus: () => void;
}

function Detail({ project, index, total, layoutKey, reduce, theme, ctaHref, onClose, onStep, returnFocus }: DetailProps) {
  return (
    <Dialog.Root open={project !== null} onOpenChange={(next) => !next && onClose()}>
      <AnimatePresence>
        {project ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: duration.base }} />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" style={theme as CSSProperties}>
              <Dialog.Content
                asChild
                forceMount
                aria-describedby={undefined}
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  requestAnimationFrame(returnFocus);
                }}
              >
                <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  transition={{ duration: duration.base, ease: ease.out }}
                  className="pointer-events-auto relative grid max-h-[100dvh] w-full max-w-6xl gap-6 overflow-y-auto rounded-t-[28px] bg-[var(--ps-bg)] p-4 text-[var(--ps-fg)] shadow-2xl outline-none sm:max-h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:p-6 md:grid-cols-[1.6fr_1fr]"
                >
                  <Player project={project} layoutKey={layoutKey} reduce={reduce} />
                  <div className="flex flex-col gap-5 pt-1 pr-1 md:pt-10">
                    <p className="font-mono text-[12px] text-[var(--ps-muted)] tabular-nums">
                      {pad(index + 1)} / {pad(total)} · {project.category}
                    </p>
                    <Dialog.Title className="text-[clamp(2rem,4vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.03em]">{project.title}</Dialog.Title>
                    {project.description ? <p className="text-[15px] leading-7 text-[var(--ps-muted)]">{project.description}</p> : null}
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-[var(--ps-line)] py-4 text-[13.5px]">
                      {project.client ? (
                        <>
                          <dt className="text-[var(--ps-muted)]">Client</dt>
                          <dd>{project.client}</dd>
                        </>
                      ) : null}
                      {project.year ? (
                        <>
                          <dt className="text-[var(--ps-muted)]">Year</dt>
                          <dd className="tabular-nums">{project.year}</dd>
                        </>
                      ) : null}
                      {project.tools?.length ? (
                        <>
                          <dt className="text-[var(--ps-muted)]">Tools</dt>
                          <dd>{project.tools.join(", ")}</dd>
                        </>
                      ) : null}
                    </dl>
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <button type="button" aria-label="Previous project" onClick={() => onStep(-1)} className="focus-ring inline-flex size-10 cursor-pointer items-center justify-center rounded-full ring-1 ring-[var(--ps-line)] hover:bg-[var(--ps-surface)]">
                        <ArrowLeft className="size-4" aria-hidden="true" />
                      </button>
                      <button type="button" aria-label="Next project" onClick={() => onStep(1)} className="focus-ring inline-flex size-10 cursor-pointer items-center justify-center rounded-full ring-1 ring-[var(--ps-line)] hover:bg-[var(--ps-surface)]">
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </button>
                      <a href={ctaHref} className="focus-ring ml-auto inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--ps-fg)] px-4 text-[13.5px] font-medium text-[var(--ps-bg)]">
                        Start a project
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                  <Dialog.Close aria-label="Close" className="focus-ring absolute top-4 right-4 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-[var(--ps-surface)] ring-1 ring-[var(--ps-line)]">
                    <X className="size-4" aria-hidden="true" />
                  </Dialog.Close>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Player({ project, layoutKey, reduce }: { project: PaneProject; layoutKey: string; reduce: boolean }) {
  const { media } = project;
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [broken, setBroken] = useState(!media.src);
  const isVideo = media.type === "video";
  const simulated = isVideo && broken;

  // Without a playable file, play runs a simulated progress line over the poster.
  useEffect(() => {
    if (!simulated || !playing) return;
    let raf = 0;
    let start = 0;
    const total = seconds(media.duration) * 1000;
    const tick = (now: number) => {
      if (!start) start = now - (Number(barRef.current?.dataset.at) || 0) * total;
      const at = Math.min(1, (now - start) / total);
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${at})`;
        barRef.current.dataset.at = String(at);
      }
      if (at < 1) raf = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [simulated, playing, media.duration]);

  const toggle = () => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (!simulated && video) {
      if (video.paused) void video.play().catch(() => setBroken(true));
      else video.pause();
    }
    setPlaying((p) => !p);
  };

  return (
    <motion.div layoutId={`${layoutKey}-media-${project.id}`} transition={reduce ? { duration: 0 } : SPRING} className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-black">
      {isVideo && !broken ? (
        <video
          ref={videoRef}
          src={media.src}
          poster={media.poster}
          playsInline
          onError={() => setBroken(true)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (barRef.current && v.duration) barRef.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
          }}
          onEnded={() => setPlaying(false)}
          className="size-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
        <img
          src={still(media)}
          alt={project.title}
          className={cn("size-full object-cover transition-transform duration-[6000ms] ease-linear motion-reduce:transition-none", simulated && playing && "scale-110")}
        />
      )}
      {isVideo ? (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <button type="button" onClick={toggle} aria-label={playing ? `Pause ${project.title}` : `Play ${project.title}`} className="focus-ring inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium text-black">
            {playing ? <Pause className="size-4 fill-current" aria-hidden="true" /> : <Play className="size-4 fill-current" aria-hidden="true" />}
            {playing ? "Pause" : "Play"}
            {media.duration ? <span className="font-mono text-[12px] opacity-60">{media.duration}</span> : null}
          </button>
          <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-white/30" aria-hidden="true">
            <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-white" />
          </span>
        </div>
      ) : null}
    </motion.div>
  );
}
