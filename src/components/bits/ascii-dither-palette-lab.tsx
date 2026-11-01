"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DitherAlgo = "bayer8" | "atkinson" | "linesH" | "halftone";
type PaletteName = "pico8" | "c64" | "cga1" | "cyberpunk" | "gameboy" | "sepia";

interface DitherRecipe {
  slug: string;
  name: string;
  algo: DitherAlgo;
  palette: PaletteName;
  scale: number;
  contrast: number;
  threshold: number;
}

// Reconstructed from ascii-magic.com/recipes + 3h-myp5srmnc2.js (0x7550..0x8c00)
const PALETTES: Record<PaletteName, [number, number, number][]> = {
  pico8: [
    [0, 0, 0], [29, 43, 83], [126, 37, 83], [0, 135, 81],
    [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232],
    [255, 0, 77], [255, 163, 0], [255, 236, 39], [0, 228, 54],
    [41, 173, 255], [131, 118, 156], [255, 119, 168], [255, 204, 170],
  ],
  c64: [
    [0, 0, 0], [255, 255, 255], [136, 0, 0], [170, 255, 238],
    [204, 68, 204], [0, 204, 85], [0, 0, 170], [238, 238, 119],
    [221, 136, 85], [102, 68, 0], [255, 119, 119], [51, 51, 51],
    [119, 119, 119], [170, 255, 102], [0, 136, 255], [187, 187, 187],
  ],
  cga1: [
    [0, 0, 0],
    [85, 255, 255],
    [255, 85, 255],
    [255, 255, 255],
  ],
  cyberpunk: [
    [13, 2, 33],
    [255, 42, 109],
    [5, 217, 232],
    [209, 247, 255],
  ],
  gameboy: [
    [15, 56, 15],
    [48, 98, 48],
    [139, 172, 15],
    [155, 188, 15],
  ],
  sepia: [
    [43, 29, 14],
    [107, 79, 42],
    [176, 141, 87],
    [232, 216, 176],
  ],
};

// Recursive Bayer generator ea(8) from 3h-myp5srmnc2.js @ 0x7586
function buildBayer(n: number): number[][] {
  if (n === 1) return [[0]];
  const half = buildBayer(n / 2);
  const out = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let r = 0; r < n / 2; r++) {
    for (let c = 0; c < n / 2; c++) {
      const v = half[r][c];
      out[r][c] = 4 * v + 0;
      out[r][c + n / 2] = 4 * v + 2;
      out[r + n / 2][c] = 4 * v + 3;
      out[r + n / 2][c + n / 2] = 4 * v + 1;
    }
  }
  return out;
}

const BAYER8 = buildBayer(8);

// 8x8 Halftone cluster matrix el from 3h-myp5srmnc2.js @ 0x75f4
const HALFTONE8 = [
  [24, 10, 12, 26, 35, 47, 49, 37],
  [8, 0, 2, 14, 45, 59, 61, 51],
  [22, 6, 4, 16, 43, 57, 63, 53],
  [30, 20, 18, 28, 33, 41, 55, 39],
  [34, 46, 48, 36, 25, 11, 13, 27],
  [44, 58, 60, 50, 9, 1, 3, 15],
  [42, 56, 62, 52, 23, 7, 5, 17],
  [32, 40, 54, 38, 31, 21, 19, 29],
];

const DITHER_RECIPES: DitherRecipe[] = [
  {
    slug: "cumulus",
    name: "Cumulus (PICO-8)",
    algo: "bayer8",
    palette: "pico8",
    scale: 3,
    contrast: 1.46,
    threshold: 0.56,
  },
  {
    slug: "memento",
    name: "Memento (C64)",
    algo: "bayer8",
    palette: "c64",
    scale: 3,
    contrast: 1.18,
    threshold: 0.5,
  },
  {
    slug: "daybreak",
    name: "Daybreak (CGA Atkinson)",
    algo: "atkinson",
    palette: "cga1",
    scale: 3,
    contrast: 1.25,
    threshold: 0.46,
  },
  {
    slug: "bonsai",
    name: "Bonsai (LinesH)",
    algo: "linesH",
    palette: "cyberpunk",
    scale: 3,
    contrast: 1.5,
    threshold: 0.6,
  },
  {
    slug: "botanica",
    name: "Botanica (Halftone)",
    algo: "halftone",
    palette: "gameboy",
    scale: 3,
    contrast: 1.22,
    threshold: 0.5,
  },
  {
    slug: "sepia",
    name: "Sepia (Atkinson)",
    algo: "atkinson",
    palette: "sepia",
    scale: 3,
    contrast: 1.2,
    threshold: 0.5,
  },
];

