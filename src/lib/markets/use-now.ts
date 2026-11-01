import { useSyncExternalStore } from "react";

let now = 0;
const listeners = new Set<() => void>();
let timer = 0;

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Refresh on every subscribe, so a component that mounts while the timer is already running
  // does not start with a timestamp up to 15 s old.
  now = Date.now();
  if (!timer) {
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

const noop = () => () => {};

/**
 * False on the server and during hydration, true after. Gate text derived from timestamps (axis
 * labels, dates) with it when the data may be generated relative to page load.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
