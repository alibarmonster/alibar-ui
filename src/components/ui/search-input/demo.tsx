"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SearchInput } from "@/components/ui/search-input/search-input";

export function Default() {
  return (
    <div className="w-full max-w-sm">
      <SearchInput aria-label="Search" defaultValue="spring physics for interfaces" />
    </div>
  );
}

const FRAMEWORKS = ["Next.js", "Remix", "Astro", "SvelteKit", "Nuxt", "SolidStart", "Qwik City", "Gatsby"];

export function FilterList() {
  const [query, setQuery] = useState("");
  const results = FRAMEWORKS.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="w-full max-w-xs space-y-2">
      <SearchInput aria-label="Filter frameworks" placeholder="Filter frameworks…" value={query} onValueChange={setQuery} size="sm" />
      <ul className="relative h-56 overflow-hidden rounded-lg border border-border bg-background p-1 shadow-xs">
        <AnimatePresence initial={false} mode="popLayout">
          {results.map((name) => (
            <motion.li
              key={name}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
              className="rounded-md px-2.5 py-1.5 text-[13px] text-foreground hover:bg-accent"
            >
              {name}
            </motion.li>
          ))}
        </AnimatePresence>
        {results.length === 0 ? (
          <li className="px-2.5 py-1.5 text-[13px] text-muted-foreground">No matches.</li>
        ) : null}
      </ul>
    </div>
  );
}

export function Loading() {
  const [query, setQuery] = useState("motion");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(12);

  useEffect(() => {
    if (!query) return;
    const start = window.setTimeout(() => setLoading(true), 0);
    const done = window.setTimeout(() => {
      setLoading(false);
      setCount((query.length * 7) % 40);
    }, 700);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(done);
    };
  }, [query]);

  return (
    <div className="w-full max-w-md space-y-2">
      <SearchInput aria-label="Search documentation" size="lg" value={query} onValueChange={setQuery} loading={loading} />
      <p className="h-5 px-1 text-[13px] text-muted-foreground" aria-live="polite">
        {!query ? "Type to search." : loading ? "Searching…" : `${count} results`}
      </p>
    </div>
  );
}
