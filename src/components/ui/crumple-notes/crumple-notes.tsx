"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type PointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { createGrid, createProgram, drawMesh, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { runCanvasLoop, type CanvasLoop } from "@/lib/glyph/canvas-loop";
import { GLSL_HASH, GLSL_SIMPLEX } from "@/lib/webgl/noise.glsl";

export interface CrumpleNote {
  id: string;
  title?: string;
  body: string;
  /** Photo for a polaroid-style note. */
  image?: string;
  date?: string;
}

export interface CrumpleNotesProps extends Omit<ComponentProps<"section">, "children"> {
  /** Notes; the active one lies flat in the middle, the rest are crumpled balls. @default four sample notes */
  notes?: CrumpleNote[];
  /** Controlled active note id. */
  activeId?: string;
  /** Initial active note when uncontrolled. @default the first note */
  defaultActiveId?: string;
  /** Called with the id of the note that unfolds. */
  onActiveChange?: (id: string) => void;
  /** Paper color. @default "#fbf7ee" */
  paperColor?: string;
  /** Ink color for handwriting. @default "#2b3a55" */
  inkColor?: string;
}

const SAMPLE: CrumpleNote[] = [
  { id: "launch", title: "Launch day", body: "Check the onboarding copy one more time. Bring snacks for the team. Don't touch prod after 4pm.", date: "Mon, 9 Nov" },
  { id: "idea", title: "Idea", body: "What if the hero was a desktop? Icons you can drag, windows you can open. Retro but in our colors.", date: "Thu, 5 Nov" },
  { id: "groceries", title: "Groceries", body: "Oat milk, lemons, coffee beans (the good ones), basil, rice, eggs, something sweet.", date: "Tue, 3 Nov" },
  { id: "call", title: "Call Maya", body: "About the spring presets. Ask if the bouncy one is too much for the progress bar.", date: "Sun, 1 Nov" },
];

const ASPECT = 1.22;
const TEX_W = 512;
const TEX_H = Math.round(TEX_W * ASPECT);
const GRID = 48;
const HAND = "var(--font-hand), 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive";

/* ------------------------------------------------------------------ shaders */

