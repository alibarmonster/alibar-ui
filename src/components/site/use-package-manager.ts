"use client";

import { useSyncExternalStore } from "react";
import { packageManagers, type PackageManager } from "./package-manager";

const STORAGE_KEY = "alibar:package-manager";
const listeners = new Set<() => void>();
// Holds the choice when localStorage is unavailable (private mode, blocked storage).
let memory: PackageManager | undefined;

function read(): PackageManager {
  if (memory) return memory;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return packageManagers.includes(value as PackageManager) ? (value as PackageManager) : "npm";
  } catch {
    return "npm";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    memory = undefined;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The visitor's preferred package manager, shared by every install block on the page. */
export function usePackageManager() {
  const value = useSyncExternalStore(subscribe, read, () => "npm" as const);
  const set = (next: PackageManager) => {
    memory = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Keep the in-memory choice.
    }
    listeners.forEach((listener) => listener());
  };
  return [value, set] as const;
}
