"use client";

import { useImperativeHandle, type CSSProperties, type Ref } from "react";
import { cn } from "@/lib/utils";
import { GalleryA11y } from "@/lib/gallery/gallery-a11y";
import { GalleryCaption, GalleryControls, chromeScheme } from "@/lib/gallery/gallery-chrome";
import { GalleryFallback } from "@/lib/gallery/gallery-fallback";
import { clamp, smoothstep, wrap } from "@/lib/gallery/math";
import type { GalleryCard } from "@/lib/gallery/renderer";
import type { GalleryHandle, GalleryItem } from "@/lib/gallery/types";
import { useGallery } from "@/lib/gallery/use-gallery";

export interface CurvedWallProps {
  /** Images on the wall. */
  items: GalleryItem[];
  /** Panel centered first. @default 0 */
  startIndex?: number;
  /** "drift" turns the wall slowly, "step" moves one panel every `interval`, "off" waits for input. @default "drift" */
  autoplay?: "drift" | "step" | "off";
  /** Milliseconds between steps in "step" mode. @default 3500 */
  interval?: number;
  /** Drift speed in panels per second. @default 0.12 */
  speed?: number;
  /** Hovering brakes the drift and pauses stepping, so a picture can be looked at. @default true */
  pauseOnHover?: boolean;
  /** Drag the wall; the grabbed point follows the pointer and flicks carry momentum. @default true */
  draggable?: boolean;
  /** One panel per wheel notch. @default true */
  wheel?: boolean;
  /** Settle a panel in the center after a drag, like a dial with detents. @default true */
  snap?: boolean;
  /** Seconds of glide a flick carries. @default 0.45 */
  inertia?: number;
  /** Title and subtitle of the centered panel under the wall. @default true */
  captions?: boolean;
  /** Previous and next buttons with a counter. @default true */
  controls?: boolean;
  /** Panel width ÷ height. @default 0.75 */
  aspect?: number;
  /** Panel height as a fraction of the wall's height (narrow walls cap panels at about 28% of the width). @default 0.68 */
  size?: number;
  /** 0 is a flat strip, 1 a tight drum. @default 0.5 */
  curvature?: number;
  /** Camera distance: below 1 strengthens perspective, above 1 flattens it. @default 1 */
  viewerDistance?: number;
  /** Camera tilt in degrees: positive looks up at the wall, negative looks down on it. @default 0 */
  viewAngle?: number;
  /** Space between panels, px. @default 18 */
  gap?: number;
  /** Panel corner radius, px. @default 14 */
  radius?: number;
  /** Floor reflection strength; 0 turns it off. @default 0.22 */
  reflection?: number;
  /** How much panels away from the center darken, 0–1. @default 0.35 */
  dim?: number;
  /** Background color; captions and controls switch to light text on dark colors. @default "transparent" */
  backgroundColor?: string;
  /** Stops drift and stepping. Dragging, wheel and keys still work. @default false */
  paused?: boolean;
  /** Highest device pixel ratio rendered. @default 2 */
  dpr?: number;
  /** Accessible name of the gallery. @default "Gallery" */
  ariaLabel?: string;
  /** Classes for the root, which fills its parent (at least 420px tall). */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
  /** Fires when the centered panel changes. */
  onIndexChange?: (index: number) => void;
  /** Fires on clicking the centered panel or pressing Enter on it. */
  onSelect?: (item: GalleryItem, index: number) => void;
  /** Imperative `next()`, `previous()` and `goTo(index)`. */
  ref?: Ref<GalleryHandle>;
}

const CHROME_HEIGHT = 56;

/**
 * Image panels on the inside of a cylinder, like standing in a rotunda. Rendered with the shared
 * WebGL2 gallery engine; the canvas is decorative and a hidden list of buttons carries the
 * accessible gallery.
 */
