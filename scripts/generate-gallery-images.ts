import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { galleryImages, type GalleryImage } from "../src/components/site/gallery-images";

/**
 * Renders the 24 original demo artworks in src/components/site/gallery-images.ts to
 * public/gallery/*.webp. Every image is a seeded SVG composition (gradients, shapes and
 * generated noise), so the output is reproducible: `bun run gallery:images`.
 */
const SIZE = 800;
const outDir = path.join(process.cwd(), "public", "gallery");

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

const grain = (opacity: number, seed: number) => `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seed}" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="${SIZE}" height="${SIZE}" filter="url(#grain)" opacity="${opacity}"/>`;

function mesh({ colors, seed }: GalleryImage, rnd: () => number) {
  const [bg, ...accents] = colors;
  const blobs = Array.from({ length: 6 }, (_, i) => {
    const color = accents[i % accents.length];
    const cx = Math.round(rnd() * SIZE);
    const cy = Math.round(rnd() * SIZE);
    const r = Math.round(SIZE * (0.35 + rnd() * 0.35));
    return `<radialGradient id="b${i}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${color}" stop-opacity="0.95"/>
        <stop offset="1" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
      <rect width="${SIZE}" height="${SIZE}" fill="url(#b${i})"/>`;
  });
  return `<rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>${blobs.join("")}${grain(0.1, seed)}`;
}

function bauhaus({ colors, seed }: GalleryImage, rnd: () => number) {
  const [bg, ...accents] = colors;
  const n = 4;
  const cell = SIZE / n;
  const pick = () => accents[Math.floor(rnd() * accents.length)];
  const tiles: string[] = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const x = col * cell;
      const y = row * cell;
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      const rot = Math.floor(rnd() * 4) * 90;
      const kind = Math.floor(rnd() * 6);
      const fill = pick();
      if (rnd() < 0.35) tiles.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${pick()}" opacity="0.9"/>`);
      const g = `transform="rotate(${rot} ${cx} ${cy})"`;
      if (kind === 0) tiles.push(`<circle cx="${cx}" cy="${cy}" r="${cell * 0.38}" fill="${fill}"/>`);
      else if (kind === 1) tiles.push(`<path ${g} d="M${x} ${cy} A${cell / 2} ${cell / 2} 0 0 1 ${x + cell} ${cy} Z" fill="${fill}"/>`);
      else if (kind === 2) tiles.push(`<path ${g} d="M${x} ${y} L${x + cell} ${y} A${cell} ${cell} 0 0 1 ${x} ${y + cell} Z" fill="${fill}"/>`);
      else if (kind === 3) tiles.push(`<path ${g} d="M${x} ${y} L${x + cell} ${y + cell} L${x} ${y + cell} Z" fill="${fill}"/>`);
      else if (kind === 4) tiles.push(`<rect x="${x + cell * 0.2}" y="${y + cell * 0.2}" width="${cell * 0.6}" height="${cell * 0.6}" rx="${cell * 0.08}" fill="${fill}"/>`);
      else tiles.push(`<circle cx="${cx}" cy="${cy}" r="${cell * 0.36}" fill="none" stroke="${fill}" stroke-width="${cell * 0.12}"/>`);
    }
  }
  return `<rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>${tiles.join("")}${grain(0.07, seed)}`;
}

