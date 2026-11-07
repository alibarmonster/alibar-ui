/**
 * The render loop every glyph and dither canvas shares: sizes the canvas to its host at a capped
 * pixel ratio, runs only while the host is on screen, the tab is visible, nothing is paused and
 * the user hasn't asked for reduced motion, and otherwise keeps one up-to-date still frame.
 * Framework-free: start it in an effect and dispose it in the cleanup. Browser only.
 */

export interface CanvasLoopFrame {
  /** Seconds since the previous frame (capped at 0.05), or 0 for a redraw without advancing. */
  dt: number;
  /** Seconds the loop has been running. */
  time: number;
  /** True under reduced motion: draw a calm, finished-looking frame. */
  still: boolean;
  /** Host size in CSS pixels. */
  width: number;
  height: number;
  /** Device pixel ratio of the canvas (capped). */
  dpr: number;
}

export interface CanvasLoopOptions {
  /** Element observed for size and visibility. */
  host: HTMLElement;
  /** Canvas sized to the host times the pixel ratio. */
  canvas: HTMLCanvasElement;
  /** Advance by `frame.dt` and draw. Called every animation frame while running, and with dt 0 after resizes and redraws. */
  render: (frame: CanvasLoopFrame) => void;
  /** Called after the canvas is resized, before it is redrawn. */
  resize?: (frame: CanvasLoopFrame) => void;
  /** Read before every frame; while it returns true the loop stops and the last frame stays. */
  isPaused?: () => boolean;
  /** Highest device pixel ratio used. @default 2 */
  maxDpr?: number;
  /** Margin around the viewport that still counts as on screen. @default "120px" */
  rootMargin?: string;
}

export interface CanvasLoop {
  /** Re-checks paused, visibility and reduced motion, and starts or stops the loop. Call it when props change. */
  wake(): void;
  /** Draws one frame without advancing (no-op while the loop is running, since the next frame will). */
  redraw(): void;
  /** Stops the loop and removes every observer and listener. */
  dispose(): void;
}

export function runCanvasLoop(options: CanvasLoopOptions): CanvasLoop {
  const { host, canvas, rootMargin = "120px" } = options;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let last = 0;
  let time = 0;
  let inView = false;
  let disposed = false;

  const frame = (dt: number): CanvasLoopFrame => ({ dt, time, still: reducedMotion.matches, width, height, dpr });
  const shouldRun = () => !disposed && inView && !document.hidden && !reducedMotion.matches && !options.isPaused?.();

  const tick = (now: number) => {
    raf = 0;
    if (!shouldRun()) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    time += dt;
    options.render(frame(dt));
    raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (disposed) return;
    if (shouldRun()) {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
      return;
    }
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const redraw = () => {
    if (!disposed && !raf && width > 0) options.render(frame(0));
  };

  const resize = () => {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr ?? 2);
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    options.resize?.(frame(0));
    // Resizing clears the canvas, so repaint right away even while running.
    options.render(frame(0));
  };

  const resizeObserver = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(
    ([entry]) => {
      inView = entry?.isIntersecting ?? true;
      wake();
    },
    { rootMargin },
  );
  const onVisibility = () => wake();
  const onMotionChange = () => {
    wake();
    redraw();
  };

  resize();
  resizeObserver.observe(host);
  intersection.observe(host);
  document.addEventListener("visibilitychange", onVisibility);
  reducedMotion.addEventListener("change", onMotionChange);

  return {
    wake,
    redraw,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onMotionChange);
    },
  };
}
