import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { glyphSources, pixelScenes, studioPeople, studioProjects, type GlyphSourceImage, type PixelScene, type StudioPerson, type StudioProject } from "../src/components/site/studio-images";
import { orderedDither } from "../src/lib/glyph/bayer";
import { hexToRgb } from "../src/lib/color";

/**
 * Renders the original demo images for Studio Pieces & Glyph Art (#213–222) listed in
 * src/components/site/studio-images.ts into public/studio/: project stills, illustrated
 * portraits, grayscale glyph-map sources and dithered pixel scenes. Everything is seeded,
 * so the output is reproducible: `bun run studio:images`.
 */
const publicDir = path.join(process.cwd(), "public");

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

const grain = (width: number, height: number, opacity: number, seed: number) => `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="${width}" height="${height}" filter="url(#grain)" opacity="${opacity}"/>`;

const blur = (id: string, std: number) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${std}"/></filter>`;

/** A shaded sphere: highlight toward the top left, base color, darker rim. */
function sphere(id: string, cx: number, cy: number, r: number, light: string, base: string, shade: string) {
  return `<radialGradient id="${id}" cx="0.36" cy="0.3" r="0.78">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="0.45" stop-color="${base}"/>
      <stop offset="1" stop-color="${shade}"/>
    </radialGradient>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${id})"/>
    <ellipse cx="${f(cx - r * 0.32)}" cy="${f(cy - r * 0.42)}" rx="${f(r * 0.22)}" ry="${f(r * 0.13)}" fill="#ffffff" opacity="0.55" transform="rotate(-28 ${f(cx - r * 0.32)} ${f(cy - r * 0.42)})"/>`;
}

/** Studio sweep: a backdrop that curves into the floor. */
function sweep(w: number, h: number, top: string, floor: string, horizon = 0.62) {
  return `<linearGradient id="sweep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="${horizon - 0.08}" stop-color="${top}"/>
      <stop offset="${horizon + 0.08}" stop-color="${floor}"/>
      <stop offset="1" stop-color="${floor}"/>
    </linearGradient>
    <rect width="${w}" height="${h}" fill="url(#sweep)"/>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.18"/>
    </radialGradient>`;
}

/* ------------------------------------------------------------------ project stills */

const PW = 1200;
const PH = 750;

