"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

const CloudShader = dynamic(() => import("@/components/ui/cloud-shader/cloud-shader").then((m) => m.CloudShader), { ssr: false });
const STORAGE_KEY = "alibar:hero-sky";

/**
 * Optional cloud background for the landing hero. It mounts after the browser is idle, so it
 * never competes with the first paint, and remembers the visitor's on/off choice.
 */
export function HeroSky() {
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY) === "off") setEnabled(false);
      } catch {
        // Storage can be blocked; the sky simply stays on.
      }
      setReady(true);
    };
    const idle = window.requestIdleCallback?.(start, { timeout: 2500 });
    const timer = idle === undefined ? window.setTimeout(start, 1200) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // Ignore: the choice just won't persist.
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 transition-opacity duration-1000", ready && enabled ? "opacity-100" : "opacity-0")}
      >
        {ready && enabled ? <CloudShader className="size-full" density={3} speed={0.6} quality="medium" skyTopColor="#DCEBFA" /> : null}
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        className="focus-ring absolute right-4 bottom-4 z-10 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur transition-colors hover:text-foreground sm:right-6"
      >
        {enabled ? <Cloud className="size-3.5" aria-hidden="true" /> : <CloudOff className="size-3.5" aria-hidden="true" />}
        Cloud background
      </button>
    </>
  );
}
