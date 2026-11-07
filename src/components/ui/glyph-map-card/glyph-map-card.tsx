"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import { Check, MapPin, Maximize2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { runCanvasLoop, type CanvasLoop } from "@/lib/glyph/canvas-loop";
import { getGlyphAtlas, loadGlyphFont, monoFontFamily, type GlyphAtlas } from "@/lib/glyph/glyph-atlas";
import { rampGlyphs } from "@/lib/glyph/ramp";
import { sampleImage, sampleSource, type GlyphSample } from "@/lib/glyph/sample-image";

export type GlyphMapTone = "green" | "indigo" | "ember" | "mono";
export type GlyphMapRamp = "classic" | "binary" | "blocks";

export interface GlyphMapWatcher {
  /** Used for the avatar's alt text and initials. */
  name: string;
  /** Avatar image. Without it, initials are shown. */
  image?: string;
}

export interface GlyphMapCardProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  /** Image redrawn as glyphs (any size; it is cropped to fill). Without it, a built-in sphere study is used. */
  image?: string;
  /** Describes the image for screen readers; also the default caption in the expanded view. */
  imageAlt?: string;
  /** Card title, set in a serif display face. @default "Quiet Orbit" */
  title?: string;
  /** Short description under the title. */
  description?: string;
  /** Small label at the top of the colored panel. @default "Stock Card" */
  label?: string;
  /** Place shown with a pin icon. */
  location?: string;
  /** Avatars of people watching (up to 3 are shown) and the total count. */
  watchers?: { people: GlyphMapWatcher[]; total: number };
  /** Color of the glyphs and the panel. @default "indigo" */
  tone?: GlyphMapTone;
  /** Glyph ramp: classic ASCII, binary digits or shade blocks. @default "classic" */
  ramp?: GlyphMapRamp;
  /** Glyph cell size in px. @default 9 */
  cell?: number;
  /** Controlled "added" state of the Add card button. */
  added?: boolean;
  /** Initial "added" state when uncontrolled. @default false */
  defaultAdded?: boolean;
  /** Called with the new state when Add card is pressed. */
  onAdd?: (added: boolean) => void;
  /** Called when the expanded view opens or closes. */
  onExpand?: (expanded: boolean) => void;
  /** Caption under the glyph map in the expanded view. @default imageAlt */
  caption?: string;
}

interface ToneColors {
  ground: string;
  ink: string;
  soft: string;
  hot: string;
  panel: string;
  panelFg: string;
  panelMuted: string;
}

const TONES: Record<GlyphMapTone, ToneColors> = {
  green: { ground: "#eaf5ee", ink: "#17663f", soft: "#86bf9c", hot: "#1f9d55", panel: "#17663f", panelFg: "#f2fbf5", panelMuted: "#cfe9da" },
  indigo: { ground: "#edf0ff", ink: "#2b3fcf", soft: "#9ba7f3", hot: "#4d68ff", panel: "#2b3fcf", panelFg: "#f5f6ff", panelMuted: "#d3d9ff" },
  ember: { ground: "#fff1e8", ink: "#b93a0c", soft: "#f0a47e", hot: "#ee6316", panel: "#b93a0c", panelFg: "#fff7f2", panelMuted: "#ffd9c4" },
  mono: { ground: "#f4f4f5", ink: "#18181b", soft: "#a1a1aa", hot: "#52525b", panel: "#18181b", panelFg: "#fafafa", panelMuted: "#d4d4d8" },
};

const SERIF = "[font-family:var(--font-geist-serif),ui-serif,Georgia,'Times_New_Roman',serif]";
const MORPH = { type: "spring", stiffness: 300, damping: 32 } as const;

/* ------------------------------------------------------------------ default art */

let defaultArt: HTMLCanvasElement | null = null;