const FOLDS = /* glsl */ `
vec2 foldDir(float seed, int i) {
  float fi = float(i);
  return normalize(vec2(sin(seed * 1.7 + fi * 2.1), cos(seed * 1.3 + fi * 1.7)));
}`;

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_canvas;
uniform vec2 u_center;
uniform vec2 u_size;
uniform float u_scale;
uniform float u_rot;
uniform float u_tilt;
uniform float u_crumple;
uniform float u_seed;
out vec2 v_uv;
out vec3 v_pos;
${GLSL_HASH}${GLSL_SIMPLEX}${FOLDS}
vec3 rotZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }
vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
void main() {
  vec2 uv = a_pos;
  v_uv = uv;
  vec3 flatPos = vec3((uv - 0.5) * u_size, 0.0);
  // Edges give way first, with a little noise so the crumple isn't perfectly even.
  float edge = length(uv - 0.5) * 1.414;
  float c = clamp(u_crumple * 1.4 - (1.0 - edge) * 0.4 + snoise(uv * 3.0 + u_seed) * 0.08, 0.0, 1.0);
  c = c * c * (3.0 - 2.0 * c);
  // Folding: ridges along a few random lines, strongest midway.
  float folds = 0.0;
  for (int i = 0; i < 4; i++) folds += abs(fract(dot(uv, foldDir(u_seed, i)) * (2.5 + float(i)) + u_seed) - 0.5);
  float side = min(u_size.x, u_size.y);
  vec3 mid = flatPos + vec3(0.0, 0.0, (folds - 1.0) * side * 0.32 * sin(c * 3.14159));
  // The ball: the sheet wrapped onto a lumpy sphere.
  float lon = (uv.x - 0.5) * 6.0;
  float lat = (uv.y - 0.5) * 2.9;
  vec3 ball = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon)) * side * 0.24;
  ball *= 1.0 + snoise(uv * 5.0 + u_seed * 3.1) * 0.2 + snoise(uv * 11.0 - u_seed) * 0.05;
  vec3 p = mix(mix(flatPos, mid, smoothstep(0.0, 0.6, c)), ball, smoothstep(0.35, 1.0, c)) * u_scale;
  p = rotY(rotX(rotZ(p, u_rot), u_tilt * 0.7), u_tilt);
  v_pos = p;
  vec3 world = vec3(u_center, 0.0) + p;
  float persp = 1600.0 / (1600.0 - world.z);
  vec2 sp = (world.xy - u_canvas * 0.5) * persp + u_canvas * 0.5;
  gl_Position = vec4(sp.x / u_canvas.x * 2.0 - 1.0, 1.0 - sp.y / u_canvas.y * 2.0, -world.z / 4000.0, 1.0);
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
in vec3 v_pos;
uniform sampler2D u_tex;
uniform float u_crease;
uniform float u_seed;
out vec4 outColor;
${FOLDS}
void main() {
  // Facet normals from screen-space derivatives make every fold catch the light.
  vec3 n = normalize(cross(dFdx(v_pos), dFdy(v_pos)));
  if (n.z < 0.0) n = -n;
  float light = 0.64 + 0.42 * max(dot(n, normalize(vec3(-0.45, -0.55, 0.75))), 0.0);
  // Faint crease lines left behind once a note has been crumpled and opened again.
  float creases = 0.0;
  for (int i = 0; i < 4; i++) {
    float x = fract(dot(v_uv, foldDir(u_seed, i)) * (2.5 + float(i)) + u_seed);
    creases += smoothstep(0.006, 0.0, min(abs(x - 0.5), min(x, 1.0 - x)));
  }
  vec4 paper = texture(u_tex, v_uv);
  outColor = vec4(paper.rgb * min(light, 1.04) * (1.0 - min(creases, 1.0) * u_crease * 0.09), 1.0);
}`;

/* ------------------------------------------------------------------ paper texture */

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws a note the same way the DOM note lays it out, so the swap between them doesn't jump. */
function paintNote(canvas: HTMLCanvasElement, note: CrumpleNote, paper: string, ink: string, family: string, photo: HTMLImageElement | null) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const pad = w * 0.09;
  ctx.fillStyle = note.image ? "#ffffff" : paper;
  ctx.fillRect(0, 0, w, h);
  // Paper grain.
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(80, 60, 30, ${0.015 + ((i * 37) % 7) * 0.004})`;
    ctx.fillRect((i * 97.13) % w, (i * 53.71) % h, 2, 2);
  }
  let y = pad;
  if (note.image) {
    const ih = (w - pad * 2) * 0.72;
    ctx.fillStyle = "#e7e3da";
    ctx.fillRect(pad, pad, w - pad * 2, ih);
    if (photo?.complete && photo.naturalWidth) {
      const s = Math.max((w - pad * 2) / photo.naturalWidth, ih / photo.naturalHeight);
      const dw = photo.naturalWidth * s;
      const dh = photo.naturalHeight * s;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad, pad, w - pad * 2, ih);
      ctx.clip();
      ctx.drawImage(photo, pad + (w - pad * 2 - dw) / 2, pad + (ih - dh) / 2, dw, dh);
      ctx.restore();
    }
    y = pad + ih + pad * 0.5;
  } else {
    // Ruled lines.
    ctx.strokeStyle = "rgba(37, 99, 235, 0.16)";
    ctx.lineWidth = 2;
    for (let ly = h * 0.24; ly < h - pad; ly += w * 0.088) {
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(w, ly);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(220, 38, 38, 0.22)";
    ctx.beginPath();
    ctx.moveTo(pad * 0.7, 0);
    ctx.lineTo(pad * 0.7, h);
    ctx.stroke();
  }
  ctx.fillStyle = ink;
  ctx.textBaseline = "top";
  if (note.title) {
    ctx.font = `700 ${w * 0.1}px ${family}`;
    ctx.fillText(note.title, pad, y);
    y += w * 0.13;
  }
  ctx.font = `400 ${w * (note.image ? 0.068 : 0.072)}px ${family}`;
  for (const line of wrap(ctx, note.body, w - pad * 2).slice(0, note.image ? 2 : 8)) {
    ctx.fillText(line, pad, y);
    y += w * 0.088;
  }
  if (note.date) {
    ctx.globalAlpha = 0.6;
    ctx.font = `400 ${w * 0.06}px ${family}`;
    ctx.fillText(note.date, pad, h - pad - w * 0.06);
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------------ creases */

const seedOf = (index: number) => 1.3 + index * 2.17;

/** The fold lines the shader uses (where fract(dot(uv, d) * k + seed) is 0 or ½), as segments in uv space. */
function creaseSegments(seed: number) {
  const out: [number, number, number, number][] = [];
  for (let i = 0; i < 4; i++) {
    const dx = Math.sin(seed * 1.7 + i * 2.1);
    const dy = Math.cos(seed * 1.3 + i * 1.7);
    const len = Math.hypot(dx, dy) || 1;
    const d = [dx / len, dy / len];
    const k = 2.5 + i;
    for (let n = -20; n <= 20; n++) {
      const c = (n / 2 - seed) / k;
      // Clip the line d·p = c to the unit square.
      const pts: [number, number][] = [];
      if (Math.abs(d[1]) > 1e-6) for (const x of [0, 1]) pts.push([x, (c - d[0] * x) / d[1]]);
      if (Math.abs(d[0]) > 1e-6) for (const y of [0, 1]) pts.push([(c - d[1] * y) / d[0], y]);
      const inside = pts.filter(([x, y]) => x >= -1e-6 && x <= 1 + 1e-6 && y >= -1e-6 && y <= 1 + 1e-6);
      if (inside.length >= 2) out.push([inside[0][0], inside[0][1], inside[1][0], inside[1][1]]);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ scene */

interface Sheet {
  x: number;
  y: number;
  scale: number;
  rot: number;
  crumple: number;
  crease: number;
  from: { x: number; y: number; scale: number; rot: number; crumple: number };
  to: { x: number; y: number; scale: number; rot: number; crumple: number };
  start: number;
  length: number;
  seed: number;
  texture: WebGLTexture | null;
  dragging: boolean;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Notes that crumple into paper balls and unfold again. The active note lies flat in the middle,
 * flanked by crumpled balls with handwriting on them; clicking a ball unfolds it while the current
 * note crumples and rolls aside, and throwing the flat note crumples it too. Each sheet is a 48×48
 * WebGL mesh blended from flat, through folds, to a lumpy sphere, lit per facet so the creases read,
 * and faint crease lines stay on a note once it has been crumpled. Without WebGL2 (or under reduced
 * motion) it crossfades between a flat note and CSS paper balls.
 */
export function CrumpleNotes({ notes = SAMPLE, activeId, defaultActiveId, onActiveChange, paperColor = "#fbf7ee", inkColor = "#2b3a55", className, ...props }: CrumpleNotesProps) {
  const [internal, setInternal] = useState(defaultActiveId ?? notes[0]?.id);
  // Every note but the first one shown starts as a ball, so it keeps creases once unfolded.
  const [firstActive] = useState(activeId ?? defaultActiveId ?? notes[0]?.id);
  const [crumpled, setCrumpled] = useState<ReadonlySet<string>>(() => new Set());
  const active = activeId ?? internal;
  const activeIndex = Math.max(0, notes.findIndex((n) => n.id === active));
  const [mode, setMode] = useState<"idle" | "webgl" | "fallback">("idle");
  const [size, setSize] = useState({ w: 720, h: 480 });
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noteRef = useRef<HTMLElement>(null);
  const scene = useRef({ sheets: [] as Sheet[], order: [] as number[], loop: null as CanvasLoop | null, time: 0, active: activeIndex, drag: null as null | { x: number; y: number; t: number; vx: number; vy: number; ox: number; oy: number } });
  const liveId = useId();
  const notesKey = notes.map((n) => `${n.id}:${n.title ?? ""}:${n.body}:${n.image ?? ""}:${n.date ?? ""}`).join("|");

  const select = (id: string) => {
    if (id === active) return;
    if (active) setCrumpled((prev) => new Set(prev).add(active));
    if (activeId === undefined) setInternal(id);
    onActiveChange?.(id);
  };

  /* ---------------------------------------------------------- layout */

  const noteW = Math.round(Math.min(280, size.w * (size.w < 520 ? 0.62 : 0.38)));
  const noteH = Math.round(noteW * ASPECT);
  const narrow = size.w < 520;
  const center = { x: size.w / 2, y: narrow ? noteH / 2 + 24 : size.h / 2 - 8 };
  const slots = (narrow
    ? [
        { x: size.w * 0.2, y: noteH + 90 },
        { x: size.w * 0.4, y: noteH + 100 },
        { x: size.w * 0.6, y: noteH + 92 },
        { x: size.w * 0.8, y: noteH + 102 },
      ]
    : (() => {
        // Two balls on each side, stacked, in the space beside the note.
        const side = Math.max(noteW * 0.42, Math.min(noteW * 0.95, (size.w - noteW) / 4 + noteW * 0.42));
        return [
          { x: center.x - noteW / 2 - side * 0.55, y: center.y + noteH * 0.24 },
          { x: center.x + noteW / 2 + side * 0.55, y: center.y + noteH * 0.2 },
          { x: center.x - noteW / 2 - side * 0.7, y: center.y - noteH * 0.2 },
          { x: center.x + noteW / 2 + side * 0.72, y: center.y - noteH * 0.22 },
        ];
      })()
  ).map((s) => ({ x: Math.min(size.w - 40, Math.max(40, s.x)), y: Math.min(size.h - 40, s.y) }));
  // Balls in slot order: the notes after the active one, wrapping around.
  const balls = notes.map((_, i) => i).filter((i) => i !== activeIndex);
  const geometry = useRef({ center, slots, noteW, noteH });
  useEffect(() => {
    geometry.current = { center, slots, noteW, noteH };
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry?.contentRect;
      if (r) setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  /* ---------------------------------------------------------- WebGL */

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let gl: WebGL2RenderingContext | null = null;
    let program: Program | null = null;
    let mesh: Mesh | null = null;
    let disposed = false;
    let loop: CanvasLoop | null = null;
    const s = scene.current;
    const photos = new Map<string, HTMLImageElement>();

    // Decide on the next frame, outside the effect body.
    const boot = requestAnimationFrame(() => {
      if (disposed) return;
      gl = media.matches ? null : canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true });
      const info = gl?.getExtension("WEBGL_debug_renderer_info");
      const renderer = gl ? String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : "";
      if (!gl || /swiftshader|llvmpipe|softpipe|software/i.test(renderer)) return setMode("fallback");
      try {
        program = createProgram(gl, VERT, FRAG);
        mesh = createGrid(gl, GRID, GRID);
      } catch {
        return setMode("fallback");
      }
      const family = getComputedStyle(noteRef.current ?? stage).fontFamily || "cursive";
      const upload = (sheet: Sheet, note: CrumpleNote) => {
        if (!gl) return;
        const paper = document.createElement("canvas");
        paper.width = TEX_W;
        paper.height = TEX_H;
        paintNote(paper, note, paperColor, inkColor, family, photos.get(note.id) ?? null);
        sheet.texture ??= gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, sheet.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paper);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      const g = geometry.current;
      s.active = scene.current.active;
      s.sheets = notes.map((note, i) => {
        const isActive = i === s.active;
        const slot = g.slots[notes.map((_, k) => k).filter((k) => k !== s.active).indexOf(i)] ?? g.center;
        const at = isActive ? { x: g.center.x, y: g.center.y, scale: 1, rot: 0, crumple: 0 } : { x: slot.x, y: slot.y, scale: 0.62, rot: i * 1.3, crumple: 1 };
        return { ...at, crease: isActive ? 0 : 0.8, from: at, to: at, start: 0, length: 0, seed: seedOf(i), texture: null, dragging: false };
      });
      s.sheets.forEach((sheet, i) => upload(sheet, notes[i]));
      // Photos repaint their sheet once loaded.
      notes.forEach((note, i) => {
        if (!note.image) return;
        const img = new Image();
        img.decoding = "async";
        img.onload = () => !disposed && upload(s.sheets[i], note);
        img.src = note.image;
        photos.set(note.id, img);
      });
      // Repaint once the handwriting font arrives.
      document.fonts?.ready.then(() => !disposed && s.sheets.forEach((sheet, i) => upload(sheet, notes[i])));
      setMode("webgl");

      loop = runCanvasLoop({
        host: stage,
        canvas,
        resize: (frame) => gl?.viewport(0, 0, Math.round(frame.width * frame.dpr), Math.round(frame.height * frame.dpr)),
        render: (frame) => {
          if (!gl || !program || !mesh) return;
          s.time = frame.time;
          const now = frame.time;
          const geo = geometry.current;
          // Advance tweens.
          let settled = true;
          s.sheets.forEach((sheet) => {
            if (sheet.dragging) return;
            const t = sheet.length ? Math.min(1, (now - sheet.start) / sheet.length) : 1;
            const k = smooth(t);
            sheet.x = sheet.from.x + (sheet.to.x - sheet.from.x) * k;
            sheet.y = sheet.from.y + (sheet.to.y - sheet.from.y) * k;
            sheet.scale = sheet.from.scale + (sheet.to.scale - sheet.from.scale) * k;
            sheet.rot = sheet.from.rot + (sheet.to.rot - sheet.from.rot) * k;
            sheet.crumple = sheet.from.crumple + (sheet.to.crumple - sheet.from.crumple) * Math.min(1, t * 1.15);
            if (t < 1) settled = false;
          });
          // The DOM note covers the flat sheet while nothing moves.
          const flat = s.sheets[s.active];
          const showNote = settled && !s.drag && flat && flat.crumple < 0.01;
          if (noteRef.current) noteRef.current.style.opacity = showNote ? "1" : "0";
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.enable(gl.DEPTH_TEST);
          gl.useProgram(program.program);
          gl.uniform2f(program.u("u_canvas"), frame.width, frame.height);
          gl.uniform2f(program.u("u_size"), geo.noteW, geo.noteH);
          gl.activeTexture(gl.TEXTURE0);
          gl.uniform1i(program.u("u_tex"), 0);
          s.sheets.forEach((sheet, i) => {
            if (showNote && i === s.active) return;
            const wobble = frame.still ? 0 : Math.sin(now * 0.9 + sheet.seed) * (sheet.crumple > 0.5 ? 0.06 : 0.025);
            gl!.bindTexture(gl!.TEXTURE_2D, sheet.texture);
            gl!.uniform2f(program!.u("u_center"), sheet.x, sheet.y);
            gl!.uniform1f(program!.u("u_scale"), sheet.scale);
            gl!.uniform1f(program!.u("u_rot"), sheet.rot);
            gl!.uniform1f(program!.u("u_tilt"), wobble);
            gl!.uniform1f(program!.u("u_crumple"), sheet.crumple);
            gl!.uniform1f(program!.u("u_seed"), sheet.seed);
            gl!.uniform1f(program!.u("u_crease"), sheet.crease);
            drawMesh(gl!, mesh!);
          });
          // Contact shadows follow the sheets.
          stage.querySelectorAll<HTMLElement>("[data-shadow]").forEach((el, i) => {
            const sheet = s.sheets[i];
            if (!sheet) return;
            const w = (sheet.crumple > 0.5 ? geo.noteW * 0.5 : geo.noteW * 0.92) * sheet.scale;
            el.style.transform = `translate3d(${(sheet.x - w / 2).toFixed(1)}px, ${(sheet.y + (sheet.crumple > 0.5 ? geo.noteW * 0.2 : geo.noteH * 0.47) * sheet.scale).toFixed(1)}px, 0)`;
            el.style.width = `${w.toFixed(1)}px`;
          });
        },
      });
      s.loop = loop;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(boot);
      loop?.dispose();
      s.loop = null;
      const ctx = gl as WebGL2RenderingContext | null;
      if (ctx) {
        s.sheets.forEach((sheet) => sheet.texture && ctx.deleteTexture(sheet.texture));
        if (program) ctx.deleteProgram(program.program);
      }
      s.sheets = [];
    };
    // The scene is rebuilt only when the notes or colors change; `active` moves it via the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesKey, paperColor, inkColor]);

  // A new active note: it unfolds into the middle while the old one crumples into its slot.
  useEffect(() => {
    const s = scene.current;
    const prev = s.active;
    s.active = activeIndex;
    if (!s.sheets.length || prev === activeIndex) return;
    const g = geometry.current;
    const now = s.time;
    const order = notes.map((_, k) => k).filter((k) => k !== activeIndex);
    s.sheets.forEach((sheet, i) => {
      const slot = g.slots[order.indexOf(i)] ?? g.center;
      const isActive = i === activeIndex;
      sheet.from = { x: sheet.x, y: sheet.y, scale: sheet.scale, rot: sheet.rot, crumple: sheet.crumple };
      const roll = i === prev ? Math.sign(slot.x - sheet.x || 1) * 4 : 0;
      sheet.to = isActive ? { x: g.center.x, y: g.center.y, scale: 1, rot: 0, crumple: 0 } : { x: slot.x, y: slot.y, scale: 0.62, rot: sheet.rot + roll, crumple: 1 };
      sheet.start = now;
      sheet.length = i === prev || isActive ? 0.95 : 0.6;
      if (i === prev) sheet.crease = Math.max(sheet.crease, 0.8);
    });
    s.loop?.redraw();
  }, [activeIndex, notes]);

  // Positions follow resizes.
  useEffect(() => {
    const s = scene.current;
    const order = notes.map((_, k) => k).filter((k) => k !== s.active);
    s.sheets.forEach((sheet, i) => {
      if (sheet.length && s.time - sheet.start < sheet.length) return;
      const slot = i === s.active ? center : (slots[order.indexOf(i)] ?? center);
      const at = { x: slot.x, y: slot.y, scale: i === s.active ? 1 : 0.62, rot: sheet.rot, crumple: i === s.active ? 0 : 1 };
      Object.assign(sheet, at, { from: at, to: at });
    });
    s.loop?.redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  /* ---------------------------------------------------------- throwing the flat note */

  const onNoteDown = (event: PointerEvent<HTMLElement>) => {
    if (mode !== "webgl" || event.button !== 0 || (event.target as HTMLElement).closest("a, button")) return;
    scene.current.drag = { x: event.clientX, y: event.clientY, t: event.timeStamp, vx: 0, vy: 0, ox: event.clientX, oy: event.clientY };
  };
  const onNoteMove = (event: PointerEvent<HTMLElement>) => {
    const s = scene.current;
    const d = s.drag;
    const sheet = s.sheets[s.active];
    if (!d || !sheet) return;
    if (!sheet.dragging && Math.hypot(event.clientX - d.ox, event.clientY - d.oy) > 6) {
      sheet.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!sheet.dragging) return;
    const dt = Math.max(1, event.timeStamp - d.t) / 1000;
    d.vx = (event.clientX - d.x) / dt;
    d.vy = (event.clientY - d.y) / dt;
    d.x = event.clientX;
    d.y = event.clientY;
    d.t = event.timeStamp;
    const g = geometry.current;
    sheet.x = g.center.x + (event.clientX - d.ox);
    sheet.y = g.center.y + (event.clientY - d.oy);
    sheet.rot = (event.clientX - d.ox) * 0.0015;
    sheet.crumple = Math.min(0.25, Math.hypot(d.vx, d.vy) / 8000);
    s.loop?.redraw();
  };
  const onNoteUp = () => {
    const s = scene.current;
    const d = s.drag;
    s.drag = null;
    const sheet = s.sheets[s.active];
    if (!d || !sheet?.dragging) return;
    sheet.dragging = false;
    const g = geometry.current;
    const thrown = Math.hypot(d.vx, d.vy) > 900 || Math.hypot(sheet.x - g.center.x, sheet.y - g.center.y) > g.noteW * 0.55;
    if (thrown && notes.length > 1) {
      // Crumple it and bring up the next note.
      select(notes[(activeIndex + 1) % notes.length].id);
      return;
    }
    sheet.from = { x: sheet.x, y: sheet.y, scale: sheet.scale, rot: sheet.rot, crumple: sheet.crumple };
    sheet.to = { x: g.center.x, y: g.center.y, scale: 1, rot: 0, crumple: 0 };
    sheet.start = s.time;
    sheet.length = 0.45;
  };

  /* ---------------------------------------------------------- render */

  const current = notes[activeIndex];
  const paperStyle = { "--paper": paperColor, "--ink": inkColor, fontFamily: HAND } as CSSProperties;

  return (
    <section aria-label="Notes" className={cn("@container relative h-[480px] w-full overflow-hidden rounded-2xl bg-[#efece6]", className)} style={paperStyle} {...props}>
      <div ref={stageRef} className="absolute inset-0">
        {/* Contact shadows (moved by the WebGL loop). */}
        {mode === "webgl" ? notes.map((n) => <span key={n.id} data-shadow aria-hidden="true" className="pointer-events-none absolute top-0 left-0 h-5 rounded-[50%] bg-black/25 blur-md" />) : null}
        <canvas ref={canvasRef} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 size-full transition-opacity duration-300", mode === "webgl" ? "opacity-100" : "opacity-0")} />

        {/* The flat note, as real text. */}
        <AnimatePresence mode="popLayout" initial={false}>
          {current ? (
            <motion.article
              key={mode === "webgl" ? "note" : current.id}
              ref={(el) => {
                // Two notes can overlap while one exits; keep pointing at the one on screen.
                if (el) noteRef.current = el;
                else if (noteRef.current && !noteRef.current.isConnected) noteRef.current = null;
              }}
              aria-labelledby={`${liveId}-title`}
              initial={mode === "webgl" ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.base, ease: ease.out }}
              onPointerDown={onNoteDown}
              onPointerMove={onNoteMove}
              onPointerUp={onNoteUp}
              onPointerCancel={onNoteUp}
              className={cn(
                "absolute flex touch-none flex-col overflow-hidden text-[var(--ink)] shadow-[0_18px_30px_-16px_rgb(0_0_0/0.35)] select-none",
                mode === "webgl" ? "cursor-grab transition-opacity duration-150 active:cursor-grabbing" : "",
                current.image ? "bg-white" : "bg-[var(--paper)]",
              )}
              style={{
                left: center.x - noteW / 2,
                top: center.y - noteH / 2,
                width: noteW,
                height: noteH,
                padding: noteW * 0.09,
                // Same ruled lines and margin as the WebGL texture, so swapping between them doesn't jump.
                ...(current.image
                  ? {}
                  : {
                      backgroundImage: `linear-gradient(to right, transparent ${noteW * 0.063 - 1}px, rgb(220 38 38 / 0.22) ${noteW * 0.063 - 1}px, rgb(220 38 38 / 0.22) ${noteW * 0.063}px, transparent ${noteW * 0.063}px), repeating-linear-gradient(to bottom, transparent 0, transparent ${noteW * 0.088 - 1}px, rgb(37 99 235 / 0.16) ${noteW * 0.088 - 1}px, rgb(37 99 235 / 0.16) ${noteW * 0.088}px)`,
                      backgroundPosition: `0 0, 0 ${noteH * 0.24 - noteW * 0.088 + 1}px`,
                      backgroundRepeat: "no-repeat, repeat-y",
                      backgroundSize: `100% 100%, 100% ${noteW * 0.088}px`,
                    }),
              }}
            >
              {current.id !== firstActive || crumpled.has(current.id) ? (
                <svg aria-hidden="true" viewBox="0 0 1 1" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
                  {creaseSegments(seedOf(activeIndex)).map(([x1, y1, x2, y2], k) => (
                    <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(60 45 25 / 0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  ))}
                </svg>
              ) : null}
              {current.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
                <img src={current.image} alt="" draggable={false} className="relative aspect-[25/18] w-full object-cover" />
              ) : null}
              <h3 id={`${liveId}-title`} className="font-bold" style={{ fontSize: noteW * 0.1, lineHeight: `${noteW * 0.13}px`, marginTop: current.image ? noteW * 0.045 : 0 }}>
                {current.title ?? "Note"}
              </h3>
              <p className={current.image ? "line-clamp-2" : "line-clamp-[8]"} style={{ fontSize: noteW * (current.image ? 0.068 : 0.072), lineHeight: `${noteW * 0.088}px` }}>
                {current.body}
              </p>
              {current.date ? (
                <p className="mt-auto opacity-60" style={{ fontSize: noteW * 0.06 }}>
                  {current.date}
                </p>
              ) : null}
            </motion.article>
          ) : null}
        </AnimatePresence>

        {/* Crumpled balls: hit targets over the WebGL balls, or CSS paper balls without WebGL. */}
        {balls.map((index, k) => {
          const note = notes[index];
          const slot = slots[k] ?? center;
          const r = Math.round(noteW * 0.2);
          return (
            <button
              key={note.id}
              type="button"
              aria-label={`Unfold note: ${note.title ?? note.body.slice(0, 32)}`}
              onClick={() => select(note.id)}
              className={cn(
                "focus-ring absolute cursor-pointer rounded-full transition-transform hover:scale-105 motion-reduce:transition-none",
                mode === "webgl" ? "bg-transparent" : "shadow-[0_10px_18px_-8px_rgb(0_0_0/0.45)]",
              )}
              style={{
                left: slot.x - r,
                top: slot.y - r,
                width: r * 2,
                height: r * 2,
                ...(mode === "webgl"
                  ? {}
                  : {
                      background: `radial-gradient(circle at 34% 30%, #fff 0%, var(--paper) 38%, color-mix(in oklab, var(--paper) 72%, #7a6a55) 100%), var(--paper)`,
                      backgroundBlendMode: "multiply",
                    }),
              }}
            >
              {mode === "webgl" ? null : (
                <span aria-hidden="true" className="absolute inset-0 rounded-full opacity-60 [background:conic-gradient(from_20deg,transparent_0_8%,rgb(0_0_0/0.12)_9%_10%,transparent_11%_30%,rgb(0_0_0/0.1)_31%_32%,transparent_33%_55%,rgb(0_0_0/0.12)_56%_57%,transparent_58%_80%,rgb(0_0_0/0.1)_81%_82%,transparent_83%)]" />
              )}
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {current ? `Showing note ${activeIndex + 1} of ${notes.length}: ${current.title ?? ""}` : ""}
      </p>
      <p className="pointer-events-none absolute right-4 bottom-3 font-mono text-[11px] text-black/45">Click a paper ball to unfold it · throw the note to crumple it</p>
    </section>
  );
}