const projectPainters: Record<StudioProject["art"], (p: StudioProject, rnd: () => number) => string> = {
  bloom({ colors: [bg, light, base, shade, hi] }, rnd) {
    const cx = PW * 0.5;
    const cy = PH * 0.52;
    const petals = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + rnd() * 0.3;
      const d = 120 + rnd() * 30;
      return { x: cx + Math.cos(a) * d * 1.25, y: cy + Math.sin(a) * d * 0.55, r: 82 + rnd() * 26 };
    }).sort((a, b) => a.y - b.y);
    const spheres = petals.map((p, i) => sphere(`p${i}`, p.x, p.y, p.r, hi, light, base)).join("");
    return `${sweep(PW, PH, bg, "#f7cdb8")}
      ${blur("soft", 26)}
      <ellipse cx="${cx}" cy="${PH * 0.82}" rx="330" ry="48" fill="${shade}" opacity="0.28" filter="url(#soft)"/>
      ${spheres}
      ${sphere("core", cx, cy + 6, 96, hi, base, shade)}
      <rect width="${PW}" height="${PH}" fill="url(#vignette)"/>`;
  },
  glass({ colors: [bg, light, base, shade, hi] }, rnd) {
    const stems = Array.from({ length: 7 }, (_, i) => {
      const x = PW * (0.2 + i * 0.1 + (rnd() - 0.5) * 0.03);
      const top = PH * (0.22 + rnd() * 0.25);
      const r = 34 + rnd() * 34;
      return `<path d="M${f(x)} ${PH * 0.8} C ${f(x - 20)} ${f((top + PH * 0.8) / 2)}, ${f(x + 24)} ${f(top + 60)}, ${f(x)} ${f(top + r)}" stroke="${shade}" stroke-width="4" fill="none" opacity="0.55"/>
        <circle cx="${f(x)}" cy="${f(top)}" r="${f(r)}" fill="${light}" opacity="0.38"/>
        <circle cx="${f(x)}" cy="${f(top)}" r="${f(r)}" fill="none" stroke="${base}" stroke-width="3" opacity="0.8"/>
        <ellipse cx="${f(x - r * 0.35)}" cy="${f(top - r * 0.4)}" rx="${f(r * 0.28)}" ry="${f(r * 0.14)}" fill="${hi}" opacity="0.9" transform="rotate(-30 ${f(x - r * 0.35)} ${f(top - r * 0.4)})"/>
        <path d="M${f(x + r * 0.55)} ${f(top + r * 0.1)} A ${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(x - r * 0.1)} ${f(top + r * 0.72)}" stroke="${hi}" stroke-width="3" fill="none" opacity="0.7"/>`;
    });
    return `${sweep(PW, PH, bg, "#c4e3de", 0.7)}
      ${blur("soft", 22)}
      <rect x="${PW * 0.12}" y="${PH * 0.78}" width="${PW * 0.76}" height="34" rx="17" fill="${shade}" opacity="0.18" filter="url(#soft)"/>
      ${stems.join("")}
      <rect width="${PW}" height="${PH}" fill="url(#vignette)"/>`;
  },
  monolith({ colors: [bg, light, base, shade, hi] }) {
    const x = PW * 0.42;
    const y = PH * 0.16;
    const w = PW * 0.16;
    const h = PH * 0.66;
    return `${sweep(PW, PH, bg, "#ddd1bf", 0.74)}
      ${blur("soft", 18)}
      <path d="M${f(x + w)} ${f(y + h)} L ${f(x + w + 420)} ${f(y + h + 70)} L ${f(x + w + 330)} ${f(y + h + 96)} L ${f(x + 10)} ${f(y + h + 12)} Z" fill="${shade}" opacity="0.35" filter="url(#soft)"/>
      <linearGradient id="slab" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${hi}"/>
        <stop offset="0.35" stop-color="${light}"/>
        <stop offset="1" stop-color="${base}"/>
      </linearGradient>
      <rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(w * 0.48)}" fill="url(#slab)"/>
      <rect x="${f(x + w * 0.12)}" y="${f(y + 20)}" width="${f(w * 0.18)}" height="${f(h - 40)}" rx="${f(w * 0.09)}" fill="#ffffff" opacity="0.28"/>
      <rect width="${PW}" height="${PH}" fill="url(#vignette)"/>`;
  },
  orbit({ colors: [bg, light, base, shade, hi] }) {
    const cx = PW * 0.5;
    const cy = PH * 0.5;
    return `${sweep(PW, PH, bg, "#d3cff0", 0.68)}
      ${blur("soft", 30)}
      ${blur("beam", 40)}
      <path d="M ${PW * 0.62} 0 L ${PW * 0.9} 0 L ${PW * 0.7} ${PH} L ${PW * 0.38} ${PH} Z" fill="${hi}" opacity="0.5" filter="url(#beam)"/>
      <ellipse cx="${cx}" cy="${PH * 0.83}" rx="260" ry="40" fill="${shade}" opacity="0.3" filter="url(#soft)"/>
      <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${light}"/>
        <stop offset="0.5" stop-color="${base}"/>
        <stop offset="1" stop-color="${shade}"/>
      </linearGradient>
      <ellipse cx="${cx}" cy="${cy}" rx="250" ry="92" fill="none" stroke="url(#ring)" stroke-width="34" transform="rotate(-14 ${cx} ${cy})"/>
      ${sphere("planet", cx, cy, 118, hi, light, base)}
      <path d="M ${f(cx - 246)} ${f(cy + 40)} A 250 92 0 0 0 ${f(cx + 246)} ${f(cy - 40)}" fill="none" stroke="url(#ring)" stroke-width="34" transform="rotate(-14 ${cx} ${cy})"/>
      ${sphere("moon", cx + 300, cy - 150, 34, hi, light, base)}
      <rect width="${PW}" height="${PH}" fill="url(#vignette)"/>`;
  },
  ribbons({ colors: [bg, a, b, c, d] }, rnd) {
    const ribbons = Array.from({ length: 6 }, (_, i) => {
      const y = PH * (0.2 + i * 0.12);
      const amp = 90 + rnd() * 80;
      const color = [a, b, c, d][i % 4];
      const d1 = `M -100 ${f(y)} C ${f(PW * 0.3)} ${f(y - amp)}, ${f(PW * 0.55)} ${f(y + amp)}, ${PW + 100} ${f(y - amp * 0.3)}`;
      return `<path d="${d1}" stroke="${color}" stroke-width="${f(28 + rnd() * 40)}" fill="none" stroke-linecap="round" opacity="0.35" filter="url(#motion)"/>
        <path d="${d1}" stroke="${color}" stroke-width="${f(6 + rnd() * 14)}" fill="none" stroke-linecap="round" opacity="0.9"/>`;
    });
    return `<rect width="${PW}" height="${PH}" fill="${bg}"/>
      <filter id="motion" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="22 6"/></filter>
      <radialGradient id="glow" cx="0.7" cy="0.35" r="0.6"><stop offset="0" stop-color="${b}" stop-opacity="0.35"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></radialGradient>
      <rect width="${PW}" height="${PH}" fill="url(#glow)"/>
      ${ribbons.join("")}`;
  },
  streaks({ colors: [bg, a, b, c, d] }, rnd) {
    const lines = Array.from({ length: 90 }, () => {
      const y = rnd() * PH;
      const x = rnd() * PW * 1.2 - PW * 0.1;
      const len = 80 + rnd() * 420;
      const color = [a, b, c, d][Math.floor(rnd() * 4)];
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(len)}" height="${f(1 + rnd() * 3)}" rx="1.5" fill="${color}" opacity="${(0.25 + rnd() * 0.7).toFixed(2)}"/>`;
    });
    return `<rect width="${PW}" height="${PH}" fill="${bg}"/>
      ${blur("fog", 60)}
      <ellipse cx="${PW * 0.35}" cy="${PH * 0.55}" rx="380" ry="160" fill="${d}" opacity="0.5" filter="url(#fog)"/>
      <ellipse cx="${PW * 0.75}" cy="${PH * 0.35}" rx="280" ry="120" fill="${a}" opacity="0.35" filter="url(#fog)"/>
      <filter id="streak" x="-5%" y="-200%" width="110%" height="500%"><feGaussianBlur stdDeviation="8 1.2"/></filter>
      <g filter="url(#streak)">${lines.slice(0, 40).join("")}</g>
      ${lines.slice(40).join("")}`;
  },
  folds({ colors: [bg, mid, rust, slate, hi] }, rnd) {
    const shapes = Array.from({ length: 9 }, (_, i) => {
      const cx = PW * (0.12 + (i % 5) * 0.19 + (rnd() - 0.5) * 0.05);
      const cy = PH * (0.32 + Math.floor(i / 5) * 0.36 + (rnd() - 0.5) * 0.06);
      const s = 70 + rnd() * 50;
      const color = [hi, mid, rust, slate][Math.floor(rnd() * 4)];
      const p1 = `${f(cx - s)} ${f(cy + s * 0.6)}`;
      const p2 = `${f(cx)} ${f(cy - s)}`;
      const p3 = `${f(cx + s)} ${f(cy + s * 0.6)}`;
      const p4 = `${f(cx + s * 0.1)} ${f(cy + s * 0.25)}`;
      return `<path d="M${p1} L${p2} L${p4} Z" fill="${color}"/>
        <path d="M${p2} L${p3} L${p4} Z" fill="${color}"/>
        <path d="M${p2} L${p3} L${p4} Z" fill="#000" opacity="0.16"/>
        <path d="M${p1} L${p4} L${p3} Z" fill="#000" opacity="0.08"/>`;
    });
    return `<rect width="${PW}" height="${PH}" fill="${bg}"/>
      ${blur("soft", 14)}
      <g transform="translate(14 18)" opacity="0.18" filter="url(#soft)">${shapes.join("").replaceAll(/fill="#[0-9a-fA-F]{6}"/g, 'fill="#3b2a1a"')}</g>
      ${shapes.join("")}
      ${grain(PW, PH, 0.07, 3)}`;
  },
  loop({ colors: [bg, violet, pink, soft, cyan] }, rnd) {
    const vx = PW * 0.5;
    const vy = PH * 0.46;
    const lanes = Array.from({ length: 9 }, (_, i) => {
      const x = (i / 8) * PW * 2.4 - PW * 0.7;
      return `<line x1="${vx}" y1="${vy}" x2="${f(x)}" y2="${PH}" stroke="${i % 2 ? pink : cyan}" stroke-width="${i === 4 ? 0 : 2}" opacity="0.55"/>`;
    });
    const bokeh = Array.from({ length: 26 }, () => {
      const color = [violet, pink, soft, cyan][Math.floor(rnd() * 4)];
      return `<circle cx="${f(rnd() * PW)}" cy="${f(rnd() * PH * 0.5)}" r="${f(8 + rnd() * 36)}" fill="${color}" opacity="${(0.15 + rnd() * 0.35).toFixed(2)}"/>`;
    });
    return `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bg}"/>
        <stop offset="0.46" stop-color="${violet}"/>
        <stop offset="0.47" stop-color="#0c0618"/>
        <stop offset="1" stop-color="#1b0d33"/>
      </linearGradient>
      <rect width="${PW}" height="${PH}" fill="url(#sky)"/>
      ${blur("bokeh", 6)}
      <g filter="url(#bokeh)">${bokeh.join("")}</g>
      <circle cx="${vx}" cy="${vy}" r="70" fill="${pink}" opacity="0.6" filter="url(#bokeh)"/>
      ${lanes.join("")}
      <path d="M ${vx - 4} ${vy} L ${vx + 4} ${vy} L ${vx + 90} ${PH} L ${vx - 90} ${PH} Z" fill="${soft}" opacity="0.25"/>`;
  },
  flats({ colors: [sky, haze, ground, warm, ink] }) {
    return `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${haze}"/>
        <stop offset="0.55" stop-color="${sky}"/>
        <stop offset="0.6" stop-color="${warm}"/>
        <stop offset="0.6" stop-color="${sky}"/>
        <stop offset="1" stop-color="${ground}"/>
      </linearGradient>
      <rect width="${PW}" height="${PH}" fill="url(#sky)"/>
      ${blur("soft", 10)}
      <circle cx="${PW * 0.7}" cy="${PH * 0.52}" r="26" fill="#fffaf0" opacity="0.9" filter="url(#soft)"/>
      <ellipse cx="${PW * 0.7}" cy="${PH * 0.72}" rx="18" ry="60" fill="#fffaf0" opacity="0.35" filter="url(#soft)"/>
      <rect x="${PW * 0.31}" y="${PH * 0.565}" width="3" height="18" fill="${ink}"/>
      <circle cx="${PW * 0.31 + 1.5}" cy="${PH * 0.56}" r="3" fill="${ink}"/>
      ${grain(PW, PH, 0.06, 11)}`;
  },
  harbor({ colors: [deep, mid, light, lamp, ink] }, rnd) {
    const boats = Array.from({ length: 5 }, (_, i) => {
      const x = PW * (0.14 + i * 0.17 + (rnd() - 0.5) * 0.04);
      const y = PH * 0.66 + rnd() * 20;
      const w = 110 + rnd() * 70;
      return `<path d="M ${f(x)} ${f(y)} L ${f(x + w)} ${f(y)} L ${f(x + w * 0.86)} ${f(y + 26)} L ${f(x + w * 0.12)} ${f(y + 26)} Z" fill="${ink}"/>
        <rect x="${f(x + w * 0.46)}" y="${f(y - 150 - rnd() * 60)}" width="3" height="${f(150)}" fill="${ink}"/>
        <rect x="${f(x)}" y="${f(y + 34)}" width="${f(w)}" height="4" fill="${ink}" opacity="0.4"/>
        <circle cx="${f(x + w * 0.2)}" cy="${f(y - 6)}" r="3" fill="${lamp}"/>`;
    });
    const glints = Array.from({ length: 40 }, () => `<rect x="${f(rnd() * PW)}" y="${f(PH * 0.72 + rnd() * PH * 0.28)}" width="${f(20 + rnd() * 90)}" height="2" fill="${light}" opacity="${(0.15 + rnd() * 0.3).toFixed(2)}"/>`);
    return `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${ink}"/>
        <stop offset="0.4" stop-color="${deep}"/>
        <stop offset="0.66" stop-color="${mid}"/>
        <stop offset="0.67" stop-color="${deep}"/>
        <stop offset="1" stop-color="${ink}"/>
      </linearGradient>
      <rect width="${PW}" height="${PH}" fill="url(#sky)"/>
      <path d="M0 ${PH * 0.6} Q ${PW * 0.25} ${PH * 0.5} ${PW * 0.5} ${PH * 0.6} T ${PW} ${PH * 0.57} L ${PW} ${PH * 0.67} L 0 ${PH * 0.67} Z" fill="${deep}" opacity="0.9"/>
      ${glints.join("")}
      ${boats.join("")}
      ${grain(PW, PH, 0.07, 12)}`;
  },
  desert({ colors: [sky, lit, mid, shadow, hi] }, rnd) {
    const dunes = Array.from({ length: 5 }, (_, i) => {
      const base = PH * (0.38 + i * 0.13);
      const amp = 50 + rnd() * 40;
      const phase = rnd() * 6;
      let ridge = "";
      let top = `M -20 ${PH}`;
      for (let s = 0; s <= 30; s++) {
        const x = (s / 30) * (PW + 40) - 20;
        const y = base - Math.abs(Math.sin((s / 30) * Math.PI * 1.6 + phase)) * amp;
        ridge += `${s ? " L" : "M"}${f(x)} ${f(y)}`;
        top += ` L${f(x)} ${f(y)}`;
      }
      return `<path d="${top} L ${PW + 20} ${PH} Z" fill="${i % 2 ? lit : mid}"/>
        <path d="${top} L ${PW + 20} ${PH} Z" fill="${shadow}" opacity="${(0.12 + i * 0.07).toFixed(2)}" transform="translate(${f(30 + i * 10)} 14)"/>
        <path d="${ridge}" stroke="${hi}" stroke-width="2" fill="none" opacity="0.6"/>`;
    });
    return `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset="1" stop-color="${sky}"/></linearGradient>
      <rect width="${PW}" height="${PH}" fill="url(#sky)"/>
      ${dunes.join("")}
      ${grain(PW, PH, 0.06, 13)}`;
  },
  window({ colors: [wall, light, mid, shade, hi] }, rnd) {
    const leaves = Array.from({ length: 22 }, () => {
      const x = PW * (0.55 + rnd() * 0.3);
      const y = PH * (0.15 + rnd() * 0.5);
      return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(18 + rnd() * 22)}" ry="${f(6 + rnd() * 8)}" transform="rotate(${f(rnd() * 180)} ${f(x)} ${f(y)})" fill="${shade}" opacity="0.4"/>`;
    });
    return `<rect width="${PW}" height="${PH}" fill="${wall}"/>
      ${blur("soft", 8)}
      ${blur("softer", 16)}
      <g filter="url(#soft)">
        <path d="M ${PW * 0.3} ${PH * 0.08} L ${PW * 0.52} ${PH * 0.08} L ${PW * 0.6} ${PH * 0.62} L ${PW * 0.38} ${PH * 0.62} Z" fill="${light}"/>
        <path d="M ${PW * 0.56} ${PH * 0.08} L ${PW * 0.78} ${PH * 0.08} L ${PW * 0.86} ${PH * 0.62} L ${PW * 0.64} ${PH * 0.62} Z" fill="${light}"/>
        <rect x="${PW * 0.3}" y="${PH * 0.33}" width="${PW * 0.6}" height="12" fill="${wall}" transform="skewX(8)"/>
      </g>
      <g filter="url(#softer)">${leaves.join("")}</g>
      <rect x="0" y="${PH * 0.82}" width="${PW}" height="${PH * 0.18}" fill="${mid}"/>
      <rect x="0" y="${PH * 0.82}" width="${PW}" height="6" fill="${hi}" opacity="0.6"/>
      ${grain(PW, PH, 0.07, 14)}`;
  },
};

