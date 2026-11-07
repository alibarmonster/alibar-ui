import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Accessibility, Gauge, PackageOpen } from "lucide-react";
import { HeroHeadline } from "@/components/site/hero-headline";
import { NewBadge } from "@/components/site/sidebar-nav";
import { FeaturedBento } from "@/components/site/featured-bento";
import { HeroBackdrop } from "@/components/site/hero-backdrop";
import { CategoryMarquee, ClosingBand, ReleaseShowcase } from "@/components/site/landing-showcase";
import { SiteCopyButton } from "@/components/site/site-copy-button";
import { registryUrl, siteConfig } from "@/config/site";
import { categories, components, readyComponents } from "@/content/components";
import { cn } from "@/lib/utils";
import { releases } from "@/content/changelog";

const principles = [
  {
    icon: Gauge,
    title: "Motion with intent",
    body: "One set of durations, curves and springs drives every component, so the whole library moves as a system.",
  },
  {
    icon: Accessibility,
    title: "Accessible by default",
    body: "Keyboard support, correct ARIA, visible focus and a reduced-motion fallback ship with every component.",
  },
  {
    icon: PackageOpen,
    title: "Yours to own",
    body: "Install with the shadcn CLI or copy the source. No runtime package, no lock-in, no global state.",
  },
];

// Structured data: the site, and the library as source code.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url, description: siteConfig.description },
    {
      "@type": "SoftwareSourceCode",
      name: siteConfig.name,
      description: siteConfig.description,
      codeRepository: siteConfig.github,
      programmingLanguage: ["TypeScript", "React"],
      runtimePlatform: "Next.js",
      license: "https://opensource.org/licenses/MIT",
    },
  ],
};

/** The last category card fills the rest of its row, so the grid never ends on a lone card. */
const MD_SPAN: Record<number, string> = { 1: "", 2: "md:col-span-2", 3: "md:col-span-3" };
const XL_SPAN: Record<number, string> = { 1: "xl:col-span-1", 2: "xl:col-span-2", 3: "xl:col-span-3", 4: "xl:col-span-4", 5: "xl:col-span-5", 6: "xl:col-span-6", 7: "xl:col-span-7" };

