"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Popover } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { bayerThreshold, orderedDither } from "@/lib/glyph/bayer";
import { runCanvasLoop, type CanvasLoop } from "@/lib/glyph/canvas-loop";
import { GLYPH_PALETTES, paletteRgb, resolvePalette } from "@/lib/glyph/palettes";

export interface PixelBloomOption {
  value: string;
  label: string;
  /** 2–8 hex colors, dark to light, that the pixels bloom in. @default a preset by position */
  palette?: string[];
}

export interface PixelBloomSelectProps extends Omit<ComponentProps<"button">, "value" | "defaultValue" | "onChange"> {
  /** Label shown in the trigger before the value. @default "Vibe" */
  label?: string;
  /** Options; each can bring its own palette. @default six sample vibes */
  options?: PixelBloomOption[];
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. @default the first option */
  defaultValue?: string;
  /** Called with the new value. */
  onValueChange?: (value: string) => void;
  /** Size of one pixel in CSS pixels, 2–10. @default 4 */
  pixelSize?: number;
  /** Form field name; adds a hidden input with the value. */
  name?: string;
}

const SAMPLE: PixelBloomOption[] = [
  { value: "verdant-sigil", label: "Verdant Sigil", palette: [...GLYPH_PALETTES.moss] },
  { value: "midnight-ledger", label: "Midnight Ledger", palette: [...GLYPH_PALETTES.midnight] },
  { value: "peach-static", label: "Peach Static", palette: [...GLYPH_PALETTES.peach] },
  { value: "ember-choir", label: "Ember Choir", palette: [...GLYPH_PALETTES.ember] },
  { value: "lilac-engine", label: "Lilac Engine", palette: [...GLYPH_PALETTES.lilac] },
  { value: "mono-drift", label: "Mono Drift", palette: [...GLYPH_PALETTES.mono] },
];

const PRESET_ORDER = ["moss", "midnight", "peach", "ember", "lilac", "mono", "accent"] as const;
const OPEN_MS = 560;
const CLOSE_MS = 460;

type Phase = "opening" | "open" | "closing";

const paletteOf = (option: PixelBloomOption | undefined, index: number) =>
  resolvePalette(option?.palette ?? PRESET_ORDER[Math.max(0, index) % PRESET_ORDER.length], "moss");

/**
 * A select whose list grows out of colored pixels: on open, a field of square pixels in the
 * selected option's palette resolves top to bottom into the option list as an ordered-dither
 * threshold sweeps across it; on close the options solidify back into pixels that fall away.
 * Hovering or arrowing to an option tints the field toward that option's palette. The pixels are a
 * canvas behind real DOM options, so text stays crisp and the list keeps full listbox semantics.
 */
