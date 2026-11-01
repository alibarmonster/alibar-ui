"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { LayoutGroup, motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface ColorPickerProps
  extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Controlled color as a hex string, e.g. "#2563eb". */
  value?: string;
  /** Initial color when uncontrolled. @default "#2563eb" */
  defaultValue?: string;
  /** Called with a lowercase six-digit hex string. */
  onValueChange?: (hex: string) => void;
  /** Preset colors. @default a 12-color palette */
  swatches?: string[];
  /** Show the hue slider. @default true */
  showHue?: boolean;
  /** Show the hex field (and an eyedropper where the browser supports it). @default true */
  showInput?: boolean;
  /** Accessible name for the swatch group. @default "Preset colors" */
  label?: string;
}

const DEFAULT_SWATCHES = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#2563eb", "#8b5cf6", "#d946ef", "#09090b",
];

// --- color math -------------------------------------------------------------

export function normalizeHex(input: string): string | null {
  const hex = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${[...hex].map((c) => c + c).join("")}`;
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  return null;
}

function hexToHsl(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const l = (maxC + minC) / 2;
  const d = maxC - minC;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = maxC === r ? ((g - b) / d) % 6 : maxC === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: Math.round(h * 60 + 360) % 360, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
}

const hasEyeDropper = () => "EyeDropper" in window;

// --- component --------------------------------------------------------------

export function ColorPicker({
  value,
  defaultValue = "#2563eb",
  onValueChange,
  swatches = DEFAULT_SWATCHES,
  showHue = true,
  showInput = true,
  label = "Preset colors",
  className,
  ...props
}: ColorPickerProps) {
  const [internal, setInternal] = useState(() => normalizeHex(defaultValue) ?? "#2563eb");
  const color = normalizeHex(value ?? "") ?? internal;
  const hsl = hexToHsl(color);
  // Greys have no hue of their own, so the slider remembers the last one.
  const [lastHue, setLastHue] = useState(hsl.h);
  const hue = hsl.s >= 0.08 ? hsl.h : lastHue;

  const [draft, setDraft] = useState(color.slice(1));
  const [syncedColor, setSyncedColor] = useState(color);
  if (syncedColor !== color) {
    setSyncedColor(color);
    setDraft(color.slice(1));
  }

  const normalizedSwatches = swatches.map((s) => normalizeHex(s) ?? s);
  const reduceMotion = useReducedMotion();
  const eyeDropper = useSyncExternalStore(() => () => {}, hasEyeDropper, () => false);
  const groupId = useId();
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Hue thumb: springs to a new hue from a swatch, follows the pointer exactly while dragging.
  const huePos = useSpring(hue / 3.6, { stiffness: 500, damping: 38 });
  const hueX = useTransform(huePos, (v) => `${v}%`);
  useEffect(() => {
    if (dragging.current || reduceMotion) huePos.jump(hue / 3.6);
    else huePos.set(hue / 3.6);
  }, [hue, reduceMotion, huePos]);

  function setColor(next: string) {
    const hex = normalizeHex(next);
    if (!hex || hex === color) return;
    const { h, s } = hexToHsl(hex);
    if (s >= 0.08) setLastHue(h);
    if (value === undefined) setInternal(hex);
    onValueChange?.(hex);
  }

  function setHue(nextHue: number) {
    const h = ((Math.round(nextHue) % 360) + 360) % 360;
    setLastHue(h);
    // Give greys and near-white/black some color so moving the hue is visible.
    const s = hsl.s < 0.08 ? 0.72 : hsl.s;
    const l = hsl.l < 0.12 || hsl.l > 0.9 ? 0.52 : hsl.l;
    setColor(hslToHex(h, s, l));
  }

  function hueFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = trackRef.current!.getBoundingClientRect();
    return Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1) * 359;
  }

  function onHueKey(event: KeyboardEvent<HTMLDivElement>) {
    const stepSize = event.shiftKey ? 10 : 1;
    const targets: Record<string, number> = {
      ArrowRight: hue + stepSize,
      ArrowUp: hue + stepSize,
      ArrowLeft: hue - stepSize,
      ArrowDown: hue - stepSize,
      PageUp: hue + 30,
      PageDown: hue - 30,
      Home: 0,
      End: 359,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    setHue(Math.min(Math.max(targets[event.key], 0), 359));
  }

  const selectedIndex = normalizedSwatches.indexOf(color);

  function onSwatchKey(event: KeyboardEvent<HTMLDivElement>) {
    const current = Math.max(selectedIndex, 0);
    const columns = 6;
    const moves: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      ArrowDown: current + columns,
      ArrowUp: current - columns,
      Home: 0,
      End: normalizedSwatches.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = (moves[event.key] + normalizedSwatches.length) % normalizedSwatches.length;
    setColor(normalizedSwatches[next]);
    swatchRefs.current[next]?.focus();
  }

  const draftValid = normalizeHex(draft) !== null;

  return (
    <div className={cn("w-full max-w-[17.5rem] space-y-4 rounded-xl border border-border bg-background p-4 shadow-md", className)} {...props}>
      <LayoutGroup id={groupId}>
        <div role="radiogroup" aria-label={label} onKeyDown={onSwatchKey} className="grid grid-cols-6 gap-2">
          {normalizedSwatches.map((swatch, index) => {
            const selected = index === selectedIndex;
            return (
              <button
                key={`${swatch}-${index}`}
                ref={(node) => {
                  swatchRefs.current[index] = node;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={swatch}
                tabIndex={selected || (selectedIndex === -1 && index === 0) ? 0 : -1}
                onClick={() => setColor(swatch)}
                className="relative aspect-square cursor-pointer rounded-full outline-none transition-transform duration-150 hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {selected ? (
                  <motion.span
                    layoutId="swatch-ring"
                    aria-hidden="true"
                    className="absolute -inset-[3px] rounded-full border-2 border-foreground"
                    transition={reduceMotion ? { duration: 0 } : spring.snappy}
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]"
                  style={{ backgroundColor: swatch }}
                />
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      {showHue ? (
        <div
          ref={trackRef}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.querySelector<HTMLElement>("[role=slider]")?.focus({ preventScroll: true });
            setHue(hueFromPointer(event));
          }}
          onPointerMove={(event) => {
            if (dragging.current) setHue(hueFromPointer(event));
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          className="relative h-6 cursor-pointer touch-none"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
            style={{
              background: "linear-gradient(to right,#f00,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00)",
            }}
          />
          {/* Inset by the thumb radius so the thumb never leaves the track. */}
          <div className="pointer-events-none absolute inset-y-0 right-2.5 left-2.5">
            <motion.div className="absolute inset-y-0 left-0 w-full" style={{ x: hueX }}>
              <div
                role="slider"
                tabIndex={0}
                aria-label="Hue"
                aria-valuemin={0}
                aria-valuemax={359}
                aria-valuenow={hue}
                aria-valuetext={`${hue} degrees`}
                onKeyDown={onHueKey}
                className="pointer-events-auto absolute top-1/2 left-0 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_2px_6px_rgb(0_0_0/0.2)] outline-none focus-visible:ring-4 focus-visible:ring-ring/35"
                style={{ backgroundColor: hslToHex(hue, 1, 0.5) }}
              />
            </motion.div>
          </div>
        </div>
      ) : null}

      {showInput ? (
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-9 shrink-0 rounded-md shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]"
            style={{ backgroundColor: color }}
          />
          <label
            className={cn(
              "flex h-9 min-w-0 flex-1 items-center rounded-md border bg-background pl-2.5 font-mono text-sm shadow-xs transition-[border-color,box-shadow]",
              "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
              draftValid ? "border-input" : "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
            )}
          >
            <span className="text-muted-foreground" aria-hidden="true">
              #
            </span>
            <span className="sr-only">Hex color</span>
            <input
              value={draft}
              maxLength={7}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!draftValid || undefined}
              onChange={(event) => {
                const next = event.target.value.replace(/^#/, "").replace(/[^0-9a-f]/gi, "").slice(0, 6);
                setDraft(next);
                // Only full six-digit values apply while typing; "fff" would hijack "ff0066" mid-way.
                if (next.length === 6) setColor(next);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && draft.length === 3) setColor(draft);
              }}
              onBlur={() => {
                const shorthand = draft.length === 3 ? normalizeHex(draft) : null;
                if (shorthand) setColor(shorthand);
                setDraft((shorthand ?? color).slice(1));
              }}
              className="h-full w-full min-w-0 bg-transparent px-1 text-foreground uppercase outline-none"
            />
          </label>
          {eyeDropper ? (
            <button
              type="button"
              aria-label="Pick a color from the screen"
              onClick={async () => {
                try {
                  const Dropper = (window as unknown as { EyeDropper: new () => { open(): Promise<{ sRGBHex: string }> } }).EyeDropper;
                  const result = await new Dropper().open();
                  setColor(result.sRGBHex);
                } catch {
                  // The user cancelled.
                }
              }}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pipette className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