export function CurvedWall({
  items,
  startIndex = 0,
  autoplay = "drift",
  interval = 3500,
  speed = 0.12,
  pauseOnHover = true,
  draggable = true,
  wheel = true,
  snap = true,
  inertia = 0.45,
  captions = true,
  controls = true,
  aspect = 0.75,
  size = 0.68,
  curvature = 0.5,
  viewerDistance = 1,
  viewAngle = 0,
  gap = 18,
  radius = 14,
  reflection = 0.22,
  dim = 0.35,
  backgroundColor = "transparent",
  paused = false,
  dpr = 2,
  ariaLabel = "Gallery",
  className,
  style,
  onIndexChange,
  onSelect,
  ref,
}: CurvedWallProps) {
  const count = items.length;
  const chrome = captions || controls ? CHROME_HEIGHT : 0;
  const panel = (stageWidth: number, stageHeight: number) => {
    const ratio = clamp(aspect, 0.3, 3);
    // Narrow walls get smaller panels so several still fit and the curve stays visible.
    const height = Math.min(clamp(size, 0.2, 1) * stageHeight, (stageWidth * 0.28) / ratio);
    const width = height * ratio;
    return { width, height, pitch: width + Math.max(0, gap) };
  };

  const { hostRef, bind, status, input, rendererRef } = useGallery({
    images: items.map((item) => item.src),
    count,
    loop: true,
    startIndex,
    draggable,
    wheel,
    snap,
    inertia,
    autoplay: autoplay === "step",
    interval,
    pauseOnHover,
    paused,
    dpr,
    // One panel of drag per panel pitch, so the grabbed point stays under the pointer at the center.
    dragDistance: (width, height) => panel(width, height - chrome).pitch,
    onSelect: (index) => onSelect?.(items[index], index),
    onIndexChange,
    onTap: (point, gallery) => {
      const hit = rendererRef.current?.pick(point.x, point.y);
      if (!hit) return;
      if (hit.id === gallery.activeIndex()) onSelect?.(items[hit.id], hit.id);
      else gallery.goTo(hit.id);
    },
    frame: ({ dt, width, height, reducedMotion, ambient, memory }, gallery) => {
      if (memory.ambient !== Number(ambient)) {
        memory.ambient = Number(ambient);
        gallery.hold("ambient", !ambient);
      }
      // Drift eases in and brakes out (hover, drag, focus elsewhere) instead of stopping dead.
      const drifting = autoplay === "drift" && !paused && ambient && !reducedMotion && gallery.canAutoplay();
      const drift = memory.drift ?? 0;
      memory.drift = drift + ((drifting ? speed : 0) - drift) * (1 - Math.exp(-dt * 2.2));
      if (!drifting && Math.abs(memory.drift) < 0.0008) memory.drift = 0;
      if (memory.drift) gallery.drift(memory.drift * dt);
      const moving = gallery.update(dt);

      const position = gallery.position();
      const { width: panelWidth, height: panelHeight, pitch } = panel(width, height);
      const angle = clamp(curvature, 0, 1) * (Math.PI / 4);
      const fov = clamp(34 / clamp(viewerDistance, 0.3, 4), 10, 80);
      const distance = height / 2 / Math.tan((fov * Math.PI) / 360);
      const centerY = height * 0.05;
      const cards: GalleryCard[] = [];
      for (let i = 0; i < count; i++) {
        const offset = wrap(i - position + count / 2, count) - count / 2;
        let x = offset * pitch;
        let z = 0;
        let rotateY = 0;
        if (angle > 1e-4) {
          // Panels stand on the inside of a cylinder whose axis is in front of the wall.
          const theta = offset * angle;
          if (Math.abs(theta) > 1.9) continue;
          const r = pitch / angle;
          x = r * Math.sin(theta);
          z = r * (1 - Math.cos(theta));
          rotateY = -theta;
          if (z > distance * 0.85) continue;
        } else if (Math.abs(x) > width) continue;
        cards.push({
          image: i,
          id: i,
          x,
          y: centerY,
          z,
          rotateY,
          width: panelWidth,
          height: panelHeight,
          radius,
          dim: clamp(dim, 0, 1) * smoothstep(0.2, 3, Math.abs(offset)),
          shadow: 0.7,
          reflection: clamp(reflection, 0, 1),
        });
      }
      const tilt = (clamp(viewAngle, -30, 30) * Math.PI) / 180;
      return {
        cards,
        animating: moving || memory.drift !== 0,
        scene: {
          fov,
          camera: { y: -Math.tan(tilt) * distance },
          floorY: centerY - panelHeight / 2 - 8,
          reflectionFade: panelHeight * 0.45,
          edgeFade: [0.16, 0],
          shadowOffset: 10,
          shadowBlur: 18,
          shadowOpacity: 0.22,
        },
      };
    },
  });

  const { next, previous, goTo } = input;
  useImperativeHandle(ref, () => ({ next, previous, goTo: (index: number) => goTo(index) }), [next, previous, goTo]);

  const scheme = chromeScheme(backgroundColor);
  const fallback = status === "fallback";
  return (
    <div
      ref={bind}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={cn("relative flex size-full min-h-[420px] touch-pan-y flex-col rounded-[inherit] select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", className)}
      style={{ backgroundColor, ...style }}
    >
      <div ref={hostRef} className="relative min-h-0 flex-1">
        {fallback ? <GalleryFallback items={items} label={ariaLabel} aspect={String(aspect)} onSelect={onSelect} className="absolute inset-0" /> : null}
      </div>
      {/* The hidden item list comes before the controls so Tab reaches the gallery first. */}
      {fallback ? null : (
        <GalleryA11y
          items={items}
          index={input.index}
          label={ariaLabel}
          live={autoplay === "off" || paused}
          onFocusItem={(i) => goTo(i)}
          onActivate={(i) => (i === input.index ? onSelect?.(items[i], i) : goTo(i))}
        />
      )}
      {chrome && !fallback ? (
        <div className="flex shrink-0 items-center justify-between gap-3 px-4" style={{ height: CHROME_HEIGHT }}>
          {captions ? <GalleryCaption item={items[input.index]} index={input.index} count={count} scheme={scheme} className="flex-1" /> : <span />}
          {controls ? <GalleryControls index={input.index} count={count} onPrevious={previous} onNext={next} scheme={scheme} /> : null}
        </div>
      ) : null}
    </div>
  );
}