/** A shaded sphere with a ring and a moon, drawn once: the image used when none is given. */
function getDefaultArt() {
  if (defaultArt) return defaultArt;
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 500, 400);
    const ring = (front: boolean) => {
      ctx.save();
      ctx.translate(250, 205);
      ctx.rotate(-0.32);
      ctx.beginPath();
      ctx.ellipse(0, 0, 205, 52, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
      ctx.lineWidth = 22;
      ctx.strokeStyle = front ? "#3a3a3a" : "#8a8a8a";
      ctx.stroke();
      ctx.restore();
    };
    ring(false);
    // Mostly mid to dark so the whole sphere fills with glyphs, lighter toward the top left.
    const sphere = ctx.createRadialGradient(205, 160, 10, 240, 200, 150);
    sphere.addColorStop(0, "#9c9c9c");
    sphere.addColorStop(0.5, "#4c4c4c");
    sphere.addColorStop(1, "#0d0d0d");
    ctx.fillStyle = sphere;
    ctx.beginPath();
    ctx.arc(250, 205, 122, 0, Math.PI * 2);
    ctx.fill();
    ring(true);
    const moon = ctx.createRadialGradient(410, 80, 2, 420, 90, 34);
    moon.addColorStop(0, "#d8d8d8");
    moon.addColorStop(1, "#262626");
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(420, 90, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#555555";
    for (const [x, y, r] of [[60, 70, 4], [110, 320, 3], [440, 300, 5], [80, 220, 2.5], [330, 40, 3]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  defaultArt = canvas;
  return canvas;
}

/* ------------------------------------------------------------------ glyph field */

const hash = (n: number) => {
  let h = Math.imul(n | 0, 2654435761) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
};

interface GlyphFieldProps {
  image?: string;
  colors: ToneColors;
  ramp: GlyphMapRamp;
  cell: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * The live glyph map: one canvas, glyphs blitted from a shared atlas. Cells re-roll toward
 * neighboring densities over time; near the pointer they heat up, scramble, grow and push
 * outward, then cool and settle back.
 */
function GlyphField({ image, colors, ramp, cell, className, style }: GlyphFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ink, soft, hot } = colors;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    const glyphs = rampGlyphs(ramp);
    const count = glyphs.length;
    const fontFamily = monoFontFamily(host);
    let atlas: GlyphAtlas | null = null;
    let sample: GlyphSample | null = null;
    let cols = 0;
    let rows = 0;
    let ox = 0;
    let oy = 0;
    let dpr = 1;
    let base = new Uint8Array(0);
    let current = new Uint8Array(0);
    let heat = new Float32Array(0);
    let timer = new Float32Array(0);
    let alpha = new Float32Array(0);
    let lastDraw = -1;
    let rolls = 0;
    let disposed = false;
    let loop: CanvasLoop | null = null;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, inside: false };

    const buildAtlas = () => {
      atlas = getGlyphAtlas({ glyphs, colors: [ink, soft, hot], cell, dpr, fontFamily, fontWeight: 500, fontScale: 0.92, maxScale: 1.6 });
    };

    /** Darkness per cell from the sample, with a little contrast and a floor so pale ground stays empty. */
    const applySample = (next: GlyphSample) => {
      if (next.cols !== cols || next.rows !== rows) return;
      sample = next;
      for (let i = 0; i < cols * rows; i++) {
        const dark = Math.min(1, Math.max(0, ((1 - next.luminance[i] - 0.5) * 1.15 + 0.5 - 0.1) / 0.9));
        const level = next.alpha[i] < 0.05 ? 0 : Math.min(count - 1, Math.floor(dark * count));
        base[i] = level;
        current[i] = level;
        alpha[i] = next.alpha[i];
        timer[i] = 0.5 + hash(i * 7 + 3) * 4;
      }
      lastDraw = -1;
      // During the first resize the loop isn't assigned yet; it renders right after anyway.
      loop?.redraw();
      canvas.style.opacity = "1";
    };

    const resample = () => {
      if (!cols || !rows) return;
      if (!image) return applySample(sampleSource(getDefaultArt(), 500, 400, cols, rows, "cover"));
      const want = { cols, rows };
      sampleImage(image, cols, rows, "cover")
        .then((next) => {
          if (!disposed && want.cols === cols && want.rows === rows) applySample(next);
        })
        .catch(() => {
          // An image that fails to load leaves the tinted ground on its own.
        });
    };

    const reroll = (i: number) => {
      rolls++;
      const b = base[i];
      const r = hash(i * 131 + rolls * 977);
      if (heat[i] > 0.3) {
        // Scrambling: any non-empty glyph.
        current[i] = 1 + Math.floor(r * (count - 1));
        return;
      }
      if (b === 0) {
        // Pale cells mostly stay empty, with the odd faint sparkle (rarer when the lightest glyph is heavy).
        current[i] = r < (count > 3 ? 0.035 : 0.012) ? 1 : 0;
        return;
      }
      // Drift to a neighboring density, leaning back toward the true one.
      current[i] = r < 0.55 ? b : Math.max(1, Math.min(count - 1, b + (r < 0.78 ? -1 : 1)));
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!atlas || !sample) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      const radius = Math.max(56, cell * 7);
      let faded = false;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const g = current[i];
          if (g === 0) continue;
          const h = heat[i];
          let px = ox + x * cell;
          let py = oy + y * cell;
          if (h > 0.01) {
            const dx = px + cell / 2 - pointer.x;
            const dy = py + cell / 2 - pointer.y;
            const d = Math.hypot(dx, dy) || 1;
            const push = h * cell * 1.9 * Math.min(1, d / (radius * 0.3));
            px += (dx / d) * push;
            py += (dy / d) * push;
          }
          const a = alpha[i];
          if (a < 0.98) {
            ctx.globalAlpha = a;
            faded = true;
          } else if (faded) {
            ctx.globalAlpha = 1;
            faded = false;
          }
          const color = h > 0.45 ? 2 : g >= count / 2 ? 0 : 1;
          atlas.draw(ctx, g, color, px, py, 1 + h * 0.55);
        }
      }
      ctx.globalAlpha = 1;
    };

    loop = runCanvasLoop({
      host,
      canvas,
      resize: (frame) => {
        dpr = frame.dpr;
        buildAtlas();
        const nextCols = Math.max(1, Math.floor(frame.width / cell));
        const nextRows = Math.max(1, Math.floor(frame.height / cell));
        ox = (frame.width - nextCols * cell) / 2;
        oy = (frame.height - nextRows * cell) / 2;
        if (nextCols !== cols || nextRows !== rows) {
          cols = nextCols;
          rows = nextRows;
          const n = cols * rows;
          base = new Uint8Array(n);
          current = new Uint8Array(n);
          heat = new Float32Array(n);
          timer = new Float32Array(n);
          alpha = new Float32Array(n);
          sample = null;
          resample();
        }
      },
      render: ({ dt, time, still }) => {
        if (still || !sample) {
          // Reduced motion (or nothing to animate yet): the true glyphs, still.
          if (sample) {
            current.set(base);
            heat.fill(0);
          }
          draw();
          return;
        }
        const k = 1 - Math.exp(-dt * 10);
        pointer.x += (pointer.tx - pointer.x) * k;
        pointer.y += (pointer.ty - pointer.y) * k;
        pointer.strength += ((pointer.inside ? 1 : 0) - pointer.strength) * (1 - Math.exp(-dt * (pointer.inside ? 8 : 2.5)));
        const radius = Math.max(56, cell * 7);
        const cool = Math.exp(-dt * 2.2);
        let hottest = 0;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            let target = 0;
            if (pointer.strength > 0.01) {
              const d = Math.hypot(ox + x * cell + cell / 2 - pointer.x, oy + y * cell + cell / 2 - pointer.y);
              if (d < radius) target = pointer.strength * (1 - d / radius) ** 2;
            }
            heat[i] = target > heat[i] ? heat[i] + (target - heat[i]) * Math.min(1, dt * 14) : heat[i] * cool;
            if (heat[i] < 0.002) heat[i] = 0;
            hottest = Math.max(hottest, heat[i]);
            timer[i] -= dt * (1 + heat[i] * 40);
            if (timer[i] <= 0) {
              reroll(i);
              timer[i] = heat[i] > 0.3 ? 0.04 + hash(i + rolls) * 0.08 : 1.4 + hash(i * 3 + rolls) * 3.6;
            }
          }
        }
        // Idle shimmer only needs ~16 fps; the pointer gets every frame.
        if (hottest < 0.01 && lastDraw >= 0 && time - lastDraw < 1 / 16) return;
        lastDraw = time;
        draw();
      },
    });

    const local = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      // Divide by the rendered scale so pointer math holds inside scaled (animating) parents.
      const sx = rect.width / (host.clientWidth || 1) || 1;
      const sy = rect.height / (host.clientHeight || 1) || 1;
      return { x: (event.clientX - rect.left) / sx, y: (event.clientY - rect.top) / sy };
    };
    const onMove = (event: PointerEvent) => {
      const p = local(event);
      if (!pointer.inside && pointer.strength < 0.05) {
        pointer.x = p.x;
        pointer.y = p.y;
      }
      pointer.tx = p.x;
      pointer.ty = p.y;
      pointer.inside = true;
      loop?.wake();
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointercancel", onLeave);

    // Rebuild the atlas with Geist Mono once it has loaded.
    loadGlyphFont({ glyphs, fontFamily }).then(() => {
      if (disposed) return;
      buildAtlas();
      lastDraw = -1;
      loop?.redraw();
    });

    return () => {
      disposed = true;
      loop?.dispose();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointercancel", onLeave);
    };
  }, [image, ramp, cell, ink, soft, hot]);

  return (
    <div ref={hostRef} className={cn("relative overflow-hidden", className)} style={{ background: colors.ground, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full opacity-0 transition-opacity duration-500" />
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Watchers({ watchers, colors }: { watchers: NonNullable<GlyphMapCardProps["watchers"]>; colors: ToneColors }) {
  const shown = watchers.people.slice(0, 3);
  const more = Math.max(0, watchers.total - shown.length);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex shrink-0 -space-x-2">
        {shown.map((person) =>
          person.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
            <img
              key={person.name}
              src={person.image}
              alt={person.name}
              className="size-6 rounded-full object-cover ring-2"
              style={{ ["--tw-ring-color" as string]: colors.panel }}
            />
          ) : (
            <span
              key={person.name}
              role="img"
              aria-label={person.name}
              className="flex size-6 items-center justify-center rounded-full text-[9px] font-semibold ring-2"
              style={{ background: colors.panelMuted, color: colors.panel, ["--tw-ring-color" as string]: colors.panel }}
            >
              {initials(person.name)}
            </span>
          ),
        )}
      </div>
      <p className="truncate text-[12.5px]" style={{ color: colors.panelMuted }}>
        {more > 0 ? (
          <>
            +{more}
            {/* The long form only where it fits beside the Expand button. */}
            <span className="hidden @[21.75rem]/card:inline"> more are</span> watching
          </>
        ) : (
          `${watchers.total} watching`
        )}
      </p>
    </div>
  );
}

function AddButton({ added, onToggle, colors, className }: { added: boolean; onToggle: () => void; colors: ToneColors; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <button
      type="button"
      aria-pressed={added}
      onClick={onToggle}
      className={cn(
        "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium outline-none transition-[transform,background-color] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2",
        className,
      )}
      style={{ background: colors.panelFg, color: colors.panel, ["--tw-ring-offset-color" as string]: colors.panel }}
    >
      <span className="relative inline-flex size-3.5 items-center justify-center" aria-hidden="true">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={added ? "check" : "plus"}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotate: added ? -90 : 90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotate: added ? 90 : -90 }}
            transition={{ duration: duration.quick, ease: ease.out }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {added ? <Check className="size-3.5" strokeWidth={2.5} /> : <Plus className="size-3.5" strokeWidth={2.5} />}
          </motion.span>
        </AnimatePresence>
      </span>
      {added ? "Added" : "Add card"}
    </button>
  );
}

