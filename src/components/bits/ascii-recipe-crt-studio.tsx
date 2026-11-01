"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RecipePreset {
  slug: string;
  name: string;
  tags: string[];
  charPool: string;
  fontSize: number;
  contrast: number;
  invert?: boolean;
  overlayColor: string;
  bgColor: string;
  charBloom: number;
  charChroma: number;
  scanLines: number;
  crtCurve: number;
  vignette: number;
  filmGrain: number;
  delta: Record<string, unknown>;
}

// Reconstructed from ascii-magic.com/recipes RECIPES + 3h-myp5srmnc2.js STYLE_POOLS & drawCharFx
const CRT_RECIPES: RecipePreset[] = [
  {
    slug: "matrix",
    name: "Matrix",
    tags: ["01", "Phosphor", "CRT"],
    charPool: "01",
    fontSize: 11,
    contrast: 1.28,
    overlayColor: "#00ff66",
    bgColor: "#030805",
    charBloom: 0.75,
    charChroma: 1.5,
    scanLines: 0.38,
    crtCurve: 0.14,
    vignette: 0.48,
    filmGrain: 0.15,
    delta: {
      renderMode: "characters",
      fontSize: 10,
      charSet: "01",
      coverage: 96,
      contrast: 125,
      grayscale: 100,
      overlayColor: "#00ff66",
      overlayOpacity: 48,
      overlayBlend: "screen",
      pfx: {
        charBloom: { enabled: true, intensity: 70 },
        scanLines: { enabled: true, intensity: 38 },
        vignette: { enabled: true, intensity: 48 },
      },
    },
  },
  {
    slug: "lost-signal",
    name: "Lost Signal",
    tags: ["CRT", "Chromatic", "Amber"],
    charPool: "█▓▒░@#8%&*:;· ",
    fontSize: 13,
    contrast: 1.25,
    overlayColor: "#ff8a3c",
    bgColor: "#090503",
    charBloom: 0.65,
    charChroma: 3.6,
    scanLines: 0.44,
    crtCurve: 0.22,
    vignette: 0.52,
    filmGrain: 0.28,
    delta: {
      renderMode: "characters",
      fontSize: 26,
      contrast: 125,
      overlayColor: "#ff8a3c",
      overlayOpacity: 28,
      overlayBlend: "screen",
      pfx: {
        scanLines: { enabled: true, intensity: 44 },
        crtCurve: { enabled: true, intensity: 12 },
        chromatic: { enabled: true, offset: 5 },
        bloom: { enabled: true, intensity: 45 },
        vignette: { enabled: true, intensity: 50 },
      },
    },
  },
  {
    slug: "blueprint",
    name: "Blueprint",
    tags: ["Schematic", "Invert", "Edge"],
    charPool: "╋┼+×─│┌┐└┘· ",
    fontSize: 11,
    contrast: 1.22,
    invert: true,
    overlayColor: "#e2f1ff",
    bgColor: "#0d47a1",
    charBloom: 0.3,
    charChroma: 0,
    scanLines: 0.18,
    crtCurve: 0.05,
    vignette: 0.4,
    filmGrain: 0.22,
    delta: {
      renderMode: "characters",
      fontSize: 10,
      contrast: 118,
      edgeEmphasis: 0,
      invert: true,
      overlayColor: "#1e6fff",
      overlayOpacity: 48,
      overlayBlend: "multiply",
      pfx: {
        vignette: { enabled: true, intensity: 42 },
        filmGrain: { enabled: true, intensity: 24 },
      },
    },
  },
  {
    slug: "blue-hour",
    name: "Blue Hour",
    tags: ["Cross", "Scanlines", "Bloom"],
    charPool: "╋┼+×· ",
    fontSize: 12,
    contrast: 1.2,
    overlayColor: "#3ca6ff",
    bgColor: "#040812",
    charBloom: 0.7,
    charChroma: 2.0,
    scanLines: 0.4,
    crtCurve: 0.12,
    vignette: 0.48,
    filmGrain: 0.16,
    delta: {
      renderMode: "cross",
      contrast: 120,
      bgBlur: 2,
      grayscale: 30,
      overlayColor: "#3ca6ff",
      overlayOpacity: 40,
      overlayBlend: "screen",
      pfx: {
        charBloom: { enabled: true, intensity: 65 },
        vignette: { enabled: true, intensity: 48 },
        bloom: { enabled: true, intensity: 30 },
      },
    },
  },
  {
    slug: "golden-hour",
    name: "Golden Hour",
    tags: ["Diamond", "Gold", "Grain"],
    charPool: "⬥◆◇⋄· ",
    fontSize: 12,
    contrast: 1.22,
    overlayColor: "#e6b875",
    bgColor: "#0c0905",
    charBloom: 0.55,
    charChroma: 1.2,
    scanLines: 0.2,
    crtCurve: 0.08,
    vignette: 0.55,
    filmGrain: 0.24,
    delta: {
      renderMode: "diamond",
      fontSize: 12,
      contrast: 120,
      bgBlur: 2,
      overlayColor: "#d8a86a",
      overlayOpacity: 38,
      overlayBlend: "soft-light",
      grayscale: 22,
    },
  },
  {
    slug: "noir",
    name: "Noir",
    tags: ["B&W", "Film Dust", "Vignette"],
    charPool: "@#8X%S$t;:,. ",
    fontSize: 10,
    contrast: 1.4,
    overlayColor: "#f4f4f6",
    bgColor: "#050507",
    charBloom: 0.25,
    charChroma: 0.8,
    scanLines: 0.15,
    crtCurve: 0.06,
    vignette: 0.62,
    filmGrain: 0.36,
    delta: {
      renderMode: "characters",
      fontSize: 10,
      contrast: 135,
      grayscale: 100,
      bgBlur: 2,
      pfx: {
        vignette: { enabled: true, intensity: 60 },
        filmGrain: { enabled: true, intensity: 36 },
        filmDust: { enabled: true, density: 22 },
      },
    },
  },
];

