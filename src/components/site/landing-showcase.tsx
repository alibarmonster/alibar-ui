"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { DemoRenderer } from "@/components/site/demo-renderer";
import { categories, getComponent } from "@/content/components";
import { cn } from "@/lib/utils";

/** Mounts children once the placeholder nears the viewport, so the landing page ships no demo code up front. */
export function WhenNear({ children, className, margin = "300px 0px" }: { children: ReactNode; className?: string; margin?: string }) {
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
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);
  return (
    <div ref={ref} className={className}>
      {shown ? children : null}
    </div>
  );
}

const SHOWCASE: { slug: string; demo: string; span: string; height: string; blurb: string; tint: string }[] = [
  { slug: "depth-rail", demo: "Collection", span: "lg:col-span-4", height: "h-[30rem]", blurb: "A CSS 3D coverflow with momentum, parallax and reflections.", tint: "from-sky-100/70" },
  { slug: "market-card", demo: "CardToTicket", span: "lg:col-span-2", height: "h-[30rem]", blurb: "Odds, payouts and a card that morphs into a trade ticket.", tint: "from-emerald-100/70" },
  { slug: "card-wallet", demo: "Wallet", span: "lg:col-span-2", height: "h-[28rem]", blurb: "Metal, glass and guilloche cards that catch the light.", tint: "from-amber-100/70" },
  { slug: "spend-meter", demo: "Default", span: "lg:col-span-2", height: "h-[28rem]", blurb: "Usage against a limit, with rolling totals and overflow.", tint: "from-violet-100/70" },
  { slug: "crt-terminal", demo: "Default", span: "lg:col-span-2", height: "h-[28rem]", blurb: "A real terminal on a glowing CRT, drawn with HTML in Canvas.", tint: "from-lime-100/70" },
  { slug: "morph-dropdown-nav", demo: "Default", span: "lg:col-span-4", height: "h-[30rem]", blurb: "One dropdown panel that reshapes as you move between menus.", tint: "from-slate-200/70" },
  { slug: "probability-chart", demo: "Binary", span: "lg:col-span-2", height: "h-[30rem]", blurb: "Odds over time with a snapping crosshair and annotations.", tint: "from-rose-100/70" },
];

/** A bento of live components from the release in progress. Each demo loads as it nears the viewport. */
export function ReleaseShowcase() {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-6">
      {SHOWCASE.map(({ slug, demo, span, height, blurb, tint }) => {
        const entry = getComponent(slug);
        if (!entry) return null;
        const category = categories.find((c) => c.id === entry.category)?.name;
        return (
          <li key={slug} className={cn("group/tile flex flex-col overflow-hidden rounded-[24px] border border-border bg-background shadow-xs transition-shadow duration-300 hover:shadow-lg", span)}>
            <div className={cn("relative overflow-hidden bg-gradient-to-b to-background", tint, height)}>
              <WhenNear className="flex size-full items-center justify-center overflow-hidden p-4 [&>*]:max-w-full">
                <DemoRenderer slug={slug} name={demo} />
              </WhenNear>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-border px-5 py-4">
              <div className="min-w-0">
                <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">{category}</p>
                <p className="mt-1 text-[15px] font-semibold text-foreground">{entry.name}</p>
                <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{blurb}</p>
              </div>
              <Link
                href={`/components/${slug}`}
                aria-label={`Open ${entry.name}`}
                className="focus-ring mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-[color,background-color,transform] group-hover/tile:-rotate-12 hover:bg-foreground hover:text-background"
              >
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Two rows of category names drifting in opposite directions; hovering pauses them. */
export function CategoryMarquee({ rows }: { rows: { id: string; name: string; count: number }[][] }) {
  return (
    <div className="group/marquee flex flex-col gap-3 overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      {rows.map((row, r) => (
        <div key={r} className="flex w-max gap-3 group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none" style={{ animation: `landing-marquee ${row.length * 6}s linear infinite`, animationDirection: r % 2 ? "reverse" : "normal" }}>
          {[0, 1].map((copy) =>
            row.map((c) => (
              <Link
                key={`${copy}-${c.id}`}
                href={`/components?category=${c.id}`}
                tabIndex={copy ? -1 : undefined}
                aria-hidden={copy ? true : undefined}
                className="focus-ring group/chip inline-flex shrink-0 items-center gap-3 rounded-full border border-border bg-background py-2.5 pr-3 pl-5 text-[clamp(1rem,1.6vw,1.35rem)] font-semibold tracking-tight text-foreground shadow-xs transition-colors hover:bg-foreground hover:text-background"
              >
                {c.name}
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-[12px] font-normal text-muted-foreground tabular-nums transition-colors group-hover/chip:bg-background/15 group-hover/chip:text-background">{c.count}</span>
              </Link>
            )),
          )}
        </div>
      ))}
    </div>
  );
}

const KoiPond = dynamic(() => import("@/components/ui/ascii-koi-pond/ascii-koi-pond").then((m) => m.AsciiKoiPond), { ssr: false });

/** The closing call to action, on a dark koi pond: the fish drift toward the pointer and race for food you click to drop. */
export function ClosingBand({ count }: { count: number }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0b0d10] text-white" aria-labelledby="closing-heading">
      <WhenNear className="absolute inset-0 -z-10" margin="200px 0px">
        <KoiPond palette="dark" koi={8} lilyPads={5} showCounter={false} className="size-full" />
      </WhenNear>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_45%_40%_at_50%_45%,#0b0d10_35%,transparent)] opacity-90" />
      <div className="pointer-events-none mx-auto flex max-w-[1400px] flex-col items-center px-4 py-36 text-center sm:px-6 [&_a]:pointer-events-auto">
        <h2 id="closing-heading" className="max-w-3xl text-[2.4rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-white sm:text-6xl">
          Ship interfaces that move.
        </h2>
        <p className="mt-5 max-w-lg text-base leading-7 text-white/65 sm:text-lg">
          {count} components, one motion language. Copy the source, keep the craft.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/components" className="focus-ring group inline-flex h-11 items-center gap-2 rounded-[10px] bg-white px-5 text-sm font-medium text-[#0b0d10] shadow-md transition-[transform,background-color] hover:bg-white/85 active:scale-[0.98]">
            Browse components
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <Link href="/templates" className="focus-ring inline-flex h-11 items-center rounded-[10px] border border-white/20 bg-white/5 px-5 text-sm font-medium text-white backdrop-blur transition-[transform,background-color] hover:bg-white/10 active:scale-[0.98]">
            See a template
          </Link>
        </div>
        <p className="mt-10 font-mono text-[12px] text-white/40">Tip: click the water to feed the koi.</p>
      </div>
    </section>
  );
}