function dunes({ colors, seed }: GalleryImage, rnd: () => number) {
  const [sky, ...bands] = colors;
  const sunX = Math.round(SIZE * (0.25 + rnd() * 0.5));
  const sunY = Math.round(SIZE * (0.3 + rnd() * 0.12));
  const layers = bands.map((color, i) => {
    const base = SIZE * (0.42 + i * 0.13);
    const amp = SIZE * (0.05 + rnd() * 0.05);
    const phase = rnd() * Math.PI * 2;
    const freq = 1 + rnd() * 1.5;
    let d = `M0 ${SIZE} L0 ${base.toFixed(1)}`;
    for (let s = 0; s <= 40; s++) {
      const x = (s / 40) * SIZE;
      const y = base + Math.sin((s / 40) * Math.PI * freq + phase) * amp + Math.sin((s / 40) * Math.PI * freq * 2.7 + phase * 1.3) * amp * 0.3;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return `<path d="${d} L${SIZE} ${SIZE} Z" fill="${color}"/>`;
  });
  return `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky}"/>
      <stop offset="1" stop-color="${bands[0]}"/>
    </linearGradient>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#sky)"/>
    <circle cx="${sunX}" cy="${sunY}" r="${SIZE * 0.11}" fill="#FFFFFF" opacity="0.85"/>
    ${layers.join("")}${grain(0.08, seed)}`;
}

function rings({ colors, seed }: GalleryImage, rnd: () => number) {
  const [bg, ...accents] = colors;
  const cx = SIZE * (0.3 + rnd() * 0.4);
  const cy = SIZE * (0.3 + rnd() * 0.4);
  const circles: string[] = [];
  let r = SIZE * 0.95;
  let i = 0;
  while (r > SIZE * 0.04) {
    circles.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${i % 2 ? bg : accents[(i >> 1) % accents.length]}"/>`);
    r -= SIZE * (0.035 + rnd() * 0.06);
    i++;
  }
  return `<rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>${circles.join("")}
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.18"/>
    </linearGradient>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#shade)"/>${grain(0.08, seed)}`;
}

function marble({ colors, seed }: GalleryImage, rnd: () => number) {
  // Flowing contour lines: stacked wavy strokes whose phase drifts line by line, like marbled paper.
  const [bg, c1, c2, c3, c4] = colors;
  const palette = [c1, c2, c3, c4];
  const lines: string[] = [];
  const count = 34;
  const waves = Array.from({ length: 3 }, () => ({ f: 1 + rnd() * 2.2, p: rnd() * Math.PI * 2, a: SIZE * (0.03 + rnd() * 0.06) }));
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const base = -SIZE * 0.1 + t * SIZE * 1.2;
    let d = "";
    for (let s = 0; s <= 48; s++) {
      const u = s / 48;
      let y = base;
      waves.forEach((w, k) => {
        y += Math.sin(u * Math.PI * w.f + w.p + t * (2.4 + k)) * w.a * (0.6 + 0.8 * Math.sin(t * Math.PI));
      });
      d += `${s ? " L" : "M"}${(u * SIZE).toFixed(1)} ${y.toFixed(1)}`;
    }
    const width = (2 + rnd() * 7).toFixed(1);
    lines.push(`<path d="${d}" fill="none" stroke="${palette[i % palette.length]}" stroke-width="${width}" stroke-linecap="round" opacity="${(0.55 + rnd() * 0.45).toFixed(2)}"/>`);
  }
  return `<linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="${c4}" stop-opacity="0.35"/>
    </linearGradient>
    <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#base)"/>
    ${lines.join("")}
    <radialGradient id="sheen" cx="0.3" cy="0.25" r="0.8">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#sheen)"/>
    ${grain(0.06, seed)}`;
}

function stripes({ colors, seed }: GalleryImage, rnd: () => number) {
  const [bg, ...accents] = colors;
  const bands: string[] = [];
  let x = -SIZE;
  let i = 0;
  while (x < SIZE * 2) {
    const w = SIZE * (0.04 + rnd() * 0.1);
    if (rnd() > 0.3) bands.push(`<rect x="${x.toFixed(1)}" y="${-SIZE}" width="${w.toFixed(1)}" height="${SIZE * 3}" fill="${accents[i % accents.length]}"/>`);
    x += w + SIZE * (0.01 + rnd() * 0.05);
    i++;
  }
  const ox = SIZE * (0.3 + rnd() * 0.4);
  const oy = SIZE * (0.3 + rnd() * 0.4);
  return `<rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
    <g transform="rotate(${-30 - Math.round(rnd() * 30)} ${SIZE / 2} ${SIZE / 2})">${bands.join("")}</g>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${SIZE * 0.06}"/></filter>
    <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="${SIZE * 0.2}" fill="${bg}" opacity="0.85" filter="url(#glow)"/>
    <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="${SIZE * 0.12}" fill="${accents[1]}" opacity="0.9"/>
    ${grain(0.08, seed)}`;
}

const painters = { mesh, bauhaus, dunes, rings, marble, stripes };

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const image of galleryImages) {
    const rnd = mulberry32(image.seed);
    const body = painters[image.kind](image, rnd);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${body}</svg>`;
    const file = path.join(process.cwd(), "public", image.src);
    await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(file);
    console.log(`${path.basename(file)}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
