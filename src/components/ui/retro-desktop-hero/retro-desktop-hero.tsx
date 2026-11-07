"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Moon, Pause, Play, SkipBack, SkipForward, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { PIXEL_ICONS, pixelAvatar, type PixelIconName } from "@/lib/pixel-art/icons";
import { PixelArt } from "@/lib/pixel-art/pixel-art";
import { CrtTerminal } from "@/components/ui/crt-terminal/crt-terminal";
import { PixelLandscape } from "@/components/ui/pixel-landscape/pixel-landscape";

export interface DesktopOwner {
  name: string;
  role: string;
  location: string;
  bio: string;
  /** Avatar image. Without it, a pixel bust is drawn. */
  avatar?: string;
  email: string;
  /** Shows the "Available for work" chip with a pulsing dot. @default true */
  available?: boolean;
  /** Where "Book a call" goes. @default mailto: the email */
  bookingHref?: string;
}

export interface DesktopWindowConfig {
  /** Stable id; also the key for the saved icon position. */
  id: string;
  /** Icon label on the desktop and in the taskbar. */
  label: string;
  /** Window title, e.g. "projects.dir". @default label */
  title?: string;
  /** Pixel icon. */
  icon: PixelIconName;
  /** Window content. Without it, the built-in content for the icon is used (projects, resume, images, music, terminal, trash). */
  render?: () => ReactNode;
  /** Window size in px on wide screens. */
  width?: number;
  height?: number;
}

export interface RetroDesktopHeroProps extends Omit<ComponentProps<"section">, "children"> {
  /** The person the desktop belongs to; fills the hello window. */
  owner?: DesktopOwner;
  /** Desktop icons and the windows they open, in order. @default projects, resume, photos, music, terminal and trash */
  windows?: DesktopWindowConfig[];
  /** Wallpaper. @default a Pixel Landscape */
  background?: ReactNode;
  /** localStorage key for icon positions; pass null to not remember them. @default "retro-desktop" */
  persistKey?: string | null;
}

/* ------------------------------------------------------------------ defaults */

const OWNER: DesktopOwner = {
  name: "Alibar",
  role: "Designer & developer",
  location: "Jakarta, ID",
  bio: "I make interfaces that feel physical: springy, tactile and a little playful.",
  email: "alibar@example.com",
  available: true,
};

const WINDOWS: DesktopWindowConfig[] = [
  { id: "projects", label: "Projects", title: "projects.dir", icon: "folder", width: 460, height: 340 },
  { id: "resume", label: "Resume", title: "resume.txt", icon: "document", width: 420, height: 400 },
  { id: "photos", label: "Photos", title: "photos.img", icon: "image", width: 440, height: 340 },
  { id: "music", label: "Music", title: "music.app", icon: "music", width: 330, height: 220 },
  { id: "terminal", label: "Terminal", title: "terminal", icon: "terminal", width: 520, height: 330 },
  { id: "trash", label: "Trash", title: "trash", icon: "trash", width: 320, height: 210 },
];

const CELL = { w: 88, h: 92 };
const TASKBAR = 48;
const PIXEL_FONT = "[font-family:var(--font-geist-pixel),ui-monospace,monospace]";
const HELLO = "__hello";

/* ------------------------------------------------------------------ positions store */

type Positions = Record<string, { col: number; row: number }>;
const memory = new Map<string, Positions>();
const listeners = new Set<() => void>();

function readPositions(key: string, persist: boolean): Positions {
  const hit = memory.get(key);
  if (hit) return hit;
  let value: Positions = {};
  if (persist) {
    try {
      const raw = window.localStorage.getItem(key);
      value = raw ? (JSON.parse(raw) as Positions) : {};
    } catch {
      value = {};
    }
  }
  memory.set(key, value);
  return value;
}

function writePositions(key: string, value: Positions, persist: boolean) {
  memory.set(key, value);
  if (persist) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or blocked storage: positions just aren't remembered.
    }
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/* ------------------------------------------------------------------ built-in content */