// Euclidean RGB nearest palette color eh(r,g,b,pal) from 3h-myp5srmnc2.js @ 0x7ec5
function nearestColor(
  r: number,
  g: number,
  b: number,
  pal: [number, number, number][]
): [number, number, number] {
  let best = pal[0];
  let bestDist = Infinity;
  for (let i = 0; i < pal.length; i++) {
    const p = pal[i];
    const dr = r - p[0];
    const dg = g - p[1];
    const db = b - p[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function AsciiDitherPaletteLab({
  speed = 1,
  className,
}: {
  speed?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const speedRef = useRef(speed);
  const recipeRef = useRef(DITHER_RECIPES[0]);
  useEffect(() => {
    speedRef.current = speed;
    recipeRef.current = DITHER_RECIPES[activeIdx];
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return;

    let width = 0;
    let height = 0;
    let visible = true;
    let raf = 0;
    let time = 0;
    let last = performance.now();
    let mx = 0.5;
    let my = 0.5;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
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

      const rec = recipeRef.current;
      const pal = PALETTES[rec.palette];
      const scale = rec.scale;
      const gw = Math.max(1, Math.floor(width / scale));
      const gh = Math.max(1, Math.floor(height / scale));

      if (offscreen.width !== gw || offscreen.height !== gh) {
        offscreen.width = gw;
        offscreen.height = gh;
      }

      const img = offCtx.createImageData(gw, gh);
      const data = img.data;

      // 1. Synthesize animated chromatic plasma / sunset cloud field into RGB buffer
      for (let y = 0; y < gh; y++) {
        const ny = y / gh - 0.5;
        for (let x = 0; x < gw; x++) {
          const nx = (x / gw - 0.5) * (gw / gh);
          const dx = nx - (mx - 0.5) * (gw / gh);
          const dy = ny - (my - 0.5);
          const d = Math.hypot(dx, dy);

          const w1 = Math.sin(nx * 4.5 + time * 1.4) + Math.cos(ny * 4.0 - time * 1.1);
          const w2 = Math.sin((nx + ny) * 3.8 - time * 1.6);
          const sun = Math.exp(-d * 3.2) * 1.3;

          let r = 128 + 95 * Math.sin(w1 + sun + 0.2) + 45 * sun;
          let g = 115 + 90 * Math.sin(w1 + w2 * 0.7 + 1.4) + 30 * sun;
          let b = 140 + 98 * Math.cos(w2 - time * 0.8 + 2.6);

          r = (r - 128) * rec.contrast + 128;
          g = (g - 128) * rec.contrast + 128;
          b = (b - 128) * rec.contrast + 128;

          const i = (y * gw + x) * 4;
          data[i] = Math.max(0, Math.min(255, r));
          data[i + 1] = Math.max(0, Math.min(255, g));
          data[i + 2] = Math.max(0, Math.min(255, b));
          data[i + 3] = 255;
        }
      }

      // 2. Apply reconstructed renderDitherEngine (Ordered Bayer8 / Halftone / LinesH or Error-Diffusion Atkinson)
      const shift = Math.floor(time * 8);
      if (rec.algo === "atkinson") {
        // Bill Atkinson error diffusion kernel: 6 neighbors * 1/8 (from es.atkinson @ 0x7682)
        const neighbors = [
          [1, 0],
          [2, 0],
          [-1, 1],
          [0, 1],
          [1, 1],
          [0, 2],
        ];
        for (let y = 0; y < gh; y++) {
          for (let x = 0; x < gw; x++) {
            const i = (y * gw + x) * 4;
            const oldR = data[i];
            const oldG = data[i + 1];
            const oldB = data[i + 2];
            const [nr, ng, nb] = nearestColor(oldR, oldG, oldB, pal);
            data[i] = nr;
            data[i + 1] = ng;
            data[i + 2] = nb;

            const er = (oldR - nr) * 0.125;
            const eg = (oldG - ng) * 0.125;
            const eb = (oldB - nb) * 0.125;

            for (let k = 0; k < neighbors.length; k++) {
              const nx = x + neighbors[k][0];
              const ny = y + neighbors[k][1];
              if (nx >= 0 && nx < gw && ny < gh) {
                const ni = (ny * gw + nx) * 4;
                data[ni] = Math.max(0, Math.min(255, data[ni] + er));
                data[ni + 1] = Math.max(0, Math.min(255, data[ni + 1] + eg));
                data[ni + 2] = Math.max(0, Math.min(255, data[ni + 2] + eb));
              }
            }
          }
        }
      } else {
        for (let y = 0; y < gh; y++) {
          for (let x = 0; x < gw; x++) {
            const i = (y * gw + x) * 4;
            let bias = 0;
            if (rec.algo === "bayer8") {
              bias = (BAYER8[y & 7][(x + shift) & 7] / 64 - 0.5) * 68;
            } else if (rec.algo === "halftone") {
              bias = (HALFTONE8[y & 7][x & 7] / 64 - 0.5) * 76;
            } else if (rec.algo === "linesH") {
              bias = (((y + shift) % 4) / 4 - 0.5) * 84;
            }
            const [nr, ng, nb] = nearestColor(
              data[i] + bias,
              data[i + 1] + bias,
              data[i + 2] + bias,
              pal
            );
            data[i] = nr;
            data[i + 1] = ng;
            data[i + 2] = nb;
          }
        }
      }

      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, width, height);
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
        aria-label="ASCII Magic Dither & Retro Palette Lab"
      />

      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 pointer-events-auto">
          {DITHER_RECIPES.map((r, i) => (
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
      </div>
    </div>
  );
}
