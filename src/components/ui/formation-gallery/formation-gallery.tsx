"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { GalleryA11y } from "@/lib/gallery/gallery-a11y";
import { chromeScheme } from "@/lib/gallery/gallery-chrome";
import { GalleryFallback } from "@/lib/gallery/gallery-fallback";
import { clamp, lerp, smoothstep, wrap } from "@/lib/gallery/math";
import type { GalleryCard } from "@/lib/gallery/renderer";
import type { GalleryHandle, GalleryItem } from "@/lib/gallery/types";
import { useGallery } from "@/lib/gallery/use-gallery";

export type Formation = "rings" | "spiral" | "globe" | "field";
export type FormationTransition = "gather" | "swirl" | "direct";

export interface FormationGalleryHandle extends GalleryHandle {
  /** Switches to a formation by name or by its position in `formations`. */
  setFormation: (formation: Formation | number) => void;
  /** Puts an open card back. */
  close: () => void;
}

export interface FormationGalleryProps {
  /** Photos on the cards; they repeat when there are more cards than items. */
  items: GalleryItem[];
  /** Headline or call to action kept in the empty center. It fades while a card is open. */
  children?: ReactNode;
  /** Number of cards, up to 160. @default 96 */
  count?: number;
  /** Formations to cycle through, in order. @default ["rings", "spiral", "globe", "field"] */
  formations?: Formation[];
  /** How cards travel between formations. @default "gather" */
  transition?: FormationTransition;
  /** Item the keyboard starts on. @default 0 */
  startIndex?: number;
  /** Move to the next formation every `interval`. @default true */
  autoplay?: boolean;
  /** Milliseconds per formation. @default 6500 */
  interval?: number;
  /** Concentric rings in the "rings" formation. @default 4 */
  rings?: number;
  /** Card size in px; 0 sizes cards to the stage and count. @default 0 */
  cardSize?: number;
  /** Empty center kept for children, as a fraction of the smaller side. @default 0.36 */
  clearance?: number;
  /** Rotation speed of rings, spiral and globe in degrees per second. @default 8 */
  spin?: number;
  /** Card shape: "auto" uses rounded squares in rings and spiral, circles in globe and field. @default "auto" */
  shape?: "auto" | "square" | "circle";
  /** Corner radius of square cards, px. @default 8 */
  cardRadius?: number;
  /** Tilts the whole formation toward the pointer, in degrees; 0 turns it off. @default 10 */
  tilt?: number;
  /** Scale of the card under the pointer. @default 1.6 */
  hoverScale?: number;
  /** Soft shadow strength, 0–1. @default 0.45 */
  shadow?: number;
  /** Ring around the hovered card. @default "#2563EB" */
  accentColor?: string;
  /** Click a card to enlarge it in the center with its caption. @default true */
  openOnClick?: boolean;
  /** Seed for the card order and the field layout. @default 7 */
  seed?: number;
  /** Hovering pauses autoplay and slows the spin. @default true */
  pauseOnHover?: boolean;
  /** Drag spins rings, spiral and globe, or pans the field, with inertia. @default true */
  draggable?: boolean;
  /** The wheel spins the formation (it then keeps the page from scrolling over the gallery). @default false */
  wheel?: boolean;
  /** Caption and close button under an open card. @default true */
  captions?: boolean;
  /** Formation buttons along the bottom. @default true */
  controls?: boolean;
  /** Background color; text switches to light on dark colors. @default "transparent" */
  backgroundColor?: string;
  /** Stops spin, drift and autoplay (input still works). @default false */
  paused?: boolean;
  /** Highest device pixel ratio rendered. @default 2 */
  dpr?: number;
  /** Accessible name of the gallery. @default "Photos" */
  ariaLabel?: string;
  /** Classes for the root, which fills its parent (at least 420px tall). */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
  /** Fires when the keyboard's active item changes. */
  onIndexChange?: (index: number) => void;
  /** Fires when a card opens. */
  onSelect?: (item: GalleryItem, index: number) => void;
  /** Fires when the formation changes. */
  onFormationChange?: (formation: Formation, index: number) => void;
  /** Fires when a card opens (with its item) or closes (null). */
  onOpen?: (item: GalleryItem | null, index: number) => void;
  /** Imperative `next()`, `previous()`, `goTo()`, `setFormation()` and `close()`. */
  ref?: Ref<FormationGalleryHandle>;
}

