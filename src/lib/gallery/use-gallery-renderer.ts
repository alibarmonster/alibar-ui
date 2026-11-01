import { useCallback, useEffect, useRef, useState } from "react";
import { GalleryRenderer, type GalleryCard, type GalleryScene } from "@/lib/gallery/renderer";

/**
 * - `idle`: not started yet (always the value on the server and the first client render)
 * - `ready`: WebGL is drawing
 * - `fallback`: WebGL2 is unavailable, the shaders failed or the context could not be restored
 */
export type GalleryStatus = "idle" | "ready" | "fallback";

export interface GalleryFrameState {
  /** Seconds since the renderer started (only advances while frames are drawn). */
  time: number;
  /** Seconds since the previous frame, capped at 0.1. */
  dt: number;
  /** Host size in CSS px. */
  width: number;
  height: number;
  reducedMotion: boolean;
  /**
   * Ambient motion (drift, autoplay) may run. False for all but one gallery preview on a page of
   * gallery cards: the others hold a still poster frame until they become the hovered or most
   * visible card. Input-driven motion always runs.
   */
  ambient: boolean;
  /** Scratch values that persist between frames (e.g. a drift velocity). */
  memory: Record<string, number>;
  renderer: GalleryRenderer;
}

export interface GalleryFrame {
  cards: readonly GalleryCard[];
  scene?: GalleryScene;
  /** Keep drawing frames. When false the loop sleeps until `invalidate()` is called. */
  animating?: boolean;
}

export interface UseGalleryRendererOptions {
  /** Image URLs; cards refer to them by index. */
  images: string[];
  /** Builds each frame's cards. Runs inside requestAnimationFrame, so it can read refs freely. */
  frame: (state: GalleryFrameState) => GalleryFrame;
  /** Highest device pixel ratio used (software WebGL is capped at 1). @default 2 */
  dpr?: number;
  /** Texture layer size in px. @default 512 */
  textureSize?: number;
  /** Texture layers kept on the GPU (least recently used are recycled). @default number of distinct images, up to 32 */
  maxTextures?: number;
}

interface PreviewLease {
  ratio: number;
  hovered: boolean;
  wake: () => void;
}

// Gallery previews (inside [data-preview-card], e.g. docs gallery cards) share one animation lease.
const previews = new Set<PreviewLease>();
let leader: PreviewLease | null = null;

function electLeader() {
  let best: PreviewLease | null = null;
  for (const lease of previews) {
    if (lease.ratio <= 0) continue;
    if (!best || (lease.hovered && !best.hovered) || (lease.hovered === best.hovered && lease.ratio > best.ratio)) best = lease;
  }
  if (best === leader) return;
  const previous = leader;
  leader = best;
  previous?.wake();
  best?.wake();
}

/**
 * Runs a GalleryRenderer on a canvas the hook creates inside the element you attach `hostRef` to
 * (give it a size and `position: relative` or `absolute`). The loop only runs while the frame
 * reports `animating`, images fade in, or `invalidate()` is called, and never offscreen or in a
 * hidden tab. Context loss is recovered; everything is released on unmount.
 */
export function useGalleryRenderer<T extends HTMLElement = HTMLDivElement>(options: UseGalleryRendererOptions) {
  const hostRef = useRef<T>(null);
  const rendererRef = useRef<GalleryRenderer | null>(null);
  const [status, setStatus] = useState<GalleryStatus>("idle");
  const latest = useRef(options);
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    latest.current = options;
    wake.current();
  });

  /** Requests a frame. Safe to call from any event handler, many times per frame. */
  const invalidate = useCallback(() => wake.current(), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 320ms ease-out",
    });
    host.appendChild(canvas);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const previewCard = host.closest<HTMLElement>("[data-preview-card]");
    const lease: PreviewLease | null = previewCard ? { ratio: 0, hovered: false, wake: () => wakeUp() } : null;
    const memory: Record<string, number> = {};
    let renderer: GalleryRenderer | null = null;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let inView = false;
    let pageVisible = document.visibilityState === "visible";
    let lost = false;
    let needsResize = true;
    let shown = false;

    const resize = () => {
      if (!renderer) return;
      const cap = renderer.software ? 1 : Math.min(latest.current.dpr ?? 2, lease ? 1.5 : Infinity);
      renderer.resize(host.clientWidth, host.clientHeight, Math.min(window.devicePixelRatio || 1, Math.max(0.5, cap)));
      needsResize = false;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!renderer || lost) return;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      clock += dt;
      if (needsResize) resize();
      renderer.setImages(latest.current.images);
      const result = latest.current.frame({
        time: clock,
        dt,
        width: host.clientWidth,
        height: host.clientHeight,
        reducedMotion: reduced.matches,
        ambient: !lease || leader === lease,
        memory,
        renderer,
      });
      const fading = renderer.render(result.cards, result.scene);
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
      }
      if ((result.animating || fading) && inView && pageVisible) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wakeUp = () => {
      if (!raf && renderer && !lost && inView && pageVisible) raf = requestAnimationFrame(frame);
    };

    const intersection = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (lease) {
          lease.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
          electLeader();
        }
        wakeUp();
      },
      { rootMargin: "100px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    const onPreviewEnter = () => {
      if (!lease) return;
      lease.hovered = true;
      electLeader();
    };
    const onPreviewLeave = () => {
      if (!lease) return;
      lease.hovered = false;
      electLeader();
    };
    const resizeObserver = new ResizeObserver(() => {
      needsResize = true;
      wakeUp();
    });
    const onVisibility = () => {
      pageVisible = document.visibilityState === "visible";
      wakeUp();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onRestored = () => {
      if (renderer?.restore()) {
        lost = false;
        needsResize = true;
        wakeUp();
      } else {
        setStatus("fallback");
      }
    };

    // Start on the next frame: keeps WebGL setup out of the effect body and off the hydration task.
    const start = requestAnimationFrame(() => {
      const { textureSize = 512, maxTextures, images } = latest.current;
      // Previews are small: smaller textures keep several on one page light on GPU memory.
      renderer = GalleryRenderer.create(canvas, {
        textureSize: lease ? Math.min(textureSize, 256) : textureSize,
        layers: maxTextures ?? Math.min(32, Math.max(1, new Set(images).size)),
      });
      if (!renderer) {
        canvas.remove();
        setStatus("fallback");
        return;
      }
      rendererRef.current = renderer;
      renderer.onImageLoad = wakeUp;
      wake.current = wakeUp;
      canvas.addEventListener("webglcontextlost", onLost);
      canvas.addEventListener("webglcontextrestored", onRestored);
      document.addEventListener("visibilitychange", onVisibility);
      intersection.observe(host);
      resizeObserver.observe(host);
      if (lease && previewCard) {
        previews.add(lease);
        previewCard.addEventListener("pointerenter", onPreviewEnter);
        previewCard.addEventListener("pointerleave", onPreviewLeave);
      }
      setStatus("ready");
    });

    return () => {
      cancelAnimationFrame(start);
      if (raf) cancelAnimationFrame(raf);
      wake.current = () => {};
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (lease && previewCard) {
        previews.delete(lease);
        previewCard.removeEventListener("pointerenter", onPreviewEnter);
        previewCard.removeEventListener("pointerleave", onPreviewLeave);
        if (leader === lease) leader = null;
        electLeader();
      }
      renderer?.destroy();
      rendererRef.current = null;
      canvas.remove();
    };
  }, []);

  return { hostRef, rendererRef, status, invalidate };
}