function encodeRecipeV1(delta: Record<string, unknown>): string {
  const payload = JSON.stringify({ v: 1, ...delta });
  const b64 = typeof window !== "undefined" ? window.btoa(payload).replace(/=+$/, "") : "";
  return `recipe:v1:${b64}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export function AsciiRecipeCrtStudio({
  speed = 1,
  className,
}: {
  speed?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const speedRef = useRef(speed);
  const presetRef = useRef(CRT_RECIPES[0]);
  useEffect(() => {
    speedRef.current = speed;
    presetRef.current = CRT_RECIPES[activeIdx];
  });

  const copyRecipeCode = () => {
    const code = encodeRecipeV1(presetRef.current.delta);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = true;
    let raf = 0;
    let time = 0;
    let last = performance.now();
    let mx = 0.5;
    let my = 0.5;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = (e.clientX - rect.left) / Math.max(1, rect.width);
      my = (e.clientY - rect.top) / Math.max(1, rect.height);
    };
    canvas.addEventListener("pointermove", onMove, { passive: true });

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (!visible || width < 1) {
        last = now;
        return;
      }
      const dt = Math.min(0.1, ((now - last) / 1000) * speedRef.current);
      last = now;
      time += dt;

      const p = presetRef.current;
      const [or, og, ob] = hexToRgb(p.overlayColor);
      const cell = p.fontSize;
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const pool = p.charPool;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = p.bgColor;
      ctx.fillRect(0, 0, width, height);

      ctx.font = `600 ${cell}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < rows; r++) {
        const ny = (r / rows) * 2 - 1;
        for (let c = 0; c < cols; c++) {
          const nx = ((c / cols) * 2 - 1) * (width / height);

          // CRT Barrel Distortion (crtCurve)
          const r2 = nx * nx + ny * ny;
          const warp = 1 + p.crtCurve * r2;
          const wx = nx * warp;
          const wy = ny * warp;

          // Procedural 3D topological torus + cursor wave field as demo subject
          const dx = wx - (mx * 2 - 1) * (width / height);
          const dy = wy - (my * 2 - 1);
          const distCursor = Math.hypot(dx, dy);
          const ring1 = Math.sin(Math.hypot(wx, wy) * 5.2 - time * 2.2);
          const ring2 = Math.cos(wx * 3.4 + Math.sin(wy * 3.1 + time * 1.3));
          const ripple = Math.exp(-distCursor * 2.4) * Math.cos(distCursor * 12 - time * 4);

          let lum = (ring1 * 0.45 + ring2 * 0.35 + ripple * 0.5 + 0.5) * 0.5;
          lum = Math.pow(Math.max(0, Math.min(1, (lum - 0.5) * p.contrast + 0.5)), 1.1);
          if (p.invert) lum = 1 - lum;

          // Film grain modulation
          const grain = (Math.sin((c * 127.1 + r * 311.7 + Math.floor(time * 24) * 74.7)) * 0.5) * p.filmGrain * 0.25;
          lum = Math.max(0, Math.min(1, lum + grain));

          // Vignette attenuation
          const vig = Math.max(0, 1 - r2 * p.vignette * 0.48);
          lum *= vig;

          if (lum < 0.08) continue;

          const idx = Math.min(pool.length - 1, Math.floor((1 - lum) * pool.length));
          const ch = pool[idx];
          if (ch === " ") continue;

          const px = c * cell + cell * 0.5;
          const py = r * cell + cell * 0.5;

          // Reconstructed drawCharFx: charChroma RGB split + charBloom shadow
          if (p.charChroma > 0.5 && lum > 0.52) {
            const off = p.charChroma;
            ctx.fillStyle = `rgba(${or}, 40, 60, ${(lum * 0.55).toFixed(2)})`;
            ctx.fillText(ch, px - off, py);
            ctx.fillStyle = `rgba(40, ${og}, ${ob}, ${(lum * 0.55).toFixed(2)})`;
            ctx.fillText(ch, px + off, py);
          }

          if (p.charBloom > 0.2 && lum > 0.68) {
            ctx.shadowColor = p.overlayColor;
            ctx.shadowBlur = cell * p.charBloom;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fillStyle = `rgba(${or}, ${og}, ${ob}, ${Math.min(1, lum * 1.15).toFixed(2)})`;
          ctx.fillText(ch, px, py);
        }
      }
      ctx.shadowBlur = 0;

      // CRT Scanlines overlay
      if (p.scanLines > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(p.scanLines * 0.55).toFixed(2)})`;
        for (let y = 0; y < height; y += 3) {
          ctx.fillRect(0, y, width, 1);
        }
      }
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className={cn("relative h-full w-full overflow-hidden select-none", className)}>
      <canvas
        ref={canvasRef}
        className="h-full w-full block cursor-crosshair"
        aria-label="ASCII Magic Recipe CRT & Character Post-FX Studio"
      />

      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 pointer-events-auto">
          {CRT_RECIPES.map((r, i) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer",
                activeIdx === i
                  ? "bg-[#c8ff4d] text-black font-semibold"
                  : "text-zinc-300 hover:text-white"
              )}
            >
              {r.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={copyRecipeCode}
          className="px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black border border-white/15 text-[10px] font-mono text-[#5eead4] pointer-events-auto cursor-pointer transition"
        >
          {copied ? "Copied recipe:v1!" : "Copy recipe:v1"}
        </button>
      </div>
    </div>
  );
}