const ALL: Formation[] = ["rings", "spiral", "globe", "field"];
const LABELS: Record<Formation, string> = { rings: "Rings", spiral: "Spiral", globe: "Globe", field: "Field" };
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const MOVE = 1.35;
const STAGGER = 0.45;

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

function toRgb(color: string): [number, number, number] {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hex) return [0.145, 0.388, 0.922];
  const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

interface Spot {
  x: number;
  y: number;
  z: number;
  round: number;
  opacity: number;
  /** Cards that face the camera regardless of group tilt (globe). */
  billboard: boolean;
}

interface Stage {
  inner: number;
  outer: number;
  stretch: number;
  width: number;
  height: number;
  angle: number;
  panX: number;
  panY: number;
  time: number;
  size: number;
  count: number;
  ringCount: number;
  shape: "auto" | "square" | "circle";
  ringOf: Int32Array;
  slotOf: Int32Array;
  ringSizes: Int32Array;
  field: Float32Array;
}

const roundFor = (formation: Formation, shape: Stage["shape"]) => (shape === "circle" ? 1 : shape === "square" ? 0 : formation === "globe" || formation === "field" ? 1 : 0);

/** Fades cards that drift into the center clearance (front of the globe, a panned field). */
const clearanceFade = (x: number, y: number, inner: number, stretch: number) => smoothstep(inner * 0.72, inner * 1.05, Math.hypot(x / stretch, y));

/** Where card k sits in a formation right now. */
function spotFor(formation: Formation, k: number, s: Stage): Spot {
  const round = roundFor(formation, s.shape);
  if (formation === "rings") {
    const ring = s.ringOf[k];
    const n = s.ringSizes[ring];
    const radius = s.inner + s.size * 0.7 + (s.outer - s.inner - s.size * 0.7) * ((ring + 0.5) / s.ringCount);
    const direction = ring % 2 ? -1 : 1;
    const theta = (s.slotOf[k] / n) * Math.PI * 2 + s.angle * direction * (1 + ring * 0.18) + ring * 0.4;
    return { x: Math.cos(theta) * radius * s.stretch, y: Math.sin(theta) * radius, z: 0, round, opacity: 1, billboard: false };
  }
  if (formation === "spiral") {
    const theta = k * GOLDEN + s.angle * 0.6;
    const radius = s.inner + s.size * 0.6 + (s.outer - s.inner - s.size * 0.6) * Math.sqrt((k + 0.5) / s.count);
    return { x: Math.cos(theta) * radius * s.stretch, y: Math.sin(theta) * radius, z: 0, round, opacity: 1, billboard: false };
  }
  if (formation === "globe") {
    const g = Math.min(s.width, s.height) * 0.44;
    const y = 1 - ((k + 0.5) / s.count) * 2;
    const r = Math.sqrt(1 - y * y);
    const phi = k * GOLDEN + s.angle;
    let x = Math.cos(phi) * r;
    let z = Math.sin(phi) * r;
    // A slight forward tilt so the poles read as a sphere.
    const tiltX = 0.32;
    const yy = y * Math.cos(tiltX) - z * Math.sin(tiltX);
    z = y * Math.sin(tiltX) + z * Math.cos(tiltX);
    x *= g;
    const depth = z;
    const fade = depth > -0.15 ? clearanceFade(x, yy * g, s.inner, 1) : 1;
    return { x, y: yy * g, z: depth * g, round, opacity: (0.42 + 0.58 * smoothstep(-1, 0.6, depth)) * fade, billboard: true };
  }
  // Field: seeded spots that drift; drag pans them with wraparound.
  const spanX = s.width * 1.15;
  const spanY = s.height * 1.15;
  const fx = s.field[k * 3];
  const fy = s.field[k * 3 + 1];
  const phase = s.field[k * 3 + 2];
  const driftX = Math.sin(s.time * 0.21 + phase) * s.size * 0.6;
  const driftY = Math.cos(s.time * 0.17 + phase * 1.3) * s.size * 0.5;
  const x = wrap(fx * spanX + s.panX + driftX + spanX / 2, spanX) - spanX / 2;
  const y = wrap(fy * spanY + s.panY + driftY + spanY / 2, spanY) - spanY / 2;
  return { x, y, z: phase * 2, round, opacity: clearanceFade(x, y, s.inner, Math.max(1, s.width / s.height) * 0.9), billboard: false };
}

