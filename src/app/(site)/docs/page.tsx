import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, Pager, Prose, SectionHeading } from "@/components/site/docs-blocks";
import { DocsPage } from "@/components/site/docs-layout";
import { TableOfContents } from "@/components/site/toc";
import { siteConfig } from "@/config/site";
import { categories, components, readyComponents } from "@/content/components";

export const metadata: Metadata = {
  title: "Introduction",
  description: "What alibar/ui is and the principles behind it.",
};

const toc = [
  { id: "principles", title: "Principles" },
  { id: "how-it-works", title: "How it works" },
  { id: "categories", title: "Categories" },
];

export default function IntroductionPage() {
  return (
    <DocsPage toc={<TableOfContents items={toc} />}>
      <PageHeader
        title="Introduction"
        description={`${siteConfig.name} is a library of ${readyComponents.length} animated, accessible React components. You don't install it as a package. You copy each component into your codebase and own it from there.`}
      />

      <Prose>
        <p>
          Every component is built with <strong>React 19</strong>, <strong>Tailwind CSS v4</strong> and{" "}
          <strong>Motion</strong>, and is styled with the same tokens as shadcn/ui. A component you install looks
          at home in an existing shadcn project, and picks up your colors and radius without extra work.
        </p>
      </Prose>

      <SectionHeading id="principles">Principles</SectionHeading>
      <Prose>
        <ul className="list-disc space-y-2 pl-5 marker:text-border">
          <li>
            <strong>Motion has a job.</strong> Animation explains where something came from, confirms an action,
            or shows a change in state. If it does none of those, it doesn&apos;t ship.
          </li>
          <li>
            <strong>Compositor-only animation.</strong> Components animate transform, opacity, filter and
            clip-path, and never width, height, top or left directly. Size changes use layout animations or the
            grid-rows technique.
          </li>
          <li>
            <strong>Accessible by default.</strong> Full keyboard support, visible focus, correct roles and labels,
            and a reduced-motion path that replaces movement with simple fades.
          </li>
          <li>
            <strong>One component, one folder.</strong> No global state and no external images. Remote assets are
            replaced with generated gradients and SVG.
          </li>
        </ul>
      </Prose>

      <SectionHeading id="how-it-works">How it works</SectionHeading>
      <Prose>
        <p>
          Each component page has a live preview, its demo code, an install command for the shadcn CLI, the full
          source for manual installs, and a props table generated from the component&apos;s own TypeScript types.
        </p>
        <p>
          The CLI copies the component into <code>components/ui/&lt;name&gt;/</code>, along with the shared{" "}
          <code>lib/motion.ts</code> tokens it imports, and installs its npm dependencies. Start with{" "}
          <Link href="/docs/installation">Installation</Link>, then read <Link href="/docs/motion">Motion</Link> to
          learn the shared vocabulary.
        </p>
      </Prose>

      <SectionHeading id="categories">Categories</SectionHeading>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {categories.map((category) => {
          const count = components.filter((c) => c.category === category.id).length;
          return (
            <li key={category.id}>
              <Link
                href={`/components?category=${category.id}`}
                className="focus-ring group flex h-full items-start justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-surface"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">{category.name}</span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{category.description}</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums">
                  {count}
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Pager next={{ href: "/docs/installation", title: "Installation" }} />
    </DocsPage>
  );
}
