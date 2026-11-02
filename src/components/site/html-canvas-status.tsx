"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { describeSupport, getHtmlCanvasSupport, NO_SUPPORT } from "@/lib/html-canvas/support";

const noop = () => () => {};

/** Site-only: whether this browser renders HTML-in-Canvas natively or falls back. */
export function useHtmlCanvasStatus() {
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const reduceMotion = useReducedMotion();
  const support = hydrated ? getHtmlCanvasSupport() : NO_SUPPORT;
  return { hydrated, support, native: hydrated && !reduceMotion && support.webgl, reduceMotion: !!reduceMotion };
}

/** A small chip: "Native HTML-in-Canvas" or "Fallback mode". */
export function HtmlCanvasStatusChip({ native, className }: { native?: boolean; className?: string }) {
  const status = useHtmlCanvasStatus();
  const isNative = native ?? status.native;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium",
        isNative ? "border-success/30 bg-success/10 text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" : "border-border bg-surface text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", isNative ? "bg-success" : "bg-muted-foreground/60")} />
      {!status.hydrated ? "Checking support…" : isNative ? `Native HTML-in-Canvas · ${describeSupport(status.support)}` : status.reduceMotion && status.support.webgl ? "Fallback mode · reduced motion" : "Fallback mode"}
    </span>
  );
}

/** The Experimental notice shown on every HTML in Canvas page. */
export function HtmlCanvasNotice({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-warning/30 bg-warning/[0.06] px-4 py-3 text-sm leading-6 text-muted-foreground", className)}>
      <p className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-6 items-center rounded-full bg-warning/15 px-2.5 text-xs font-semibold text-[color-mix(in_oklab,var(--warning)_70%,var(--foreground))]">Experimental · Chrome origin trial</span>
        <HtmlCanvasStatusChip />
      </p>
      <p className="mt-2">
        Built on the WICG <a className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground" href="https://github.com/WICG/html-in-canvas" target="_blank" rel="noreferrer">HTML-in-Canvas</a> proposal, which is not a web standard and changes between Chrome versions. Every component works without it: other browsers get the same live DOM with a CSS approximation of the effect.
      </p>
      <p className="mt-1">
        To try the native version locally, open Chrome Canary and enable <code className="rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">chrome://flags/#canvas-draw-element</code>. In production, register for the origin trial and set <code className="rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">NEXT_PUBLIC_HTML_IN_CANVAS_OT_TOKEN</code>.
      </p>
    </div>
  );
}
