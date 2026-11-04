"use client";

import { useEffect, useState, type RefObject } from "react";

export interface ScrollState {
  /** Scroll offset in px. */
  y: number;
  /** Direction of the last meaningful scroll. */
  direction: "up" | "down";
  /** Share of the scrollable distance covered, 0–1. */
  progress: number;
}

/**
 * Scroll position, direction and progress of the window, or of `container` when given (handy for
 * navbars inside a scrolling panel). Updates once per frame at most.
 */
export function useScrollState(container?: RefObject<HTMLElement | null>, threshold = 4): ScrollState {
  const [state, setState] = useState<ScrollState>({ y: 0, direction: "up", progress: 0 });
  useEffect(() => {
    const el = container?.current ?? null;
    const target: HTMLElement | Window = el ?? window;
    let last = 0;
    let direction: ScrollState["direction"] = "up";
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = el ? el.scrollTop : window.scrollY;
      const max = el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      // Small moves keep the last direction; tracked here, not in the updater, which may run twice.
      if (Math.abs(y - last) >= threshold) {
        direction = y > last ? "down" : "up";
        last = y;
      }
      setState({ y, direction, progress: max > 0 ? Math.min(1, y / max) : 0 });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    read();
    return () => {
      target.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [container, threshold]);
  return state;
}