function ProjectsContent({ onOpen }: { onOpen?: (title: string) => void }) {
  const items: [string, string, string][] = [
    ["Coral Bloom", "#f2a28a", "#e5644e"],
    ["Glass Garden", "#7cc7bd", "#2f8f87"],
    ["Tidal Type", "#38bdf8", "#2563eb"],
    ["Night Loop", "#ec4899", "#7c3aed"],
    ["Salt Flats", "#cfd8e3", "#8a9bb0"],
    ["Paper Engines", "#e0cba6", "#c9774a"],
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 p-3 @md/window:grid-cols-3">
      {items.map(([title, a, b]) => (
        <li key={title}>
          <button type="button" onClick={() => onOpen?.(title)} className="focus-ring group block w-full cursor-pointer text-left">
            <span className="block aspect-[4/3] border-2 border-[var(--rd-ink)] transition-transform group-hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
            <span className={cn(PIXEL_FONT, "mt-1 block truncate text-[12px]")}>{title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ResumeContent({ owner }: { owner: DesktopOwner }) {
  return (
    <article className="space-y-4 p-4 text-[13px] leading-6">
      <header>
        <h3 className={cn(PIXEL_FONT, "text-lg")}>{owner.name}</h3>
        <p className="text-[var(--rd-muted)]">
          {owner.role} · {owner.location}
        </p>
      </header>
      <section>
        <h4 className={cn(PIXEL_FONT, "text-[13px] tracking-wide uppercase")}>Experience</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>2024–now · Lead designer at a small product studio. Interfaces, motion and prototypes.</li>
          <li>2021–2024 · Frontend engineer. Design systems, animation and accessibility.</li>
          <li>2019–2021 · Freelance. Brand sites, launch pages and too many side projects.</li>
        </ul>
      </section>
      <section>
        <h4 className={cn(PIXEL_FONT, "text-[13px] tracking-wide uppercase")}>Skills</h4>
        <p className="mt-1">Interaction design, React, motion, WebGL, prototyping, writing.</p>
      </section>
      <section>
        <h4 className={cn(PIXEL_FONT, "text-[13px] tracking-wide uppercase")}>Education</h4>
        <p className="mt-1">B.Des, Visual Communication.</p>
      </section>
    </article>
  );
}

/** A small dithered pixel landscape drawn as SVG rects. */
function PhotoContent() {
  const w = 48;
  const h = 30;
  const rects: ReactNode[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ridge = 17 + Math.round(Math.sin(x * 0.22) * 3 + Math.sin(x * 0.53 + 1) * 1.5);
      const near = 22 + Math.round(Math.sin(x * 0.17 + 2) * 2);
      const sun = Math.hypot(x - 33, y - 9) < 4.2;
      const t = ((x & 3) * 4 + (y & 3)) / 16;
      const color = y >= near ? (y > 26 ? "#2f6248" : "#3f7d5a") : y >= ridge ? "#5f9c6a" : sun ? "#ffe6a3" : y / ridge > 0.5 + t * 0.4 ? "#bfe3ff" : "#7fbcf2";
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={color} />);
    }
  }
  return (
    <figure className="flex h-full flex-col gap-2 p-3">
      <svg viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" role="img" aria-label="A pixel-art valley with green hills under a morning sun" className="w-full flex-1 border-2 border-[var(--rd-ink)] bg-[#7fbcf2]">
        {rects}
      </svg>
      <figcaption className={cn(PIXEL_FONT, "text-[12px] text-[var(--rd-muted)]")}>valley_morning.png · 48×30</figcaption>
    </figure>
  );
}

function MusicContent() {
  const tracks = [
    ["Soft Machines", "Wren Halloway", 154],
    ["Night Ferry", "Sefa Morrow", 201],
    ["Low Tide", "Mara Quell", 178],
  ] as const;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);
  const at = useRef(0);
  const [title, artist, length] = tracks[index];

  // Fake progress, written straight to the bar.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      at.current = Math.min(1, at.current + dt / length);
      if (barRef.current) barRef.current.style.transform = `scaleX(${at.current})`;
      if (at.current < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, length]);

  const skip = (dir: 1 | -1) => {
    at.current = 0;
    if (barRef.current) barRef.current.style.transform = "scaleX(0)";
    setIndex((i) => (i + dir + tracks.length) % tracks.length);
  };

  return (
    <div className="flex h-full items-center gap-4 p-4">
      <PixelArt art={PIXEL_ICONS.music} className="size-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={cn(PIXEL_FONT, "truncate text-[15px]")}>{title}</p>
        <p className="truncate text-[12px] text-[var(--rd-muted)]">{artist}</p>
        <span className="mt-3 block h-2 overflow-hidden border-2 border-[var(--rd-ink)] bg-[var(--rd-bg)]" aria-hidden="true">
          <span ref={barRef} className="block h-full origin-left scale-x-0 bg-[var(--rd-accent)]" />
        </span>
        <div className="mt-3 flex gap-2">
          <RetroButton aria-label="Previous track" onClick={() => skip(-1)}>
            <SkipBack className="size-3.5" aria-hidden="true" />
          </RetroButton>
          <RetroButton aria-label={playing ? "Pause" : "Play"} aria-pressed={playing} onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="size-3.5" aria-hidden="true" /> : <Play className="size-3.5" aria-hidden="true" />}
          </RetroButton>
          <RetroButton aria-label="Next track" onClick={() => skip(1)}>
            <SkipForward className="size-3.5" aria-hidden="true" />
          </RetroButton>
        </div>
      </div>
    </div>
  );
}

function TrashContent() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
      <PixelArt art={PIXEL_ICONS.trash} className="size-12" />
      <p className={cn(PIXEL_FONT, "text-[14px]")}>Trash is empty.</p>
      <p className="text-[12.5px] text-[var(--rd-muted)]">Even the bad ideas got recycled into good ones.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ chrome pieces */

function RetroButton({ className, children, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "focus-ring inline-flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1.5 border-2 border-[var(--rd-ink)] bg-[var(--rd-surface)] px-2 text-[12.5px] shadow-[inset_-2px_-2px_0_var(--rd-shade),inset_2px_2px_0_var(--rd-light)] active:shadow-[inset_2px_2px_0_var(--rd-shade)] aria-pressed:shadow-[inset_2px_2px_0_var(--rd-shade)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const subscribeClock = (cb: () => void) => {
  const id = window.setInterval(cb, 15000);
  return () => window.clearInterval(id);
};

function Clock() {
  const text = useSyncExternalStore(
    subscribeClock,
    () => new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
    () => "--:--",
  );
  return <span className={cn(PIXEL_FONT, "tabular-nums")}>{text}</span>;
}

/* ------------------------------------------------------------------ windows */

interface WinState {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Where it opened from, for the scale-in, relative to the window's own box. */
  from: { x: number; y: number };
  /** Where it shrinks to when minimized (its taskbar button), relative to its own box. */
  to: { x: number; y: number };
}

/**
 * A portfolio hero that is a tiny retro desktop: pixel-art icons you can select, open and drag
 * (snapping to a grid, positions remembered), windows you can drag, focus, minimize to the taskbar,
 * maximize and close, a hello window about the owner, and a taskbar with a profile button, one
 * button per window, a clock and a theme toggle. Narrow containers get an icon grid and full-screen
 * window sheets. Windows are labelled dialogs; Escape closes the focused one.
 */
export function RetroDesktopHero({ owner = OWNER, windows = WINDOWS, background, persistKey = "retro-desktop", className, ...props }: RetroDesktopHeroProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const deskRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef(new Map<string, HTMLButtonElement>());
  const taskRefs = useRef(new Map<string, HTMLButtonElement>());
  const winRefs = useRef(new Map<string, HTMLDivElement>());
  const opener = useRef(new Map<string, HTMLElement>());
  const [size, setSize] = useState({ w: 960, h: 600 });
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [focusIcon, setFocusIcon] = useState(windows[0]?.id ?? "");
  const [open, setOpen] = useState<WinState[]>(() => [{ id: HELLO, x: 0, y: 0, w: 380, h: 372, z: 1, minimized: false, maximized: false, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }]);
  const [copied, setCopied] = useState(false);
  const drag = useRef<{ kind: "icon" | "window"; id: string; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const compact = size.w < 640;
  const storeKey = persistKey ?? `retro-desktop:${uid}`;
  const stored = useSyncExternalStore(subscribe, () => readPositions(storeKey, persistKey !== null), () => null);

  useEffect(() => {
    const desk = deskRef.current;
    if (!desk) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry?.contentRect;
      if (r) setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(desk);
    return () => ro.disconnect();
  }, []);

  const configs = new Map(windows.map((w) => [w.id, w]));
  const rows = Math.max(1, Math.floor((size.h - 16) / CELL.h));
  const cols = Math.max(1, Math.floor((size.w - 16) / CELL.w));
  // Icons fill the first columns top to bottom; the trash sits in the far corner.
  const defaultCell = (i: number) => (windows[i]?.icon === "trash" ? { col: cols - 1, row: rows - 1 } : { col: Math.floor(i / rows), row: i % rows });
  const cellOf = (id: string, i: number) => {
    const saved = stored?.[id];
    const cell = saved ?? defaultCell(i);
    return { col: Math.min(cols - 1, Math.max(0, cell.col)), row: Math.min(rows - 1, Math.max(0, cell.row)) };
  };

  // Hello window lands to the right of center the first time the desk is measured.
  const helloPlaced = open.find((w) => w.id === HELLO);
  const helloBox = helloPlaced && helloPlaced.x === 0 && helloPlaced.y === 0 ? { x: Math.max(CELL.w + 24, size.w * 0.55 - 190), y: Math.max(16, size.h * 0.5 - 196) } : null;

  const top = () => Math.max(0, ...open.map((w) => w.z)) + 1;

  const openWindow = (id: string, from?: HTMLElement | null) => {
    const existing = open.find((w) => w.id === id);
    if (existing) {
      setOpen((list) => list.map((w) => (w.id === id ? { ...w, minimized: false, z: top() } : w)));
      requestAnimationFrame(() => winRefs.current.get(id)?.focus());
      return;
    }
    const cfg = configs.get(id);
    const w = Math.min(cfg?.width ?? 420, size.w - 24);
    const h = Math.min(cfg?.height ?? 320, size.h - 24);
    const n = open.length;
    const x = Math.min(size.w - w - 12, Math.max(12, size.w * 0.3 + n * 26));
    const y = Math.min(size.h - h - 12, Math.max(12, 40 + n * 22));
    const desk = deskRef.current?.getBoundingClientRect();
    const src = from?.getBoundingClientRect();
    const origin = desk && src ? { x: src.left - desk.left + src.width / 2 - (x + w / 2), y: src.top - desk.top + src.height / 2 - (y + h / 2) } : { x: 0, y: 0 };
    if (from) opener.current.set(id, from);
    setOpen((list) => [...list, { id, x, y, w, h, z: top(), minimized: false, maximized: false, from: origin, to: { x: 0, y: size.h } }]);
    requestAnimationFrame(() => winRefs.current.get(id)?.focus());
  };

  const closeWindow = (id: string) => {
    setOpen((list) => list.filter((w) => w.id !== id));
    const back = opener.current.get(id) ?? (id === HELLO ? taskRefs.current.get(HELLO) : iconRefs.current.get(id));
    requestAnimationFrame(() => back?.focus());
  };

  const patch = (id: string, change: Partial<WinState>) => setOpen((list) => list.map((w) => (w.id === id ? { ...w, ...change } : w)));

  /** Shrinks a window toward its taskbar button. */
  const minimize = (id: string) => {
    const win = winRefs.current.get(id)?.getBoundingClientRect();
    const task = taskRefs.current.get(id)?.getBoundingClientRect();
    const to = win && task ? { x: task.left + task.width / 2 - (win.left + win.width / 2), y: task.top - (win.top + win.height / 2) } : { x: 0, y: size.h };
    patch(id, { minimized: true, to });
  };
  const focusWindow = (id: string) => {
    const w = open.find((o) => o.id === id);
    if (w && w.z !== Math.max(...open.map((o) => o.z))) patch(id, { z: top() });
  };
  const activeId = [...open].filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0]?.id;

  /* ---------------------------------------------------------- dragging */

  const startDrag = (kind: "icon" | "window", id: string, x0: number, y0: number) => (event: PointerEvent<HTMLElement>) => {
    if (compact || event.button !== 0) return;
    if (kind === "window" && (event.target as HTMLElement).closest("button")) return;
    drag.current = { kind, id, startX: event.clientX, startY: event.clientY, originX: x0, originY: y0, moved: false };
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > 4) {
      d.moved = true;
      // Capture once it is a drag, so double clicks and buttons still work.
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!d.moved) return;
    const el = d.kind === "icon" ? iconRefs.current.get(d.id) : winRefs.current.get(d.id);
    if (el) el.style.translate = `${dx}px ${dy}px`;
  };

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    suppressClick.current = true;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    const el = d.kind === "icon" ? iconRefs.current.get(d.id) : winRefs.current.get(d.id);
    if (el) el.style.translate = "";
    if (d.kind === "icon") {
      // Snap to the nearest free cell.
      let col = Math.round((d.originX + dx) / CELL.w);
      let row = Math.round((d.originY + dy) / CELL.h);
      col = Math.min(cols - 1, Math.max(0, col));
      row = Math.min(rows - 1, Math.max(0, row));
      const taken = new Set(
        windows.flatMap((w, i) => {
          if (w.id === d.id) return [];
          const c = cellOf(w.id, i);
          return [`${c.col}:${c.row}`];
        }),
      );
      // Dropped on another icon: it slides back.
      if (taken.has(`${col}:${row}`)) return;
      const next: Positions = {};
      windows.forEach((w, i) => {
        next[w.id] = w.id === d.id ? { col, row } : cellOf(w.id, i);
      });
      writePositions(storeKey, next, persistKey !== null);
    } else {
      const w = open.find((o) => o.id === d.id);
      if (w) patch(d.id, { x: Math.min(size.w - 60, Math.max(-w.w + 80, d.originX + dx)), y: Math.min(size.h - 30, Math.max(0, d.originY + dy)) });
    }
  };

  /* ---------------------------------------------------------- icons keyboard */

  const onIconKey = (id: string) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = windows.findIndex((w) => w.id === id);
    const here = cellOf(id, index);
    const dirs: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    const dir = dirs[event.key];
    if (dir) {
      event.preventDefault();
      // Nearest icon in that direction.
      let best: string | null = null;
      let bestScore = Infinity;
      windows.forEach((w, i) => {
        if (w.id === id) return;
        const c = compact ? { col: i % 3, row: Math.floor(i / 3) } : cellOf(w.id, i);
        const h = compact ? { col: index % 3, row: Math.floor(index / 3) } : here;
        const dc = c.col - h.col;
        const dr = c.row - h.row;
        if (dc * dir[0] + dr * dir[1] <= 0) return;
        const score = Math.abs(dc * dir[0] + dr * dir[1]) + 2 * Math.abs(dc * dir[1] + dr * dir[0]);
        if (score < bestScore) {
          bestScore = score;
          best = w.id;
        }
      });
      if (best) {
        setFocusIcon(best);
        setSelected(best);
        iconRefs.current.get(best)?.focus();
      }
    } else if (event.key === " ") {
      event.preventDefault();
      setSelected(id);
    }
  };

  /* ---------------------------------------------------------- render */

  const theme = (dark
    ? { "--rd-bg": "#16181f", "--rd-surface": "#23262f", "--rd-ink": "#0b0c10", "--rd-text": "#eceef4", "--rd-muted": "#a3a8b8", "--rd-light": "#3a3e4b", "--rd-shade": "#08090c", "--rd-accent": "#6d8dff", "--rd-title": "#2a3a8f" }
    : { "--rd-bg": "#efece4", "--rd-surface": "#f8f6f0", "--rd-ink": "#1d2130", "--rd-text": "#1d2130", "--rd-muted": "#5d6272", "--rd-light": "#ffffff", "--rd-shade": "#b9b3a5", "--rd-accent": "#2563eb", "--rd-title": "#2563eb" }) as CSSProperties;

  const contentFor = (id: string) => {
    if (id === HELLO) return null;
    const cfg = configs.get(id);
    if (cfg?.render) return cfg.render();
    switch (cfg?.icon) {
      case "folder":
        return <ProjectsContent />;
      case "document":
        return <ResumeContent owner={owner} />;
      case "image":
        return <PhotoContent />;
      case "music":
        return <MusicContent />;
      case "terminal":
        return (
          <CrtTerminal
            rendering="fallback"
            prompt={`guest@${owner.name.toLowerCase().replace(/\s+/g, "")}:~$`}
            welcome={[`${owner.name}'s terminal`, "Type 'help' to look around."]}
            about={`${owner.name}, ${owner.role} in ${owner.location}. ${owner.bio}`}
            commands={{ contact: () => `Email ${owner.email}`, projects: () => ["coral-bloom", "glass-garden", "tidal-type", "night-loop"] }}
            height={Math.max(160, (open.find((w) => w.id === id)?.h ?? 300) - 60)}
            className="h-full rounded-none"
          />
        );
      case "trash":
        return <TrashContent />;
      default:
        return null;
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(owner.email);
    } catch {
      // Clipboard blocked: the address is still shown on the button's label.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section
      aria-label={`${owner.name}'s desktop`}
      className={cn("@container relative isolate h-[640px] w-full overflow-clip rounded-2xl border-2 border-[var(--rd-ink)] text-[var(--rd-text)] select-none", className)}
      style={theme}
      {...props}
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {background ?? <PixelLandscape palette="alpine" cell={7} className="size-full" />}
      </div>

      {/* Desktop area above the taskbar. */}
      <div ref={deskRef} className="absolute inset-x-0 top-0" style={{ bottom: TASKBAR }} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}>
        <div role="group" aria-label="Desktop icons" className={cn(compact ? "grid grid-cols-3 gap-2 p-4" : "absolute inset-2")}>
          {windows.map((cfg, i) => {
            const cell = cellOf(cfg.id, i);
            const x = cell.col * CELL.w;
            const y = cell.row * CELL.h;
            return (
              <button
                key={cfg.id}
                ref={(el) => {
                  if (el) iconRefs.current.set(cfg.id, el);
                  else iconRefs.current.delete(cfg.id);
                }}
                type="button"
                tabIndex={focusIcon === cfg.id ? 0 : -1}
                aria-label={`${cfg.label}${selected === cfg.id ? ", selected" : ""}`}
                aria-haspopup="dialog"
                onPointerDown={startDrag("icon", cfg.id, x, y)}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  setSelected(cfg.id);
                  setFocusIcon(cfg.id);
                  // One tap opens on touch-sized (compact) layouts.
                  if (compact) openWindow(cfg.id, iconRefs.current.get(cfg.id));
                }}
                onDoubleClick={() => openWindow(cfg.id, iconRefs.current.get(cfg.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    openWindow(cfg.id, e.currentTarget);
                    return;
                  }
                  onIconKey(cfg.id)(e);
                }}
                onFocus={() => setFocusIcon(cfg.id)}
                onDragStart={(e) => e.preventDefault()}
                className={cn(
                  "group flex w-[80px] cursor-default flex-col items-center gap-1 rounded-sm p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-white/90",
                  !compact && "absolute touch-none transition-[left,top] duration-200 motion-reduce:transition-none",
                  compact && "w-full",
                )}
                style={compact ? undefined : { left: x, top: y }}
              >
                <PixelArt art={PIXEL_ICONS[cfg.icon]} className="size-12 drop-shadow-[2px_2px_0_rgb(0_0_0/0.25)]" />
                <span
                  className={cn(
                    PIXEL_FONT,
                    "max-w-full truncate px-1 text-[12px] text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.6)]",
                    selected === cfg.id ? "bg-[var(--rd-accent)] outline-1 outline-white outline-dotted" : "bg-black/45",
                  )}
                >
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {open.map((win) => {
            const cfg = configs.get(win.id);
            const isHello = win.id === HELLO;
            const label = isHello ? "hello.exe" : (cfg?.title ?? cfg?.label ?? win.id);
            const box = isHello && helloBox ? { ...win, ...helloBox } : win;
            const full = compact || win.maximized;
            const titleId = `${uid}-${win.id}-title`;
            return (
              <motion.div
                key={win.id}
                ref={(el) => {
                  if (el) winRefs.current.set(win.id, el);
                  else winRefs.current.delete(win.id);
                }}
                role="dialog"
                aria-labelledby={titleId}
                tabIndex={-1}
                inert={win.minimized}
                aria-hidden={win.minimized || undefined}
                layout={!reduceMotion}
                onPointerDownCapture={() => focusWindow(win.id)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    closeWindow(win.id);
                  }
                }}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.25, x: win.from.x, y: win.from.y }}
                animate={
                  win.minimized
                    ? reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.15, x: win.to.x, y: win.to.y }
                    : { opacity: 1, scale: 1, x: 0, y: 0 }
                }
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, transition: { duration: duration.quick } }}
                transition={{ duration: duration.base, ease: ease.out }}
                style={{ zIndex: 10 + win.z, ...(full ? { left: 0, top: 0, width: "100%", height: "100%" } : { left: box.x, top: box.y, width: box.w, height: box.h }), pointerEvents: win.minimized ? "none" : undefined }}
                className={cn(
                  "@container/window absolute flex flex-col border-2 border-[var(--rd-ink)] bg-[var(--rd-surface)] shadow-[inset_-2px_-2px_0_var(--rd-shade),inset_2px_2px_0_var(--rd-light),6px_6px_0_rgb(0_0_0/0.25)] outline-none",
                  activeId !== win.id && "[&_[data-titlebar]]:bg-[var(--rd-muted)]",
                )}
              >
                <div
                  data-titlebar
                  onPointerDown={startDrag("window", win.id, box.x, box.y)}
                  onDoubleClick={() => !compact && patch(win.id, { maximized: !win.maximized })}
                  className={cn("m-[3px] flex h-8 shrink-0 items-center gap-2 bg-[var(--rd-title)] pr-1 pl-2 text-white", !compact && !win.maximized && "cursor-grab active:cursor-grabbing")}
                >
                  <PixelArt art={isHello ? pixelAvatar() : PIXEL_ICONS[cfg?.icon ?? "document"]} className="size-4 shrink-0" />
                  <h2 id={titleId} className={cn(PIXEL_FONT, "min-w-0 flex-1 truncate text-[13px]")}>
                    {label}
                  </h2>
                  <WindowButton label={`Minimize ${label}`} onClick={() => minimize(win.id)} glyph="min" />
                  {compact ? null : <WindowButton label={win.maximized ? `Restore ${label}` : `Maximize ${label}`} onClick={() => patch(win.id, { maximized: !win.maximized })} glyph={win.maximized ? "restore" : "max"} />}
                  <WindowButton label={`Close ${label}`} onClick={() => closeWindow(win.id)} glyph="close" />
                </div>
                <div className="min-h-0 flex-1 overflow-auto bg-[var(--rd-bg)] select-text">
                  {isHello ? (
                    <div className="flex flex-col gap-3 p-4">
                      <div className="flex items-center gap-3">
                        {owner.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
                          <img src={owner.avatar} alt="" className="size-16 border-2 border-[var(--rd-ink)] object-cover [image-rendering:pixelated]" />
                        ) : (
                          <PixelArt art={pixelAvatar()} className="size-16 border-2 border-[var(--rd-ink)] bg-[#cfe3ff]" />
                        )}
                        <div className="min-w-0">
                          <p className={cn(PIXEL_FONT, "text-[20px] leading-tight")}>{owner.name}</p>
                          <p className={cn(PIXEL_FONT, "text-[13px] text-[var(--rd-muted)]")}>{owner.role}</p>
                          <p className="text-[12px] text-[var(--rd-muted)]">{owner.location}</p>
                        </div>
                      </div>
                      <p className="text-[13.5px] leading-6">{owner.bio}</p>
                      {owner.available !== false ? (
                        <p className="inline-flex w-fit items-center gap-2 border-2 border-[var(--rd-ink)] bg-[var(--rd-surface)] px-2 py-0.5 text-[12px]">
                          <span className="relative flex size-2" aria-hidden="true">
                            <span className="absolute inset-0 animate-ping bg-emerald-500/70 motion-reduce:hidden" />
                            <span className="relative size-2 bg-emerald-500" />
                          </span>
                          Available for work
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <RetroButton onClick={copyEmail} aria-label={copied ? "Email copied" : `Copy email ${owner.email}`}>
                          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                          {copied ? "Copied" : "Copy email"}
                        </RetroButton>
                        <a
                          href={owner.bookingHref ?? `mailto:${owner.email}`}
                          className="focus-ring inline-flex h-8 items-center border-2 border-[var(--rd-ink)] bg-[var(--rd-accent)] px-2 text-[12.5px] text-white shadow-[inset_-2px_-2px_0_rgb(0_0_0/0.25),inset_2px_2px_0_rgb(255_255_255/0.35)]"
                        >
                          Book a call
                        </a>
                        {configs.has("projects") ? <RetroButton onClick={(e) => openWindow("projects", e.currentTarget)}>See projects</RetroButton> : null}
                      </div>
                      <p className={cn(PIXEL_FONT, "text-[12px] text-[var(--rd-muted)]")}>Open the icons to look around. Drag them too.</p>
                      <span role="status" className="sr-only">
                        {copied ? "Email copied" : ""}
                      </span>
                    </div>
                  ) : (
                    contentFor(win.id)
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Taskbar. */}
      <nav aria-label="Taskbar" className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 border-t-2 border-[var(--rd-ink)] bg-[var(--rd-surface)] px-1.5 shadow-[inset_0_2px_0_var(--rd-light)]" style={{ height: TASKBAR }}>
        <RetroButton
          ref={(el) => {
            if (el) taskRefs.current.set(HELLO, el);
          }}
          aria-label={`About ${owner.name}`}
          aria-pressed={activeId === HELLO}
          onClick={() => openWindow(HELLO)}
          className="h-9 px-1.5"
        >
          <PixelArt art={pixelAvatar()} className="size-6" />
          <span className={cn(PIXEL_FONT, "hidden text-[12px] @md:inline")}>{owner.name}</span>
        </RetroButton>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {open
            .filter((w) => w.id !== HELLO)
            .map((win) => {
              const cfg = configs.get(win.id);
              const isActive = activeId === win.id;
              return (
                <RetroButton
                  key={win.id}
                  ref={(el) => {
                    if (el) taskRefs.current.set(win.id, el);
                    else taskRefs.current.delete(win.id);
                  }}
                  aria-pressed={isActive}
                  aria-label={`${cfg?.label ?? win.id}${win.minimized ? ", minimized" : ""}`}
                  onClick={() => {
                    if (win.minimized) openWindow(win.id);
                    else if (isActive) minimize(win.id);
                    else openWindow(win.id);
                  }}
                  className="h-9 max-w-40 shrink-0 justify-start"
                >
                  {cfg ? <PixelArt art={PIXEL_ICONS[cfg.icon]} className="size-4 shrink-0" /> : null}
                  <span className={cn(PIXEL_FONT, "hidden truncate text-[12px] @lg:inline")}>{cfg?.label}</span>
                </RetroButton>
              );
            })}
        </div>
        <div className="flex h-9 items-center gap-2 border-2 border-[var(--rd-ink)] bg-[var(--rd-bg)] px-2 text-[13px] shadow-[inset_2px_2px_0_var(--rd-shade)]">
          <Clock />
          <button type="button" aria-pressed={dark} aria-label="Dark theme" onClick={() => setDark((d) => !d)} className="focus-ring inline-flex size-6 cursor-pointer items-center justify-center">
            {dark ? <Sun className="size-3.5" aria-hidden="true" /> : <Moon className="size-3.5" aria-hidden="true" />}
          </button>
        </div>
      </nav>
    </section>
  );
}

function WindowButton({ label, onClick, glyph }: { label: string; onClick: () => void; glyph: "min" | "max" | "restore" | "close" }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="focus-ring inline-flex size-6 shrink-0 cursor-pointer items-center justify-center border-2 border-[var(--rd-ink)] bg-[var(--rd-surface)] text-[var(--rd-text)] shadow-[inset_-2px_-2px_0_var(--rd-shade),inset_2px_2px_0_var(--rd-light)] active:shadow-[inset_2px_2px_0_var(--rd-shade)]"
    >
      <svg viewBox="0 0 8 8" className="size-2.5" shapeRendering="crispEdges" aria-hidden="true">
        {glyph === "min" ? <rect x="1" y="6" width="6" height="1.5" fill="currentColor" /> : null}
        {glyph === "max" ? <path d="M1 1h6v6H1zM2 3v3h4V3z" fill="currentColor" fillRule="evenodd" /> : null}
        {glyph === "restore" ? <path d="M2 1h5v5H6V2H2zM1 3h5v4H1zM2 4v2h3V4z" fill="currentColor" fillRule="evenodd" /> : null}
        {glyph === "close" ? <path d="M1 1h1.5v1h1v1h1V2h1V1H7v1.5H6v1H5v1h1v1h1V7H5.5V6h-1V5h-1v1h-1v1H1V5.5h1v-1h1v-1H2v-1H1z" fill="currentColor" /> : null}
      </svg>
    </button>
  );
}
