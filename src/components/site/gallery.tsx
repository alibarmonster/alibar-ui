"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { ArrowUpRight, Clock3, Search, X } from "lucide-react";
import { categories, components, type CategoryId, type ComponentEntry } from "@/content/components";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { DemoRenderer } from "./demo-renderer";
import { PreviewStage } from "./component-preview";
import { NewBadge } from "./sidebar-nav";

type Filter = CategoryId | "all";

function isCategory(value: string | null): value is CategoryId {
  return categories.some((c) => c.id === value);
}

/** Mounts children once the element comes near the viewport. */
function WhenVisible({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // data-preview-card lets a tall demo trim itself to fit the card (see the ASCII Aquarium chat hero).
    <div ref={ref} data-preview-card="" className="relative flex h-full w-full items-center justify-center p-6">
      {visible ? children : null}
    </div>
  );
}

function ReadyCard({ entry, preview }: { entry: ComponentEntry; preview?: string }) {
  return (
    <article className="group flex min-w-0 flex-col rounded-[14px] border border-border bg-surface p-1.5 transition-shadow duration-300 hover:shadow-md">
      <PreviewStage className="h-60 rounded-[10px]">
        {preview ? (
          <WhenVisible>
            <DemoRenderer slug={entry.slug} name={preview} />
          </WhenVisible>
        ) : null}
      </PreviewStage>
      <Link
        href={`/components/${entry.slug}`}
        className="focus-ring mt-1.5 flex items-start justify-between gap-3 rounded-[10px] px-2.5 pt-2 pb-2"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">{entry.name}</span>
            {entry.isNew ? <NewBadge /> : null}
          </span>
          <span className="mt-0.5 line-clamp-1 block text-[13px] text-muted-foreground">{entry.description}</span>
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
        />
      </Link>
    </article>
  );
}

function PlannedItem({ entry }: { entry: ComponentEntry }) {
  return (
    <li className="min-w-0 rounded-[10px] border border-dashed border-border px-3.5 py-3">
      <span className="block truncate text-[13px] font-medium text-foreground/80">{entry.name}</span>
      <span className="mt-0.5 line-clamp-1 block text-[13px] text-muted-foreground">{entry.description}</span>
    </li>
  );
}

const CATEGORY_EVENT = "gallery:category";

function subscribeToCategory(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CATEGORY_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CATEGORY_EVENT, onChange);
  };
}

const readCategory = () => new URLSearchParams(window.location.search).get("category");
const readServerCategory = () => null;

/**
 * Category lives in the URL (?category=…). Reading it through an external store keeps the
 * server HTML hydratable (it renders "all", then switches) instead of re-rendering every card.
 */
export function Gallery({ previews }: { previews: Record<string, string> }) {
  const param = useSyncExternalStore(subscribeToCategory, readCategory, readServerCategory);
  const choose = (next: Filter) => {
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", next);
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event(CATEGORY_EVENT));
  };
  return <GalleryView previews={previews} filter={isCategory(param) ? param : "all"} onFilterChange={choose} />;
}

function GalleryView({
  previews,
  filter,
  onFilterChange,
}: {
  previews: Record<string, string>;
  filter: Filter;
  onFilterChange?: (filter: Filter) => void;
}) {
  const [query, setQuery] = useState("");
  const reduceMotion = useReducedMotion();

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["all", components.length]]);
    for (const c of components) map.set(c.category, (map.get(c.category) ?? 0) + 1);
    return map;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = components.filter(
      (c) =>
        (filter === "all" || c.category === filter) &&
        (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
    );
    return {
      ready: matches.filter((c) => c.status === "ready"),
      planned: matches.filter((c) => c.status !== "ready"),
    };
  }, [filter, query]);
  const total = results.ready.length + results.planned.length;

  const choose = (next: Filter) => onFilterChange?.(next);

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by name or behavior…"
            aria-label="Filter components"
            className="h-10 w-full rounded-[10px] border border-border bg-background pr-10 pl-10 text-sm text-foreground shadow-xs transition-shadow outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              className="focus-ring absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div
          role="radiogroup"
          aria-label="Category"
          className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {chips.map((chip) => {
            const active = chip.id === filter;
            return (
              <button
                key={chip.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(chip.id)}
                className={cn(
                  "focus-ring relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                  active ? "text-background" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                {active ? (
                  <m.span
                    layoutId="gallery-chip"
                    transition={reduceMotion ? { duration: 0 } : spring.snappy}
                    className="absolute inset-0 rounded-full bg-foreground"
                  />
                ) : null}
                <span className="relative">{chip.label}</span>
                <span className={cn("relative font-mono text-[11px] tabular-nums", active ? "text-background/70" : "text-muted-foreground")}>
                  {counts.get(chip.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="sr-only" role="status">
        {total} component{total === 1 ? "" : "s"}
      </p>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">No components match “{query.trim()}”.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              choose("all");
            }}
            className="focus-ring h-9 cursor-pointer rounded-[10px] border border-border bg-background px-3.5 text-sm font-medium text-foreground shadow-xs hover:bg-surface"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          {results.ready.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.ready.map((entry) => (
                <ReadyCard key={entry.slug} entry={entry} preview={previews[entry.slug]} />
              ))}
            </div>
          ) : null}
          {results.planned.length ? (
            <section aria-labelledby="in-progress-heading" className={cn(results.ready.length && "mt-14")}>
              <h2
                id="in-progress-heading"
                className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
                In progress
                <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">
                  {results.planned.length}
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.planned.map((entry) => (
                  <PlannedItem key={entry.slug} entry={entry} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
