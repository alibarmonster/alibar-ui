"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { OrbitingCircles } from "@/components/ui/orbiting-circles/orbiting-circles";
import { placeholderBrands } from "@/components/site/placeholder-logos";

const SwapShowcase = dynamic(() => import("./whats-new-tiles").then((m) => m.SwapShowcase), { ssr: false });

/** Mounts children once the placeholder nears the viewport. */
function WhenNear({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {shown ? children : null}
    </div>
  );
}

const apps = (from: number, to: number) => placeholderBrands.slice(from, to).map((brand) => ({ name: brand.name, icon: <brand.Mark /> }));

export function SwapPanel() {
  return (
    <WhenNear className="flex min-h-[600px] w-full items-start justify-center">
      <SwapShowcase />
    </WhenNear>
  );
}

export function OrbitPanel() {
  return (
    <OrbitingCircles
      designSize={420}
      center={
        <span className="grid size-14 place-items-center rounded-2xl bg-foreground text-background shadow-lg">
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-label="alibar/ui">
            <path d="M6.5 16.75c2.6 0 3.7-1.5 4.6-4.1l.5-1.4c.9-2.5 2-4 4.9-4" />
          </svg>
        </span>
      }
      rings={[
        { radius: 95, duration: 28, items: apps(0, 4) },
        { radius: 175, duration: 44, reverse: true, iconSize: 44, items: apps(4, 11) },
      ]}
    />
  );
}

export function ShowcaseLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="focus-ring group inline-flex items-center gap-1 rounded-md text-sm font-medium text-foreground">
      {children}
      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
    </Link>
  );
}
