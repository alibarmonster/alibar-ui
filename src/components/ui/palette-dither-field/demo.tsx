"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Minus, Plus } from "lucide-react";
import { PaletteDitherField, type PaletteDitherFieldHandle } from "@/components/ui/palette-dither-field/palette-dither-field";
import { GLYPH_PALETTE_LABELS, GLYPH_PALETTES, isGlyphPaletteName, MAX_PALETTE_COLORS, MIN_PALETTE_COLORS, type GlyphPaletteName } from "@/lib/glyph/palettes";
import { cn } from "@/lib/utils";

const PRESETS = Object.keys(GLYPH_PALETTE_LABELS) as GlyphPaletteName[];
const noop = () => () => {};

/** Demo only: ?palette=ember or ?colors=0b1026,2d3f8c,9db6ff picks the starting palette. */
function useUrlPalette() {
  const search = useSyncExternalStore(noop, () => window.location.search, () => "");
  const params = new URLSearchParams(search);
  const colors = params
    .get("colors")
    ?.split(",")
    .map((c) => `#${c.trim().replace(/^#/, "")}`)
    .filter((c) => /^#[\da-f]{6}$/i.test(c));
  if (colors && colors.length >= MIN_PALETTE_COLORS) return { custom: colors.slice(0, MAX_PALETTE_COLORS) };
  const name = params.get("palette");
  return { preset: isGlyphPaletteName(name) ? name : undefined };
}

export function Playground() {
  const field = useRef<PaletteDitherFieldHandle>(null);
  const fromUrl = useUrlPalette();
  const [active, setActive] = useState<GlyphPaletteName | "custom" | null>(null);
  const [custom, setCustom] = useState<string[] | null>(null);
  const current = active ?? (fromUrl.custom ? "custom" : (fromUrl.preset ?? "midnight"));
  const customColors = custom ?? fromUrl.custom ?? [...GLYPH_PALETTES.lilac];

  const choose = (name: GlyphPaletteName) => {
    setActive(name);
    field.current?.setPalette(name);
  };
  const applyCustom = (colors: string[]) => {
    setCustom(colors);
    setActive("custom");
    field.current?.setPalette(colors);
  };

  return (
    <div className="w-full space-y-4">
      <PaletteDitherField ref={field} palette={fromUrl.custom ?? fromUrl.preset ?? "midnight"} className="h-[420px] w-full rounded-2xl">
        <div className="pointer-events-none flex h-full flex-col justify-end p-8">
          <p className="w-fit rounded-md bg-black/45 px-2 py-1 font-mono text-[11px] tracking-[0.12em] text-white uppercase backdrop-blur-sm">
            {current === "custom" ? `Custom · ${customColors.length} colors` : `${GLYPH_PALETTE_LABELS[current]} · ${GLYPH_PALETTES[current].length} colors`}
          </p>
        </div>
      </PaletteDitherField>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Palette presets">
        {PRESETS.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={current === name}
            onClick={() => choose(name)}
            className={cn(
              "focus-ring inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px] transition-colors",
              current === name ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-surface",
            )}
          >
            <span className="flex overflow-hidden rounded-full" aria-hidden="true">
              {GLYPH_PALETTES[name].map((c) => (
                <span key={c} className="size-3" style={{ background: c }} />
              ))}
            </span>
            {GLYPH_PALETTE_LABELS[name]}
          </button>
        ))}
      </div>

      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-[13px] font-medium text-foreground">Custom palette, dark to light</legend>
        <div className="flex flex-wrap items-center gap-2">
          {customColors.map((color, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1 pr-2">
              <input
                type="color"
                value={color}
                aria-label={`Color ${i + 1} of ${customColors.length}`}
                onChange={(e) => applyCustom(customColors.map((c, k) => (k === i ? e.target.value : c)))}
                className="size-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
              />
              <span className="font-mono text-[11px] text-muted-foreground">{color}</span>
              <button
                type="button"
                aria-label={`Remove color ${i + 1}`}
                disabled={customColors.length <= MIN_PALETTE_COLORS}
                onClick={() => applyCustom(customColors.filter((_, k) => k !== i))}
                className="focus-ring ml-1 inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
          <button
            type="button"
            disabled={customColors.length >= MAX_PALETTE_COLORS}
            onClick={() => applyCustom([...customColors, "#ffffff"])}
            className="focus-ring inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-[13px] text-foreground hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add color
          </button>
        </div>
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          Edits crossfade live. Starting palettes also come from the URL: <code className="font-mono">?palette=ember</code> or{" "}
          <code className="font-mono">?colors=0b1026,2d3f8c,9db6ff</code>.
        </p>
      </fieldset>
    </div>
  );
}

export function Hero() {
  return (
    <PaletteDitherField palette="accent" pixelSize={3} scale={0.8} direction={-15} className="h-[460px] w-full rounded-2xl">
      <div className="pointer-events-none flex h-full flex-col items-start justify-center gap-4 p-10">
        <p className="rounded-full bg-white/90 px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-[#11307f] uppercase">Studio pieces</p>
        <h3 className="max-w-lg text-[clamp(1.9rem,4.5vw,3.25rem)] leading-[1.04] font-semibold tracking-tight text-white [text-shadow:0_2px_24px_rgb(8_21_54/0.6)]">
          Waves in five shades of blue.
        </h3>
      </div>
    </PaletteDitherField>
  );
}

export function Default() {
  return <PaletteDitherField className="w-full rounded-2xl" />;
}