/* ------------------------------------------------------------------ portraits */

const AW = 600;
const AH = 750;

function shadeHex(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex);
  const k = (v: number) => Math.round(Math.min(255, Math.max(0, amount < 0 ? v * (1 + amount) : v + (255 - v) * amount)));
  return `#${[k(r), k(g), k(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function portrait(person: StudioPerson) {
  const { background: [bgTop, bgBottom], skin, hair, shirt, style, glasses } = person.look;
  const cx = AW / 2;
  const headY = 330;
  const skinShade = shadeHex(skin, -0.16);
  const hairHi = shadeHex(hair, 0.18);
  const shirtShade = shadeHex(shirt, -0.2);

  const hairBack: Record<string, string> = {
    long: `<path d="M ${cx - 150} ${headY - 20} Q ${cx - 170} ${headY + 200} ${cx - 130} ${headY + 260} L ${cx + 130} ${headY + 260} Q ${cx + 170} ${headY + 200} ${cx + 150} ${headY - 20} Z" fill="${hair}"/>`,
    bob: `<path d="M ${cx - 145} ${headY - 30} Q ${cx - 160} ${headY + 110} ${cx - 120} ${headY + 120} L ${cx + 120} ${headY + 120} Q ${cx + 160} ${headY + 110} ${cx + 145} ${headY - 30} Z" fill="${hair}"/>`,
    curly: Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return `<circle cx="${f(cx + Math.cos(a) * 135)}" cy="${f(headY - 20 + Math.sin(a) * 140)}" r="52" fill="${hair}"/>`;
    }).join(""),
  };
  const hairFront: Record<string, string> = {
    short: `<path d="M ${cx - 118} ${headY - 30} Q ${cx - 120} ${headY - 150} ${cx} ${headY - 150} Q ${cx + 125} ${headY - 150} ${cx + 118} ${headY - 30} Q ${cx + 60} ${headY - 95} ${cx - 118} ${headY - 30} Z" fill="${hair}"/>`,
    buzz: `<path d="M ${cx - 114} ${headY - 40} Q ${cx - 110} ${headY - 140} ${cx} ${headY - 142} Q ${cx + 110} ${headY - 140} ${cx + 114} ${headY - 40} Q ${cx} ${headY - 104} ${cx - 114} ${headY - 40} Z" fill="${hair}" opacity="0.85"/>`,
    bob: `<path d="M ${cx - 130} ${headY + 10} Q ${cx - 140} ${headY - 150} ${cx} ${headY - 150} Q ${cx + 140} ${headY - 150} ${cx + 130} ${headY + 10} Q ${cx + 100} ${headY - 70} ${cx + 10} ${headY - 80} Q ${cx - 60} ${headY - 60} ${cx - 130} ${headY + 10} Z" fill="${hair}"/>`,
    bun: `<circle cx="${cx}" cy="${headY - 175}" r="56" fill="${hair}"/><path d="M ${cx - 120} ${headY - 20} Q ${cx - 125} ${headY - 148} ${cx} ${headY - 148} Q ${cx + 125} ${headY - 148} ${cx + 120} ${headY - 20} Q ${cx + 40} ${headY - 110} ${cx - 120} ${headY - 20} Z" fill="${hair}"/>`,
    curly: Array.from({ length: 9 }, (_, i) => `<circle cx="${f(cx - 110 + i * 27.5)}" cy="${f(headY - 120 + Math.sin(i * 1.3) * 10)}" r="36" fill="${hair}"/>`).join(""),
    long: `<path d="M ${cx - 125} ${headY + 40} Q ${cx - 135} ${headY - 150} ${cx} ${headY - 152} Q ${cx + 135} ${headY - 150} ${cx + 125} ${headY + 40} Q ${cx + 110} ${headY - 70} ${cx + 20} ${headY - 95} Q ${cx - 70} ${headY - 70} ${cx - 125} ${headY + 40} Z" fill="${hair}"/>`,
    wavy: `<path d="M ${cx - 124} ${headY - 6} Q ${cx - 132} ${headY - 156} ${cx} ${headY - 156} Q ${cx + 132} ${headY - 156} ${cx + 124} ${headY - 6} Q ${cx + 112} ${headY - 52} ${cx + 92} ${headY - 70} Q ${cx + 70} ${headY - 52} ${cx + 46} ${headY - 82} Q ${cx + 20} ${headY - 62} ${cx - 6} ${headY - 88} Q ${cx - 34} ${headY - 64} ${cx - 60} ${headY - 86} Q ${cx - 88} ${headY - 58} ${cx - 104} ${headY - 70} Q ${cx - 118} ${headY - 50} ${cx - 124} ${headY - 6} Z" fill="${hair}"/>`,
    fringe: `<path d="M ${cx - 120} ${headY - 10} Q ${cx - 125} ${headY - 150} ${cx} ${headY - 150} Q ${cx + 125} ${headY - 150} ${cx + 120} ${headY - 10} L ${cx + 112} ${headY - 70} Q ${cx + 20} ${headY - 60} ${cx - 112} ${headY - 70} Z" fill="${hair}"/>`,
  };

  const eyes = [-1, 1]
    .map((side) => `<ellipse cx="${cx + side * 44}" cy="${headY + 4}" rx="8" ry="10" fill="#1d1a22"/><path d="M ${cx + side * 44 - 18} ${headY - 24} q 18 -9 36 0" stroke="${shadeHex(hair, -0.1)}" stroke-width="6" fill="none" stroke-linecap="round"/>`)
    .join("");
  const specs = glasses
    ? `<circle cx="${cx - 44}" cy="${headY + 4}" r="30" fill="none" stroke="#1d1a22" stroke-width="6"/><circle cx="${cx + 44}" cy="${headY + 4}" r="30" fill="none" stroke="#1d1a22" stroke-width="6"/><path d="M ${cx - 14} ${headY} q 14 -8 28 0" stroke="#1d1a22" stroke-width="6" fill="none"/>`
    : "";

  return `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBottom}"/></linearGradient>
    <rect width="${AW}" height="${AH}" fill="url(#bg)"/>
    <circle cx="${AW * 0.78}" cy="${AH * 0.2}" r="120" fill="#ffffff" opacity="0.25"/>
    ${hairBack[style] ?? ""}
    <path d="M ${cx - 230} ${AH} Q ${cx - 220} ${headY + 220} ${cx - 90} ${headY + 200} L ${cx + 90} ${headY + 200} Q ${cx + 220} ${headY + 220} ${cx + 230} ${AH} Z" fill="${shirt}"/>
    <path d="M ${cx - 230} ${AH} Q ${cx - 220} ${headY + 220} ${cx - 90} ${headY + 200} L ${cx - 60} ${AH} Z" fill="${shirtShade}" opacity="0.6"/>
    <rect x="${cx - 46}" y="${headY + 100}" width="92" height="120" rx="30" fill="${skinShade}"/>
    <path d="M ${cx - 70} ${headY + 200} Q ${cx} ${headY + 260} ${cx + 70} ${headY + 200}" fill="${skinShade}"/>
    <ellipse cx="${cx - 112}" cy="${headY + 14}" rx="20" ry="30" fill="${skinShade}"/>
    <ellipse cx="${cx + 112}" cy="${headY + 14}" rx="20" ry="30" fill="${skinShade}"/>
    <ellipse cx="${cx}" cy="${headY}" rx="112" ry="138" fill="${skin}"/>
    <ellipse cx="${cx + 40}" cy="${headY + 30}" rx="70" ry="100" fill="${skinShade}" opacity="0.25"/>
    ${eyes}
    <path d="M ${cx - 4} ${headY + 22} q 10 26 -4 34" stroke="${skinShade}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M ${cx - 30} ${headY + 76} q 30 22 60 0" stroke="#8c3b3b" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="${cx - 66}" cy="${headY + 54}" r="20" fill="#ff7a7a" opacity="0.18"/>
    <circle cx="${cx + 66}" cy="${headY + 54}" r="20" fill="#ff7a7a" opacity="0.18"/>
    ${specs}
    ${hairFront[style] ?? ""}
    <path d="M ${cx - 70} ${headY - 120} q 40 -24 90 -18" stroke="${hairHi}" stroke-width="8" fill="none" stroke-linecap="round" opacity="${style === "buzz" ? 0 : 0.6}"/>
    ${grain(AW, AH, 0.06, person.seed)}`;
}

/* ------------------------------------------------------------------ glyph sources */

const GW = 800;
const GH = 600;

function glyphSource({ art }: GlyphSourceImage, rnd: () => number) {
  if (art === "fish") {
    const bubbles = Array.from({ length: 7 }, () => `<circle cx="${f(GW * 0.12 + rnd() * 160)}" cy="${f(80 + rnd() * 200)}" r="${f(6 + rnd() * 16)}" fill="none" stroke="#7a7a7a" stroke-width="4"/>`);
    const stripes = [0.38, 0.5, 0.62].map((t) => `<path d="M ${f(GW * t)} ${GH * 0.24} Q ${f(GW * t - 30)} ${GH * 0.5} ${f(GW * t)} ${GH * 0.76}" stroke="#e8e8e8" stroke-width="26" fill="none" opacity="0.75"/>`);
    return `<radialGradient id="bg" cx="0.45" cy="0.4" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6d6d6"/></radialGradient>
      <rect width="${GW}" height="${GH}" fill="url(#bg)"/>
      <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1b1b"/><stop offset="0.6" stop-color="#555555"/><stop offset="1" stop-color="#9a9a9a"/></linearGradient>
      <path d="M ${GW * 0.62} ${GH * 0.32} L ${GW * 0.5} ${GH * 0.1} Q ${GW * 0.4} ${GH * 0.12} ${GW * 0.36} ${GH * 0.26} Z" fill="#2a2a2a"/>
      <path d="M ${GW * 0.78} ${GH * 0.5} L ${GW * 0.95} ${GH * 0.26} Q ${GW * 0.9} ${GH * 0.5} ${GW * 0.95} ${GH * 0.74} Z" fill="#333333"/>
      <path d="M ${GW * 0.16} ${GH * 0.52} Q ${GW * 0.3} ${GH * 0.16} ${GW * 0.6} ${GH * 0.26} Q ${GW * 0.78} ${GH * 0.34} ${GW * 0.82} ${GH * 0.5} Q ${GW * 0.78} ${GH * 0.68} ${GW * 0.58} ${GH * 0.76} Q ${GW * 0.3} ${GH * 0.84} ${GW * 0.16} ${GH * 0.52} Z" fill="url(#body)"/>
      <clipPath id="clip"><path d="M ${GW * 0.16} ${GH * 0.52} Q ${GW * 0.3} ${GH * 0.16} ${GW * 0.6} ${GH * 0.26} Q ${GW * 0.78} ${GH * 0.34} ${GW * 0.82} ${GH * 0.5} Q ${GW * 0.78} ${GH * 0.68} ${GW * 0.58} ${GH * 0.76} Q ${GW * 0.3} ${GH * 0.84} ${GW * 0.16} ${GH * 0.52} Z"/></clipPath>
      <g clip-path="url(#clip)">${stripes.join("")}</g>
      <path d="M ${GW * 0.44} ${GH * 0.62} L ${GW * 0.52} ${GH * 0.86} L ${GW * 0.56} ${GH * 0.7} Z" fill="#3a3a3a"/>
      <circle cx="${GW * 0.26}" cy="${GH * 0.46}" r="26" fill="#f4f4f4"/>
      <circle cx="${GW * 0.255}" cy="${GH * 0.46}" r="13" fill="#0b0b0b"/>
      <path d="M ${GW * 0.17} ${GH * 0.56} q 18 6 34 -2" stroke="#0b0b0b" stroke-width="5" fill="none"/>
      ${bubbles.join("")}`;
  }
  if (art === "bird") {
    // A songbird perched on a branch, in profile: bold, dark shapes that hold up as glyphs.
    const leaves = [
      [150, 455, -30],
      [215, 488, 25],
      [610, 470, -20],
      [680, 505, 30],
    ]
      .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="46" ry="18" transform="rotate(${r} ${x} ${y})" fill="#5c5c5c"/>`)
      .join("");
    return `<radialGradient id="bg" cx="0.55" cy="0.4" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dadada"/></radialGradient>
      <rect width="${GW}" height="${GH}" fill="url(#bg)"/>
      <path d="M 40 470 Q 300 430 520 452 T 780 440" stroke="#2a2a2a" stroke-width="22" fill="none" stroke-linecap="round"/>
      ${leaves}
      <linearGradient id="body" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#1a1a1a"/><stop offset="0.65" stop-color="#4a4a4a"/><stop offset="1" stop-color="#8c8c8c"/></linearGradient>
      <path d="M 520 300 L 660 250 L 668 282 L 540 352 Z" fill="#141414"/>
      <ellipse cx="415" cy="330" rx="150" ry="112" fill="url(#body)"/>
      <path d="M 330 300 Q 420 250 520 300 Q 470 360 360 360 Z" fill="#0f0f0f" opacity="0.75"/>
      <ellipse cx="395" cy="380" rx="92" ry="58" fill="#a8a8a8"/>
      <circle cx="285" cy="235" r="78" fill="#1c1c1c"/>
      <path d="M 212 222 L 150 238 L 214 252 Z" fill="#111111"/>
      <circle cx="262" cy="222" r="15" fill="#f4f4f4"/>
      <circle cx="259" cy="222" r="7" fill="#050505"/>
      <path d="M 395 436 L 385 462 M 440 436 L 446 462" stroke="#111111" stroke-width="9" stroke-linecap="round"/>`;
  }
  // Skyline.
  const layer = (count: number, baseY: number, minH: number, maxH: number, color: string, windows: boolean) => {
    let x = -20;
    const out: string[] = [];
    for (let i = 0; i < count && x < GW; i++) {
      const w = 40 + rnd() * 70;
      const h = minH + rnd() * (maxH - minH);
      out.push(`<rect x="${f(x)}" y="${f(baseY - h)}" width="${f(w)}" height="${f(h + 4)}" fill="${color}"/>`);
      if (windows) {
        for (let wy = baseY - h + 14; wy < baseY - 14; wy += 22) {
          for (let wx = x + 8; wx < x + w - 12; wx += 16) if (rnd() > 0.45) out.push(`<rect x="${f(wx)}" y="${f(wy)}" width="7" height="10" fill="#dcdcdc"/>`);
        }
      }
      x += w + rnd() * 8;
    }
    return out.join("");
  };
  return `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fafafa"/><stop offset="1" stop-color="#cfcfcf"/></linearGradient>
    <rect width="${GW}" height="${GH}" fill="url(#sky)"/>
    <circle cx="${GW * 0.6}" cy="${GH * 0.5}" r="130" fill="#ffffff"/>
    ${layer(20, GH * 0.78, 90, 200, "#a9a9a9", false)}
    ${layer(16, GH * 0.82, 70, 260, "#6b6b6b", false)}
    ${layer(14, GH * 0.86, 50, 190, "#262626", true)}
    <rect y="${GH * 0.86}" width="${GW}" height="${GH * 0.14}" fill="#3a3a3a"/>
    ${Array.from({ length: 18 }, () => `<rect x="${f(rnd() * GW)}" y="${f(GH * 0.88 + rnd() * GH * 0.1)}" width="${f(30 + rnd() * 80)}" height="3" fill="#9a9a9a"/>`).join("")}`;
}

