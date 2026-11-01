import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Accessibility, Gauge, PackageOpen } from "lucide-react";
import { HeroHeadline } from "@/components/site/hero-headline";
import { NewBadge } from "@/components/site/sidebar-nav";
import { FeaturedBento } from "@/components/site/featured-bento";
import { HeroSky } from "@/components/site/hero-sky";
import { placeholderLogos } from "@/components/site/placeholder-logos";
import { AquariumPanel, OrbitPanel, ShowcaseLink, SwapPanel } from "@/components/site/whats-new";
import { LogoGrid } from "@/components/ui/logo-grid/logo-grid";
import { SiteCopyButton } from "@/components/site/site-copy-button";
import { registryUrl, siteConfig } from "@/config/site";
import { releases } from "@/content/changelog";
import { categories, components, readyComponents } from "@/content/components";

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

export default function HomePage() {
  const installCommand = `npx shadcn@latest add ${registryUrl("spring-press-button")}`;
  const newComponents = readyComponents.filter((c) => c.version === siteConfig.version);
  const newCategories = categories.filter((category) => newComponents.some((c) => c.category === category.id));
  const release = releases.find((r) => r.version === siteConfig.version);
  const releaseDate = release?.date
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${release.date}T00:00:00Z`))
    : "soon";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="relative overflow-hidden border-b border-border">
        <HeroSky />
        <div
          aria-hidden="true"
          className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="relative mx-auto flex max-w-[1400px] flex-col items-center px-4 pt-20 pb-24 text-center sm:px-6 sm:pt-28 sm:pb-32">
          <Link
            href="/changelog"
            className="hero-rise focus-ring group mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background py-1 pr-3 pl-1 text-[13px] text-muted-foreground shadow-xs transition-colors hover:text-foreground"
          >
            <NewBadge />
            v{siteConfig.version}: Web3, shaders, marketing sections and more
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
            className="hero-rise mt-10 flex w-full max-w-md items-center gap-2 rounded-[10px] border border-border bg-background/80 py-1 pr-1 pl-3.5 shadow-xs backdrop-blur"
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
        </div>
      </section>

      <LogoGrid
        className="border-b border-border"
        eyebrow="New in v0.2.0: Logo Grid Hover Reveal. Hover or tab through the placeholder brands."
        linkLabel="View component"
        items={placeholderLogos.slice(0, 8).map((logo) => ({ ...logo, href: "/components/logo-grid" }))}
      />

      <section className="mx-auto max-w-[1400px] px-4 pt-20 sm:px-6 sm:pt-24" aria-labelledby="new-heading">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <NewBadge /> Released {releaseDate}
            </p>
            <h2 id="new-heading" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              What&apos;s new in v{siteConfig.version}
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">
              {newComponents.length} components in {newCategories.length} new categories: Web3 wallets and DeFi, marketing sections, shader and canvas
              backgrounds, and orbits and beams.
            </p>
          </div>
          <ShowcaseLink href="/changelog">Read the changelog</ShowcaseLink>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {newCategories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/components?category=${category.id}`}
                className="focus-ring group flex h-full flex-col rounded-[14px] border border-border bg-background p-4 transition-shadow hover:shadow-md"
              >
                <span className="text-sm font-medium text-foreground">{category.name}</span>
                <span className="mt-1 text-[13px] leading-5 text-muted-foreground">{category.description}</span>
                <span className="mt-auto pt-4 font-mono text-xs text-muted-foreground tabular-nums">
                  {newComponents.filter((c) => c.category === category.id).length} components
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-[20px] border border-border bg-surface p-6 sm:p-8" aria-labelledby="web3-heading">
            <h3 id="web3-heading" className="text-lg font-semibold tracking-tight text-foreground">
              Web3, with bigint math all the way down
            </h3>
            <p className="mt-1 max-w-md text-[14px] leading-6 text-muted-foreground">
              The swap widget runs on mock data here: approve, flip, tweak slippage and swap. Every state is animated, and every amount is a bigint.
            </p>
            <div className="mt-2">
              <ShowcaseLink href="/components/token-swap-widget">Token Swap Widget</ShowcaseLink>
            </div>
            <div className="mt-6">
              <SwapPanel />
            </div>
          </article>
          <article className="flex flex-col rounded-[20px] border border-border bg-surface p-6 sm:p-8" aria-labelledby="orbit-heading">
            <h3 id="orbit-heading" className="text-lg font-semibold tracking-tight text-foreground">
              Integrations that orbit your product
            </h3>
            <p className="mt-1 max-w-md text-[14px] leading-6 text-muted-foreground">
              Pure CSS keyframes: no per-frame JavaScript. Hover an icon to pause the system and read its name.
            </p>
            <div className="mt-2">
              <ShowcaseLink href="/components/orbiting-circles">Orbiting Circles</ShowcaseLink>
            </div>
            <div className="mt-6 flex flex-1 items-center">
              <OrbitPanel />
            </div>
          </article>
          <article
            className="grid grid-cols-1 items-center gap-6 rounded-[20px] border border-border bg-surface p-6 sm:p-8 lg:col-span-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10"
            aria-labelledby="aquarium-heading"
          >
            <div>
              <h3 id="aquarium-heading" className="text-lg font-semibold tracking-tight text-foreground">
                A background that listens
              </h3>
              <p className="mt-1 max-w-md text-[14px] leading-6 text-muted-foreground">
                Sea creatures drawn in glyphs on a 2D canvas. Focus the input and the ray swims over to listen. Send a question and it circles faster while it
                thinks. Click the water for a ripple.
              </p>
              <div className="mt-2">
                <ShowcaseLink href="/components/ascii-aquarium-background">ASCII Aquarium Background</ShowcaseLink>
              </div>
            </div>
            <AquariumPanel />
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pt-20 sm:px-6 sm:pt-24" aria-labelledby="featured-heading">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Try them right here.
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">
              Every tile is the real component: hover the dock, flip the switches, hold the button, type the code.
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
              Ten categories. One motion language.
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">
              From buttons and inputs to charts and AI widgets, every piece shares the same tokens, radius, shadows and
              curves.
            </p>
          </div>
          <p className="font-mono text-sm text-muted-foreground tabular-nums">{readyComponents.length} of {components.length} components</p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category, index) => {
            const items = components.filter((c) => c.category === category.id);
            const ready = items.filter((c) => c.status === "ready").length;
            return (
              <li key={category.id}>
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
    </>
  );
}
