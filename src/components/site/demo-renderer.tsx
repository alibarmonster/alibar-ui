"use client";

import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { demoLoaders } from "@/content/demos";

const cache = new Map<string, LazyExoticComponent<ComponentType>>();

function loadDemo(slug: string, name: string) {
  const key = `${slug}:${name}`;
  let demo = cache.get(key);
  if (!demo) {
    demo = lazy(async () => {
      const loader = demoLoaders[slug];
      if (!loader) throw new Error(`No demo registered for "${slug}" in src/content/demos.ts`);
      const mod = await loader();
      const component = mod[name];
      if (typeof component !== "function") throw new Error(`demo.tsx for "${slug}" has no export "${name}"`);
      return { default: component as ComponentType };
    });
    cache.set(key, demo);
  }
  return demo;
}

export function DemoFallback() {
  return (
    <div className="flex items-center gap-1.5" role="status" aria-label="Loading preview">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-pulse rounded-full bg-border"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

export function DemoRenderer({ slug, name }: { slug: string; name: string }) {
  return <Suspense fallback={<DemoFallback />}>{createElement(loadDemo(slug, name))}</Suspense>;
}
