import { useSyncExternalStore } from "react";

let now = 0;
const listeners = new Set<() => void>();
let timer = 0;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 15000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.clearInterval(timer);
      timer = 0;
    }
  };
}

/**
 * The current time, refreshed every 15 s. It is 0 on the server and during hydration, so countdowns
 * render a placeholder first and never mismatch.
 */
export function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => now || Date.now(),
    () => 0,
  );
}