export default function HomePage() {
  const installCommand = `npx shadcn@latest add ${registryUrl("spring-press-button")}`;
  // The latest shipped (dated) release: its components and the categories it introduces.
  const shipped = releases.find((r) => r.date)?.version ?? siteConfig.version;
  const newComponents = readyComponents.filter((c) => c.version === shipped);
  const newCategories = categories.filter((category) => newComponents.some((c) => c.category === category.id));
  const counted = categories.map((c) => ({ id: c.id, name: c.name, count: readyComponents.filter((r) => r.category === c.id).length }));
  const marqueeRows = [counted.filter((_, i) => i % 2 === 0), counted.filter((_, i) => i % 2 === 1)];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden border-b border-border">
        <HeroBackdrop />
        {/* The copy lets the pointer through to the background (the koi follow it); its controls take it back. */}
        <div className="pointer-events-none relative mx-auto flex w-full max-w-[1400px] flex-col items-center px-4 pt-16 pb-28 text-center sm:px-6 sm:pt-20 [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_code]:pointer-events-auto">
          <Link
            href="/changelog"
            className="hero-rise focus-ring group mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/90 py-1 pr-3 pl-1 text-[13px] text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
          >
            <NewBadge />
            v{shipped} is out: 3D galleries, markets, navbars
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>

          <HeroHeadline words={["Components", "that", "feel"]} emphasis="alive." />

          <p
            className="hero-rise mt-7 max-w-xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg sm:leading-8"
            style={{ "--delay": "300ms" } as CSSProperties}
          >
            {readyComponents.length} animated, accessible React components built with Motion and Tailwind CSS. Copy the
            source or install any of them with the shadcn CLI.
          </p>

          <div
            className="hero-rise mt-9 flex flex-col items-center gap-3 sm:flex-row"
            style={{ "--delay": "380ms" } as CSSProperties}
          >
            <Link
              href="/components"
              className="focus-ring group inline-flex h-11 items-center gap-2 rounded-[10px] bg-foreground px-5 text-sm font-medium text-background shadow-md transition-[transform,background-color] hover:bg-foreground/85 active:scale-[0.98]"
            >
              Browse components
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="/docs"
              className="focus-ring inline-flex h-11 items-center rounded-[10px] border border-border bg-background px-5 text-sm font-medium text-foreground shadow-xs transition-[transform,background-color] hover:bg-surface active:scale-[0.98]"
            >
              Read the docs
            </Link>
          </div>

          <div
            className="hero-rise mt-10 flex w-full max-w-md items-center gap-2 rounded-[10px] border border-border bg-background/90 py-1 pr-1 pl-3.5 shadow-sm backdrop-blur"
            style={{ "--delay": "460ms" } as CSSProperties}
          >
            <span className="font-mono text-[13px] text-muted-foreground select-none" aria-hidden="true">
              $
            </span>
            <code className="min-w-0 flex-1 truncate text-left font-mono text-[13px] text-foreground">
              {installCommand}
            </code>
            <SiteCopyButton value={installCommand} variant="ghost" size="sm" aria-label="Copy install command" />
          </div>

          <ul
            className="hero-rise mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[12px] text-muted-foreground"
            style={{ "--delay": "540ms" } as CSSProperties}
          >
            {[`${readyComponents.length} components`, `${categories.length} categories`, "React 19 + Tailwind v4", "MIT licensed"].map((fact, i) => (
              <li key={fact} className="flex items-center gap-5">
                {i > 0 ? <span aria-hidden="true" className="size-1 rounded-full bg-border" /> : null}
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border py-10" aria-label="Categories">
        <CategoryMarquee rows={marqueeRows} />
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pt-20 sm:px-6 sm:pt-28" aria-labelledby="new-heading">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <NewBadge /> Latest release
            </p>
            <h2 id="new-heading" className="mt-3 max-w-2xl text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-5xl">
              v{shipped}: galleries, markets, billing and the HTML-in-Canvas era.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
              {newComponents.length} new components across {newCategories.length} categories. Every tile below is the real thing, so drag, hover and click
              away.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
            {newCategories.map((category) => (
              <Link
                key={category.id}
                href={`/components?category=${category.id}`}
                className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] text-foreground transition-colors hover:bg-surface"
              >
                {category.name}
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{newComponents.filter((c) => c.category === category.id).length}</span>
              </Link>
            ))}
          </div>
        </div>
        <ReleaseShowcase />
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pt-20 sm:px-6 sm:pt-24" aria-labelledby="featured-heading">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              The classics, live.
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">
              Where it started: hover the dock, flip the switches, hold the button, type the code. Every tile is the real component.
            </p>
          </div>
          <Link
            href="/components"
            className="focus-ring group inline-flex items-center gap-1.5 self-start rounded-md text-sm font-medium text-foreground sm:self-auto"
          >
            All {readyComponents.length} components
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
        <FeaturedBento />
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 sm:py-24" aria-labelledby="categories-heading">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {categories.length} categories. One motion language.
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">
              From buttons and inputs to charts and AI widgets, every piece shares the same tokens, radius, shadows and
              curves.
            </p>
          </div>
          <p className="font-mono text-sm text-muted-foreground tabular-nums">{readyComponents.length} components and counting</p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
          {categories.map((category, index) => {
            const items = components.filter((c) => c.category === category.id);
            const ready = items.filter((c) => c.status === "ready").length;
            const last = index === categories.length - 1;
            return (
              <li key={category.id} className={last ? cn(MD_SPAN[3 - ((categories.length - 1) % 3)], XL_SPAN[7 - ((categories.length - 1) % 7)]) : undefined}>
                <Link
                  href={`/components?category=${category.id}`}
                  className="focus-ring group flex h-full flex-col rounded-[14px] border border-border bg-surface p-4 transition-[box-shadow,background-color] duration-300 hover:bg-background hover:shadow-md"
                >
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-6 text-[15px] font-medium text-foreground">{category.name}</span>
                  <span className="mt-1 text-[13px] leading-5 text-muted-foreground">{category.description}</span>
                  <span className="mt-auto flex items-center gap-1 pt-5" aria-label={`${ready} of ${items.length} ready`}>
                    {items.map((item) => (
                      <span
                        key={item.slug}
                        className={
                          item.status === "ready"
                            ? "h-1.5 flex-1 rounded-full bg-foreground"
                            : "h-1.5 flex-1 rounded-full bg-border"
                        }
                      />
                    ))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-border bg-surface" aria-labelledby="principles-heading">
        <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6">
          <h2 id="principles-heading" className="sr-only">
            Principles
          </h2>
          <ul className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {principles.map((principle) => (
              <li key={principle.title}>
                <span className="flex size-10 items-center justify-center rounded-[10px] border border-border bg-background shadow-xs">
                  <principle.icon className="size-[18px] text-foreground" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-medium text-foreground">{principle.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{principle.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ClosingBand count={readyComponents.length} />
    </>
  );
}
