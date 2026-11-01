"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Skeleton, SkeletonReveal } from "@/components/ui/skeleton-reveal/skeleton-reveal";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40";

/** Loads for a moment on mount and whenever reload() is called. */
function useFakeLoad(ms = 1600) {
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(timer);
  }, [run, ms]);
  return { loading, reload: () => { setLoading(true); setRun((r) => r + 1); } };
}

export function Default() {
  const { loading, reload } = useFakeLoad();
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5">
      <SkeletonReveal
        loading={loading}
        className="w-full rounded-2xl border border-border bg-card p-5 shadow-xs"
        skeleton={
          <div className="flex items-start gap-4">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2.5 pt-1">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        }
      >
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-indigo-500 text-sm font-semibold text-white">ML</span>
          <div>
            <p className="font-semibold text-foreground">Maya Laurent</p>
            <p className="mt-0.5 text-sm leading-6 text-muted-foreground">Design lead at Northwind. Writing about motion, systems and the space between.</p>
          </div>
        </div>
      </SkeletonReveal>
      <button type="button" className={control} onClick={reload} disabled={loading}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reload
      </button>
    </div>
  );
}

const ROWS = [
  { title: "Quarterly review deck", meta: "Edited 2h ago", tint: "from-amber-200 to-orange-300" },
  { title: "Onboarding flow v3", meta: "Edited yesterday", tint: "from-emerald-200 to-teal-300" },
  { title: "Brand guidelines", meta: "Edited Oct 28", tint: "from-sky-200 to-indigo-300" },
];

export function List() {
  const { loading, reload } = useFakeLoad(1300);
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5">
      <SkeletonReveal
        loading={loading}
        className="w-full"
        skeleton={
          <ul className="divide-y divide-border rounded-xl border border-border">
            {ROWS.map((row) => (
              <li key={row.title} className="flex items-center gap-3 p-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        }
      >
        <ul className="divide-y divide-border rounded-xl border border-border">
          {ROWS.map((row) => (
            <li key={row.title} className="flex items-center gap-3 p-3">
              <span className={`size-9 rounded-lg bg-gradient-to-br ${row.tint}`} aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </SkeletonReveal>
      <button type="button" className={control} onClick={reload} disabled={loading}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reload
      </button>
    </div>
  );
}