/* ------------------------------------------------------------------ pixel scenes */

const SW = 96;
const SH = 64;
const SCALE = 5;

function pixelScene(scene: PixelScene, rnd: () => number) {
  const [skyTop, skyMid, glow, ridgeFar, ridgeNear, water] = scene.colors.map(hexToRgb);
  const sky = [skyTop, skyMid, glow];
  const shimmer = water.map((v, i) => Math.round((v + skyMid[i]) / 2));
  const data = Buffer.alloc(SW * SH * 3);
  const put = (x: number, y: number, [r, g, b]: number[]) => {
    if (x < 0 || y < 0 || x >= SW || y >= SH) return;
    const i = (y * SW + x) * 3;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  };
  const horizon = Math.round(SH * 0.62);
  const sun = { x: Math.round(SW * (0.25 + rnd() * 0.5)), y: Math.round(horizon * (0.45 + rnd() * 0.3)), r: 6 + Math.round(rnd() * 3) };
  const ridge = (x: number, base: number, amp: number, freq: number, phase: number) =>
    Math.round(base - Math.abs(Math.sin(x * freq + phase)) * amp - Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.35);
  const farPhase = rnd() * 6;
  const nearPhase = rnd() * 6;
  const far = Array.from({ length: SW }, (_, x) => ridge(x, horizon - 4, 14, 0.07, farPhase));
  const near = Array.from({ length: SW }, (_, x) => ridge(x, horizon + 1, 8, 0.11, nearPhase));
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      if (y < horizon) {
        // Sky: ordered-dither between neighboring bands, top to horizon.
        const p = (y / horizon) * (sky.length - 1);
        const band = Math.floor(p);
        put(x, y, sky[Math.min(sky.length - 1, band + orderedDither(p - band, x, y, 2))]);
      } else {
        // Water, with dithered ripples that catch the sky.
        const ripple = orderedDither(0.35 + Math.sin(y * 1.7 + x * 0.15) * 0.25, x, y, 2);
        put(x, y, ripple ? shimmer : water);
      }
    }
  }
  // Sun and its reflection.
  for (let y = -sun.r; y <= sun.r; y++) for (let x = -sun.r; x <= sun.r; x++) if (x * x + y * y <= sun.r * sun.r) put(sun.x + x, sun.y + y, glow);
  for (let y = horizon + 1; y < SH; y += 2) {
    const w = Math.max(1, Math.round(sun.r * (1 - (y - horizon) / (SH - horizon)) * 1.4));
    for (let x = -w; x <= w; x++) if (orderedDither(0.6, sun.x + x, y, 2)) put(sun.x + x, y, glow);
  }
  // Ridges, far then near.
  for (let x = 0; x < SW; x++) {
    for (let y = far[x]; y < horizon; y++) put(x, y, ridgeFar);
    for (let y = near[x]; y <= horizon; y++) put(x, y, ridgeNear);
  }
  return data;
}

/* ------------------------------------------------------------------ main */

async function writeSvg(svgBody: string, width: number, height: number, file: string, quality = 80) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgBody}</svg>`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).webp({ quality }).toFile(file);
  console.log(`${path.relative(publicDir, file).padEnd(36)} ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}

async function main() {
  for (const project of studioProjects) {
    await writeSvg(projectPainters[project.art](project, mulberry32(project.seed)), PW, PH, path.join(publicDir, project.src), 78);
  }
  for (const person of studioPeople) {
    await writeSvg(portrait(person), AW, AH, path.join(publicDir, person.portrait), 80);
  }
  for (const source of glyphSources) {
    await writeSvg(glyphSource(source, mulberry32(source.seed)), GW, GH, path.join(publicDir, source.src), 86);
  }
  for (const scene of pixelScenes) {
    const file = path.join(publicDir, scene.src);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp(pixelScene(scene, mulberry32(scene.seed)), { raw: { width: SW, height: SH, channels: 3 } })
      .resize(SW * SCALE, SH * SCALE, { kernel: "nearest" })
      .png({ palette: true, compressionLevel: 9 })
      .toFile(file);
    console.log(`${path.relative(publicDir, file).padEnd(36)} ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