type OpenState = { card: number; item: number } | null;

/**
 * Up to 160 small photo cards that flow between formations (rings, spiral, globe, field) around an
 * empty center kept for a headline. Rendered with the shared WebGL2 gallery engine; a hidden button
 * list carries the accessible gallery.
 */
export function FormationGallery({
  items,
  children,
  count = 96,
  formations = ALL,
  transition = "gather",
  startIndex = 0,
  autoplay = true,
  interval = 6500,
  rings = 4,
  cardSize = 0,
  clearance = 0.36,
  spin = 8,
  shape = "auto",
  cardRadius = 8,
  tilt = 10,
  hoverScale = 1.6,
  shadow = 0.45,
  accentColor = "#2563EB",
  openOnClick = true,
  seed = 7,
  pauseOnHover = true,
  draggable = true,
  wheel = false,
  captions = true,
  controls = true,
  backgroundColor = "transparent",
  paused = false,
  dpr = 2,
  ariaLabel = "Photos",
  className,
  style,
  onIndexChange,
  onSelect,
  onFormationChange,
  onOpen,
  ref,
}: FormationGalleryProps) {
  const list = formations.length ? formations : ALL;
  const cards = clamp(Math.round(count), 1, 160);
  const [formationIndex, setFormationIndex] = useState(0);
  const [open, setOpen] = useState<OpenState>(null);
  const scheme = chromeScheme(backgroundColor);
  const accent = useMemo(() => toRgb(accentColor), [accentColor]);
  const formation = list[formationIndex % list.length];
  // Drag spin/pan with inertia, shared between pointer handlers and the render loop.
  const drag = useRef({ angle: 0, angleV: 0, panX: 0, panY: 0, panVX: 0, panVY: 0, last: 0 });

  // Per-card data that only depends on the seed, the count and the ring split.
  const plan = useMemo(() => {
    const random = mulberry32(seed);
    const order = Array.from({ length: cards }, (_, k) => k % Math.max(1, items.length));
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const field = new Float32Array(cards * 3);
    for (let k = 0; k < cards; k++) {
      field[k * 3] = random() - 0.5;
      field[k * 3 + 1] = random() - 0.5;
      field[k * 3 + 2] = random() * Math.PI * 2;
    }
    const delays = Float32Array.from({ length: cards }, () => random() * STAGGER);
    const gather = Float32Array.from({ length: cards * 2 }, () => random() - 0.5);
    // Rings share the cards in proportion to their circumference.
    const ringCount = clamp(Math.round(rings), 1, 8);
    const weights = Array.from({ length: ringCount }, (_, i) => i + 1.6);
    const total = weights.reduce((a, b) => a + b, 0);
    const ringSizes = new Int32Array(ringCount);
    let assigned = 0;
    for (let i = 0; i < ringCount; i++) {
      ringSizes[i] = i === ringCount - 1 ? cards - assigned : Math.max(1, Math.round((cards * weights[i]) / total));
      assigned += ringSizes[i];
    }
    const ringOf = new Int32Array(cards);
    const slotOf = new Int32Array(cards);
    let k = 0;
    for (let ring = 0; ring < ringCount; ring++) {
      for (let slot = 0; slot < ringSizes[ring] && k < cards; slot++, k++) {
        ringOf[k] = ring;
        slotOf[k] = slot;
      }
    }
    return { order, field, delays, gather, ringCount, ringSizes, ringOf, slotOf };
  }, [seed, cards, items.length, rings]);

  const setFormation = useCallback(
    (next: Formation | number) => {
      const index = typeof next === "number" ? wrap(next, list.length) : list.indexOf(next);
      if (index < 0 || index === formationIndex) return;
      setFormationIndex(index);
      onFormationChange?.(list[index], index);
    },
    [list, formationIndex, onFormationChange],
  );

  const openCard = useCallback(
    (next: OpenState) => {
      if (next) {
        const item = items[next.item];
        if (!item) return;
        setOpen(next);
        onOpen?.(item, next.item);
        onSelect?.(item, next.item);
      } else if (open) {
        setOpen(null);
        onOpen?.(null, open.item);
      }
    },
    [items, open, onOpen, onSelect],
  );
  const openItem = (item: number) => {
    const card = plan.order.indexOf(item);
    openCard({ card: card >= 0 ? card : 0, item });
  };

  const { hostRef, bind, status, input, rendererRef } = useGallery({
    images: items.map((item) => item.src),
    count: items.length,
    loop: true,
    startIndex,
    draggable,
    wheel: false,
    pauseOnHover,
    pausable: true,
    paused,
    dpr,
    trackPointer: true,
    dragDelta: (move) => {
      const state = drag.current;
      const now = performance.now();
      const elapsed = Math.max(0.008, (now - (state.last || now - 16)) / 1000);
      state.last = now;
      if (formation === "field") {
        state.panX += move.dx;
        state.panY -= move.dy;
        state.panVX = clamp(move.dx / elapsed, -2400, 2400);
        state.panVY = clamp(-move.dy / elapsed, -2400, 2400);
      } else if (formation === "globe") {
        const turn = move.dx / Math.max(120, Math.min(move.width, move.height) * 0.45);
        state.angle += turn;
        state.angleV = clamp(turn / elapsed, -8, 8);
      } else {
        // Rings and spiral turn with the pointer's angle around the center.
        const cx = move.width / 2;
        const cy = move.height / 2;
        const before = Math.atan2(-(move.y - move.dy - cy), move.x - move.dx - cx);
        const after = Math.atan2(-(move.y - cy), move.x - cx);
        let turn = after - before;
        if (turn > Math.PI) turn -= Math.PI * 2;
        if (turn < -Math.PI) turn += Math.PI * 2;
        state.angle += turn;
        state.angleV = clamp(turn / elapsed, -8, 8);
      }
      return 0;
    },
    onIndexChange,
    onSelect: (item) => openItem(item),
    onEscape: () => openCard(null),
    onTap: (point) => {
      if (open) return openCard(null);
      if (!openOnClick) return;
      const hit = rendererRef.current?.pick(point.x, point.y);
      if (hit && hit.id >= 0) openCard({ card: hit.id, item: plan.order[hit.id] });
    },
    frame: ({ dt, time, width, height, reducedMotion, ambient, memory, renderer }, gallery) => {
      if (memory.ambient !== Number(ambient)) {
        memory.ambient = Number(ambient);
        gallery.hold("ambient", !ambient);
      }
      let moving = false;
      const state = drag.current;
      // Auto spin (slows on hover, stops when paused or open) plus drag inertia.
      let spinTarget = spin !== 0 && !paused && !gallery.userPaused && ambient && !reducedMotion && !open ? (spin * Math.PI) / 180 : 0;
      if (pauseOnHover && gallery.hovering()) spinTarget *= 0.3;
      memory.spinV = (memory.spinV ?? 0) + (spinTarget - (memory.spinV ?? 0)) * (1 - Math.exp(-dt * 2.5));
      if (spinTarget === 0 && Math.abs(memory.spinV) < 0.0005) memory.spinV = 0;
      memory.auto = (memory.auto ?? 0) + memory.spinV * dt;
      if (!gallery.dragging()) {
        if (state.angleV || state.panVX || state.panVY) moving = true;
        state.angle += state.angleV * dt;
        state.panX += state.panVX * dt;
        state.panY += state.panVY * dt;
        const decay = Math.exp(-dt / 0.6);
        state.angleV = Math.abs(state.angleV * decay) < 0.002 ? 0 : state.angleV * decay;
        state.panVX = Math.abs(state.panVX * decay) < 1 ? 0 : state.panVX * decay;
        state.panVY = Math.abs(state.panVY * decay) < 1 ? 0 : state.panVY * decay;
      }
      const fieldDrifts = formation === "field" && !paused && !gallery.userPaused && !reducedMotion && ambient;
      if (memory.spinV || fieldDrifts) moving = true;
      if (fieldDrifts) memory.drift = (memory.drift ?? 0) + dt;
      if (gallery.update(dt)) moving = true;

      // Group tilt toward the pointer, eased.
      const pointer = gallery.pointer();
      const tiltOn = tilt !== 0 && !reducedMotion && pointer.inside && !open;
      const goalX = tiltOn ? pointer.x / width - 0.5 : 0;
      const goalY = tiltOn ? pointer.y / height - 0.5 : 0;
      const ease = 1 - Math.exp(-dt * 4);
      memory.tiltX = (memory.tiltX ?? 0) + (goalX - (memory.tiltX ?? 0)) * ease;
      memory.tiltY = (memory.tiltY ?? 0) + (goalY - (memory.tiltY ?? 0)) * ease;
      if (Math.abs(goalX - memory.tiltX) + Math.abs(goalY - memory.tiltY) > 0.001) moving = true;

      // Formation changes start a staggered transition.
      if (memory.formation === undefined) memory.formation = formationIndex;
      if (memory.formation !== formationIndex) {
        memory.from = memory.formation;
        memory.formation = formationIndex;
        memory.t0 = time;
      }
      const transitioning = memory.t0 !== undefined && time - memory.t0 < MOVE + STAGGER && !reducedMotion;
      if (transitioning) moving = true;

      // Open card spring.
      const openTarget = open ? 1 : 0;
      if (open) memory.openCard = open.card;
      memory.openT ??= 0;
      if (reducedMotion) memory.openT = openTarget;
      else {
        const h = Math.min(dt, 1 / 30);
        memory.openV = (memory.openV ?? 0) + (-110 * (memory.openT - openTarget) - 21 * (memory.openV ?? 0)) * h;
        memory.openT += memory.openV * h;
        if (Math.abs(memory.openT - openTarget) < 0.001 && Math.abs(memory.openV) < 0.01) {
          memory.openT = openTarget;
          memory.openV = 0;
        } else moving = true;
      }
      const openT = smoothstep(0, 1, memory.openT);
      const openIndex = open ? open.card : memory.openT > 0.001 ? (memory.openCard ?? -1) : -1;

      // Hover: the card under the pointer holds still, grows and gets an accent ring.
      const hit = pointer.inside && !gallery.dragging() && openIndex < 0 ? renderer.pick(pointer.x, pointer.y) : null;
      const hovered = hit && hit.id >= 0 ? hit.id : -1;
      // `hold` is the card holding still (or easing back after the pointer left it).
      if (hovered >= 0 && hovered !== (memory.hold ?? -1)) {
        memory.hold = hovered;
        memory.holdSet = 0;
        memory.hoverT = 0;
      }
      const holdTarget = hovered >= 0 && hovered === memory.hold ? 1 : 0;
      memory.hoverT = (memory.hoverT ?? 0) + (holdTarget - (memory.hoverT ?? 0)) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 14));
      if (holdTarget === 0 && memory.hoverT < 0.002) memory.hold = -1;
      if (Math.abs(holdTarget - memory.hoverT) > 0.002) moving = true;

      const minSide = Math.min(width, height);
      const size = cardSize > 0 ? cardSize : clamp(Math.sqrt((width * height * 0.34) / cards), 20, 96);
      const stage: Stage = {
        inner: clamp(clearance, 0, 0.8) * minSide * 0.5,
        outer: minSide * 0.5 - size * 0.55,
        stretch: clamp(width / height, 1, 1.7),
        width,
        height,
        angle: memory.auto + state.angle,
        panX: state.panX,
        panY: state.panY,
        time: memory.drift ?? 0,
        size,
        count: cards,
        ringCount: plan.ringCount,
        shape,
        ringOf: plan.ringOf,
        slotOf: plan.slotOf,
        ringSizes: plan.ringSizes,
        field: plan.field,
      };
      const current = list[formationIndex % list.length];
      const previous = list[wrap(memory.from ?? formationIndex, list.length)];
      const tiltRadX = ((tilt * Math.PI) / 180) * memory.tiltY * 2;
      const tiltRadY = ((tilt * Math.PI) / 180) * memory.tiltX * 2;
      const cosX = Math.cos(tiltRadX);
      const sinX = Math.sin(tiltRadX);
      const cosY = Math.cos(tiltRadY);
      const sinY = Math.sin(tiltRadY);

      const out: GalleryCard[] = [];
      for (let k = 0; k < cards; k++) {
        const to = spotFor(current, k, stage);
        let spot = to;
        if (transitioning) {
          const from = spotFor(previous, k, stage);
          const e = easeInOut(clamp((time - (memory.t0 ?? 0) - plan.delays[k]) / MOVE, 0, 1));
          let x: number;
          let y: number;
          if (transition === "gather") {
            // Cluster in the center, then burst out.
            const gx = plan.gather[k * 2] * size * 2.2;
            const gy = plan.gather[k * 2 + 1] * size * 2.2;
            const a = smoothstep(0, 0.5, e);
            const b = smoothstep(0.5, 1, e);
            x = e < 0.5 ? lerp(from.x, gx, a) : lerp(gx, to.x, b);
            y = e < 0.5 ? lerp(from.y, gy, a) : lerp(gy, to.y, b);
          } else if (transition === "swirl") {
            // Curve around the center: angle and radius interpolate separately, plus half a turn.
            const a0 = Math.atan2(from.y, from.x);
            const a1 = Math.atan2(to.y, to.x);
            const turn = wrap(a1 - a0, Math.PI * 2) + Math.PI;
            const r = lerp(Math.hypot(from.x, from.y), Math.hypot(to.x, to.y), e);
            x = Math.cos(a0 + turn * e) * r;
            y = Math.sin(a0 + turn * e) * r;
          } else {
            x = lerp(from.x, to.x, e);
            y = lerp(from.y, to.y, e);
          }
          spot = {
            x,
            y,
            z: lerp(from.z, to.z, e),
            round: lerp(from.round, to.round, e),
            opacity: lerp(from.opacity, to.opacity, e),
            billboard: e > 0.5 ? to.billboard : from.billboard,
          };
        }
        // Group tilt: rotate the formation around x, then y.
        const y1 = spot.y * cosX - spot.z * sinX;
        const z1 = spot.y * sinX + spot.z * cosX;
        const x2 = spot.x * cosY + z1 * sinY;
        const z2 = -spot.x * sinY + z1 * cosY;
        const card: GalleryCard = {
          image: plan.order[k],
          id: k,
          x: x2,
          y: y1,
          z: z2,
          rotateX: spot.billboard ? 0 : -tiltRadX,
          rotateY: spot.billboard ? 0 : tiltRadY,
          width: size,
          height: size,
          radius: cardRadius,
          round: spot.round,
          opacity: spot.opacity,
          shadow: clamp(shadow, 0, 1) * spot.opacity,
          dim: openT * 0.5,
        };
        if (k === memory.hold) {
          // Hold still: freeze where it was when the hover started.
          if (!memory.holdSet) {
            memory.holdSet = 1;
            memory.holdX = card.x;
            memory.holdY = card.y;
            memory.holdZ = card.z;
          }
          const t = memory.hoverT;
          card.x = lerp(card.x, memory.holdX ?? card.x, t);
          card.y = lerp(card.y, memory.holdY ?? card.y, t);
          card.z = lerp(card.z, (memory.holdZ ?? card.z) + 80, t);
          card.scale = lerp(1, hoverScale, t);
          card.ring = t;
          card.opacity = Math.max(card.opacity ?? 1, t);
          card.shadow = Math.max(card.shadow ?? 0, t);
        }
        if (k === openIndex) {
          const target = (minSide * 0.56) / size;
          if (open && memory.openFromSet !== 1) {
            memory.openFromSet = 1;
            memory.openX = card.x;
            memory.openY = card.y;
          }
          if (!open) memory.openFromSet = 0;
          card.x = lerp(memory.openX ?? card.x, 0, openT);
          card.y = lerp(memory.openY ?? card.y, height * 0.04, openT);
          card.z = 300 * openT + (card.z ?? 0) * (1 - openT);
          card.rotateX = lerp(card.rotateX ?? 0, 0, openT);
          card.rotateY = lerp(card.rotateY ?? 0, 0, openT);
          card.scale = lerp(card.scale ?? 1, target, openT);
          card.round = lerp(spot.round, 0, openT);
          card.radius = lerp(cardRadius, 14 / target, openT);
          card.opacity = Math.max(card.opacity ?? 1, openT);
          card.shadow = 1;
          card.dim = 0;
          card.ring = 0;
        }
        out.push(card);
      }
      return {
        cards: out,
        animating: moving,
        scene: { fov: 30, ring: accent, shadowOffset: 6, shadowBlur: 12, shadowOpacity: 0.22 },
      };
    },
  });

  // Cycle formations on a timer (paused by hover, drag, an open card, Space, hidden tabs).
  const { canAutoplay, hold, next, previous, goTo, userPaused } = input;
  useEffect(() => {
    hold("open", Boolean(open));
  }, [hold, open]);
  useEffect(() => {
    if (!autoplay || list.length < 2) return;
    const id = window.setInterval(() => {
      if (canAutoplay()) setFormation(formationIndex + 1);
    }, Math.max(1500, interval));
    return () => window.clearInterval(id);
  }, [autoplay, list.length, interval, canAutoplay, setFormation, formationIndex]);

  // Optional wheel spin (off by default so the page keeps scrolling over the gallery).
  useEffect(() => {
    const host = hostRef.current?.parentElement;
    if (!wheel || !host) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const state = drag.current;
      if (formation === "field") state.panVY += event.deltaY * 2;
      else state.angleV = clamp(state.angleV + event.deltaY * 0.004, -8, 8);
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, [wheel, formation, hostRef]);

  useImperativeHandle(
    ref,
    () => ({ next, previous, goTo: (index: number) => goTo(index), setFormation, close: () => openCard(null) }),
    [next, previous, goTo, setFormation, openCard],
  );

  const fallback = status === "fallback";
  const openedItem = open ? items[open.item] : undefined;
  return (
    <div
      ref={bind}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={-1}
      className={cn("relative size-full min-h-[420px] touch-pan-y overflow-hidden rounded-[inherit] outline-none select-none [container-type:size] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", className)}
      style={{ backgroundColor, ...style }}
    >
      <div ref={hostRef} className="absolute inset-0">
        {fallback ? <GalleryFallback items={items} label={ariaLabel} aspect="1 / 1" onSelect={onSelect} className="absolute inset-0" /> : null}
      </div>
      {children && !fallback ? (
        <div className={cn("pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-300 motion-reduce:transition-none", open ? "opacity-0" : "opacity-100")}>
          <div data-gallery-control inert={Boolean(open)} className={cn("max-w-[46cqmin] text-center", !open && "pointer-events-auto")}>
            {children}
          </div>
        </div>
      ) : null}
      {fallback ? null : (
        <GalleryA11y items={items} index={input.index} label={ariaLabel} live={!autoplay || paused || userPaused} onActivate={(i) => openItem(i)} />
      )}
      <AnimatePresence>
        {captions && openedItem && !fallback ? (
          <motion.div
            key={open?.item}
            data-gallery-control
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: duration.base, ease: ease.out }}
            className={cn(
              "absolute bottom-4 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border py-1.5 pr-1.5 pl-4 shadow-lg backdrop-blur",
              scheme === "dark" ? "border-white/15 bg-zinc-900/80 text-white" : "border-border bg-background/90 text-foreground",
            )}
          >
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium">{openedItem.title ?? openedItem.alt}</span>
              {openedItem.subtitle ? <span className={scheme === "dark" ? "text-white/65" : "text-muted-foreground"}> · {openedItem.subtitle}</span> : null}
            </p>
            <button
              type="button"
              aria-label="Close photo"
              onClick={() => openCard(null)}
              className={cn("grid size-8 shrink-0 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", scheme === "dark" ? "hover:bg-white/10" : "hover:bg-surface-2")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {controls && list.length > 1 && !fallback ? (
        <div
          data-gallery-control
          role="group"
          aria-label="Formation"
          inert={Boolean(open)}
          className={cn(
            "absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-full border p-0.5 shadow-sm backdrop-blur transition-opacity duration-200",
            open ? "opacity-0" : "opacity-100",
            scheme === "dark" ? "border-white/15 bg-zinc-900/70" : "border-border bg-background/85",
          )}
        >
          {list.map((name, i) => {
            const active = i === formationIndex;
            return (
              <button
                key={name}
                type="button"
                data-gallery-control
                aria-pressed={active}
                onClick={() => setFormation(i)}
                className={cn(
                  "h-8 cursor-pointer rounded-full px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  active ? (scheme === "dark" ? "bg-white text-zinc-900" : "bg-foreground text-background") : scheme === "dark" ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {LABELS[name]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