/* ------------------------------------------------------------------ card */

/**
 * An image redrawn as a living glyph map in a rounded card: glyphs gently re-roll, and near the
 * pointer they scramble, grow and push outward before settling. Below sits a colored panel with a
 * label, an Add card toggle, a serif title, description, location, watchers and an Expand button
 * that opens a larger view.
 */
export function GlyphMapCard({
  image,
  imageAlt,
  title = "Quiet Orbit",
  description = "A shaded sphere and its ring, redrawn in glyphs that shift as you move.",
  label = "Stock Card",
  location,
  watchers,
  tone = "indigo",
  ramp = "classic",
  cell = 9,
  added,
  defaultAdded = false,
  onAdd,
  onExpand,
  caption,
  className,
  style,
  ...props
}: GlyphMapCardProps) {
  const reduceMotion = useReducedMotion();
  const id = useId();
  const colors = TONES[tone] ?? TONES.indigo;
  const [addedState, setAddedState] = useState(defaultAdded);
  const isAdded = added ?? addedState;
  const [open, setOpen] = useState(false);
  const [spacer, setSpacer] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const morph = reduceMotion ? { duration: 0 } : MORPH;
  const alt = imageAlt ?? (image ? `${title}, drawn in glyphs` : "A ringed sphere and a small moon, drawn in glyphs");

  const toggleAdd = () => {
    const next = !isAdded;
    if (added === undefined) setAddedState(next);
    onAdd?.(next);
  };

  const setExpanded = (next: boolean) => {
    if (next) setSpacer(cardRef.current?.offsetHeight ?? 0);
    setOpen(next);
    onExpand?.(next);
  };

  const panelHead = (
    <div className="flex items-center justify-between gap-3">
      <span
        className="inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[10.5px] tracking-[0.08em] uppercase"
        style={{ background: "rgb(255 255 255 / 0.14)", color: colors.panelFg }}
      >
        {label}
      </span>
      <AddButton added={isAdded} onToggle={toggleAdd} colors={colors} />
    </div>
  );

  const locationRow = location ? (
    <p className="flex items-center gap-1.5 text-[12.5px]" style={{ color: colors.panelMuted }}>
      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{location}</span>
    </p>
  ) : null;

  return (
    <div className={cn("relative w-full max-w-[23rem]", className)} style={style} {...props}>
      {open ? (
        <div aria-hidden="true" style={{ height: spacer }} />
      ) : (
        <motion.div
          ref={cardRef}
          layoutId={`${id}-card`}
          transition={morph}
          style={{ borderRadius: 26, background: colors.panel }}
          className="@container/card relative overflow-hidden shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_-12px_rgb(0_0_0/0.25)]"
        >
          <motion.div layoutId={`${id}-map`} transition={morph} role="img" aria-label={alt} className="relative">
            <GlyphField image={image} colors={colors} ramp={ramp} cell={cell} className="aspect-[5/4] w-full" />
          </motion.div>
          <div className="flex flex-col gap-3 p-5" style={{ color: colors.panelFg }}>
            {panelHead}
            <div className="space-y-1.5">
              <motion.h3 layoutId={`${id}-title`} layout="position" transition={morph} className={cn(SERIF, "text-[1.75rem] leading-[1.05] tracking-[-0.01em]")}>
                {title}
              </motion.h3>
              {description ? (
                <p className="line-clamp-2 text-[13.5px] leading-5" style={{ color: colors.panelMuted }}>
                  {description}
                </p>
              ) : null}
            </div>
            {locationRow}
            <div className="mt-1 flex items-center justify-between gap-3 border-t pt-3.5" style={{ borderColor: "rgb(255 255 255 / 0.16)" }}>
              {watchers ? <Watchers watchers={watchers} colors={colors} /> : <span />}
              <button
                ref={expandRef}
                type="button"
                onClick={() => setExpanded(true)}
                aria-haspopup="dialog"
                className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/80"
                style={{ borderColor: "rgb(255 255 255 / 0.3)", color: colors.panelFg }}
              >
                <Maximize2 className="size-3.5" aria-hidden="true" />
                Expand
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <Dialog.Root open={open} onOpenChange={setExpanded}>
        <AnimatePresence>
          {open ? (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.base }}
                />
              </Dialog.Overlay>
              <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
                <Dialog.Content
                  asChild
                  forceMount
                  {...(description ? {} : { "aria-describedby": undefined })}
                  onCloseAutoFocus={(event) => {
                    // The Expand button re-mounts with the card, so return focus to it ourselves.
                    event.preventDefault();
                    requestAnimationFrame(() => expandRef.current?.focus());
                  }}
                >
                  <motion.div
                    layoutId={`${id}-card`}
                    transition={morph}
                    style={{ borderRadius: 30, background: colors.panel }}
                    className="pointer-events-auto relative grid max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto shadow-2xl outline-none md:grid-cols-[1.55fr_1fr]"
                  >
                    <motion.figure layoutId={`${id}-map`} transition={morph} className="relative m-0 overflow-hidden">
                      <div role="img" aria-label={alt} className="md:h-full">
                        <GlyphField image={image} colors={colors} ramp={ramp} cell={cell} className="aspect-[5/4] w-full md:aspect-auto md:h-full md:min-h-[30rem]" />
                      </div>
                      <figcaption
                        className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-5 py-3 font-mono text-[11px]"
                        style={{ color: colors.ink, background: `linear-gradient(to top, ${colors.ground}, transparent)` }}
                      >
                        <span aria-hidden="true">Fig. 1</span>
                        <span className="truncate">{caption ?? alt}</span>
                      </figcaption>
                    </motion.figure>
                    <div className="@container/card flex flex-col gap-4 p-6" style={{ color: colors.panelFg }}>
                      <div className="md:pr-10">{panelHead}</div>
                      <div className="space-y-2">
                        <Dialog.Title asChild>
                          <motion.h2 layoutId={`${id}-title`} layout="position" transition={morph} className={cn(SERIF, "pr-8 text-[2.25rem] leading-[1.02] tracking-[-0.01em]")}>
                            {title}
                          </motion.h2>
                        </Dialog.Title>
                        {description ? (
                          <Dialog.Description className="text-[14px] leading-6" style={{ color: colors.panelMuted }}>
                            {description}
                          </Dialog.Description>
                        ) : null}
                      </div>
                      {locationRow}
                      <motion.div
                        className="mt-auto space-y-3 border-t pt-4"
                        style={{ borderColor: "rgb(255 255 255 / 0.16)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: reduceMotion ? 0 : 0.15, duration: duration.base } }}
                        exit={{ opacity: 0, transition: { duration: duration.instant } }}
                      >
                        {watchers ? <Watchers watchers={watchers} colors={colors} /> : null}
                        <p className="font-mono text-[11px]" style={{ color: colors.panelMuted }}>
                          Move across the map to stir the glyphs.
                        </p>
                      </motion.div>
                    </div>
                    <Dialog.Close
                      aria-label="Close"
                      className="absolute top-4 right-4 z-10 inline-flex size-8 cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/80 md:top-5 md:right-5"
                      style={{ color: colors.panelFg, background: "rgb(255 255 255 / 0.1)" }}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Dialog.Close>
                  </motion.div>
                </Dialog.Content>
              </div>
            </Dialog.Portal>
          ) : null}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}