export function PixelBloomSelect({
  label = "Vibe",
  options = SAMPLE,
  value,
  defaultValue,
  onValueChange,
  pixelSize = 4,
  name,
  disabled,
  className,
  ...props
}: PixelBloomSelectProps) {
  const reduceMotion = useReducedMotion();
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value);
  const selectedValue = value ?? internal;
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === selectedValue));
  const selected = options[selectedIndex];
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const listRef = useRef<HTMLDivElement>(null);
  // Radix mounts portal content a render after `open` flips, so track the panel element in state.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typeahead = useRef({ text: "", timer: 0 });
  const anim = useRef({ phase: "opening" as Phase, start: 0, tint: selectedIndex, tintFrom: selectedIndex, tintStart: -1, loop: null as CanvasLoop | null });
  const listId = useId();
  const labelId = useId();
  const cell = Math.min(10, Math.max(2, Math.round(pixelSize)));

  function startOpen() {
    setActive(selectedIndex);
    setOpen(true);
    setClosing(false);
  }

  function startClose() {
    if (!open) return;
    setOpen(false);
    // Keep the panel mounted while its options fall away as pixels.
    setClosing(true);
    const a = anim.current;
    a.phase = "closing";
    a.start = -1;
    a.loop?.wake();
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    if (value === undefined) setInternal(option.value);
    onValueChange?.(option.value);
    startClose();
  }

  function move(to: number) {
    if (!options.length) return;
    const index = (to + options.length) % options.length;
    setActive(index);
    document.getElementById(`${listId}-${index}`)?.scrollIntoView({ block: "nearest" });
  }

  function onListKey(event: KeyboardEvent<HTMLElement>) {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(active + 1),
      ArrowUp: () => move(active - 1),
      Home: () => move(0),
      End: () => move(options.length - 1),
      Enter: () => choose(active),
      " ": () => choose(active),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
      return;
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      window.clearTimeout(typeahead.current.timer);
      typeahead.current.text += event.key.toLowerCase();
      typeahead.current.timer = window.setTimeout(() => {
        typeahead.current.text = "";
      }, 500);
      const match = options.findIndex((o) => o.label.toLowerCase().startsWith(typeahead.current.text));
      if (match !== -1) move(match);
    }
  }

  // The highlighted option tints the field.
  useEffect(() => {
    const a = anim.current;
    if (a.tint === active) return;
    a.tintFrom = a.tint;
    a.tint = active;
    a.tintStart = -1;
    a.loop?.wake();
  }, [active]);

  // The pixel field lives while the panel is mounted.
  const mounted = open || closing;
  useEffect(() => {
    const canvas = canvasRef.current;
    const list = listRef.current;
    const ctx = canvas?.getContext("2d");
    if (!mounted || !panel || !canvas || !list || !ctx) return;
    const a = anim.current;
    a.phase = "opening";
    a.start = -1;
    a.tint = active;
    a.tintFrom = active;
    a.tintStart = -2;
    let cols = 0;
    let rows = 0;
    let dpr = 1;
    let finished = false;
    const palettes = options.map((o, i) => paletteRgb(paletteOf(o, i)));

    const setEdge = (edge: number) => list.style.setProperty("--edge", `${(edge * 100).toFixed(1)}%`);

    const draw = (time: number, still: boolean) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (a.start < 0) a.start = time;
      if (a.tintStart === -1) a.tintStart = time;
      const t = time - a.start;
      const tintMix = a.tintStart < 0 ? 1 : Math.min(1, (time - a.tintStart) / 0.25);
      const from = palettes[a.tintFrom] ?? palettes[0];
      const to = palettes[a.tint] ?? palettes[0];
      let p = 1;
      let q = 0;
      if (!still && a.phase === "opening") {
        p = Math.min(1, t / (OPEN_MS / 1000));
        if (p >= 1) a.phase = "open";
      }
      if (a.phase === "closing") q = still ? 1 : Math.min(1, t / (CLOSE_MS / 1000));
      // DOM options follow the same sweep through a mask.
      setEdge(a.phase === "closing" ? 1.15 - q * 2.5 : p * 1.3 - 0.15);
      const h = rows * cell;
      for (let y = 0; y < rows; y++) {
        const fy = y / Math.max(1, rows - 1);
        for (let x = 0; x < cols; x++) {
          const th = bayerThreshold(x, y, 8);
          let alpha: number;
          let dy = 0;
          if (a.phase === "closing") {
            // Solidify from the bottom up, then fall away.
            const solid = Math.min(1, Math.max(0, (q * 2.5 - (1 - fy)) / 0.3));
            if (th >= solid) continue;
            const f = Math.min(1, Math.max(0, (q - 0.25 - th * 0.25 - (1 - fy) * 0.1) / 0.5));
            dy = f * f * h * 0.9;
            alpha = 1 - f;
          } else {
            // Unrevealed cells are solid; revealed ones leave a faint, sparse tint behind the text.
            const reveal = Math.min(1, Math.max(0, (p * 1.3 - fy) / 0.3));
            if (th >= reveal) alpha = 1;
            else if (th < 0.22) alpha = 0.14;
            else continue;
          }
          const useTo = bayerThreshold(y, x, 8) < tintMix;
          const pal = useTo ? to : from;
          const v = 0.5 + 0.25 * Math.sin(x * 0.31 + time * 1.4) + 0.25 * Math.cos(y * 0.43 - time * 1.1 + x * 0.07);
          const [r, g, b] = pal[orderedDither(v, x, y, pal.length, 8)];
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgb(${r} ${g} ${b})`;
          ctx.fillRect(x * cell, y * cell + dy, cell, cell);
        }
      }
      ctx.globalAlpha = 1;
      // Under reduced motion the panel's fade ends the close instead.
      if (a.phase === "closing" && q >= 1 && !finished && !still) {
        finished = true;
        setClosing(false);
      }
    };

    const loop = runCanvasLoop({
      host: panel,
      canvas,
      rootMargin: "0px",
      resize: (frame) => {
        dpr = frame.dpr;
        cols = Math.ceil(frame.width / cell);
        rows = Math.ceil(frame.height / cell);
      },
      render: (frame) => draw(frame.time, frame.still),
    });
    a.loop = loop;
    return () => {
      a.loop = null;
      loop.dispose();
    };
    // `active` seeds the tint once per mount (later changes go through the tint effect), and closing
    // only changes the phase of this same loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, panel, cell, options]);

  return (
    <Popover.Root
      open={mounted}
      onOpenChange={(next) => {
        if (next) startOpen();
        else startClose();
      }}
    >
      <Popover.Trigger
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelId}
        className={cn(
          "group inline-flex h-11 max-w-full cursor-pointer items-center gap-3 rounded-full border border-border bg-background py-1 pr-1.5 pl-4 text-left text-sm shadow-xs outline-none",
          "transition-[border-color,box-shadow] duration-150 hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <span className="flex min-w-0 items-baseline gap-2" id={labelId}>
          <span className="shrink-0 text-[12.5px] text-muted-foreground">{label}</span>
          <span className="relative grid min-w-0 *:[grid-area:1/1]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={selected?.value}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(3px)" }}
                transition={{ duration: duration.quick, ease: ease.out }}
                className="truncate font-medium text-foreground"
              >
                {selected?.label}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
        <span aria-hidden="true" className="flex h-3 shrink-0 overflow-hidden rounded-sm">
          {paletteOf(selected, selectedIndex).map((c, i) => (
            <span key={`${c}-${i}`} className="h-full w-1.5" style={{ background: c }} />
          ))}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground">
          <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-300 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
        </span>
      </Popover.Trigger>
      {name ? <input type="hidden" name={name} value={selectedValue ?? ""} /> : null}

      {mounted ? (
        <Popover.Portal forceMount>
          <Popover.Content
            forceMount
            asChild
            align="start"
            sideOffset={8}
            collisionPadding={12}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              listRef.current?.focus();
            }}
            onKeyDown={closing ? undefined : onListKey}
          >
            <motion.div
              ref={setPanel}
              initial={reduceMotion ? { opacity: 0 } : false}
              animate={{ opacity: reduceMotion && closing ? 0 : 1 }}
              transition={{ duration: duration.base }}
              onAnimationComplete={() => {
                // Reduced motion: the fade out is the whole close.
                if (reduceMotion && closing) setClosing(false);
              }}
              className={cn(
                "relative z-50 w-[max(var(--radix-popover-trigger-width),16rem)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg outline-none",
                closing && "pointer-events-none",
              )}
            >
              <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full [image-rendering:pixelated]" />
              <div
                ref={listRef}
                role="listbox"
                id={listId}
                tabIndex={-1}
                aria-labelledby={labelId}
                aria-activedescendant={`${listId}-${active}`}
                className="relative max-h-80 overflow-y-auto p-1.5 outline-none [mask-image:linear-gradient(to_bottom,#000_calc(var(--edge,0%)-12%),transparent_calc(var(--edge,0%)+4%))] motion-reduce:[mask-image:none]"
              >
                {options.map((option, i) => {
                  const isSelected = option.value === selectedValue;
                  return (
                    <div
                      key={option.value}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={isSelected}
                      onPointerMove={() => {
                        if (active !== i) setActive(i);
                      }}
                      onClick={() => choose(i)}
                      className={cn(
                        "flex h-10 cursor-pointer items-center gap-3 rounded-xl px-3 text-[14px] text-foreground transition-colors",
                        i === active ? "bg-background/85 shadow-xs ring-1 ring-border" : "hover:bg-background/60",
                      )}
                    >
                      <span aria-hidden="true" className="flex h-3.5 shrink-0 overflow-hidden rounded-[3px]">
                        {paletteOf(option, i).map((c, k) => (
                          <span key={`${c}-${k}`} className="h-full w-1.5" style={{ background: c }} />
                        ))}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
                      {isSelected ? <Check aria-hidden="true" className="size-4 shrink-0 text-foreground" /> : null}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </Popover.Content>
        </Popover.Portal>
      ) : null}
    </Popover.Root>
  );
}
