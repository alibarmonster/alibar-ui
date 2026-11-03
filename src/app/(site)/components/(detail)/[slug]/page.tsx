import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CodeBlock, InstallTabs } from "@/components/site/code-block";
import { ComponentPreview } from "@/components/site/component-preview";
import { Callout, PageHeader, Pager, PropsTable, SectionHeading, Step, Steps } from "@/components/site/docs-blocks";
import { DocsPage } from "@/components/site/docs-layout";
import { HtmlCanvasNotice } from "@/components/site/html-canvas-status";
import { NewBadge } from "@/components/site/sidebar-nav";
import { TableOfContents, type TocItem } from "@/components/site/toc";
import { registryUrl, siteConfig } from "@/config/site";
import { getCategory, getComponent, getSiblings, readyComponents } from "@/content/components";
import { docsLoaders } from "@/content/docs";
import { highlight } from "@/lib/docs/highlight";
import { getInstallInfo } from "@/lib/docs/install";
import { componentFiles, EXTRA_TOKENS, extractDemoVariants, extractProps, readProjectFile } from "@/lib/docs/source";

export const dynamicParams = false;

export function generateStaticParams() {
  return readyComponents.map((entry) => ({ slug: entry.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const entry = getComponent((await params).slug);
  if (!entry) return {};
  return {
    title: entry.name,
    description: `${entry.description} An animated, accessible React component you can copy or install with the shadcn CLI.`,
    // Metadata merges shallowly, so restate the site-wide Open Graph fields alongside the override.
    openGraph: { type: "article", siteName: siteConfig.name, locale: "en_US" },
  };
}

export default async function ComponentPage({ params }: Params) {
  const { slug } = await params;
  const entry = getComponent(slug);
  const loadDocs = docsLoaders[slug];
  if (!entry || entry.status !== "ready" || !loadDocs) notFound();

  const files = componentFiles(slug);
  const [componentSource, demoSource, { docs }, install] = await Promise.all([
    readProjectFile(files.component),
    readProjectFile(files.demo),
    loadDocs(),
    getInstallInfo(slug),
  ]);

  const variants = await Promise.all(
    // Only what the client needs: the highlighted HTML doubles as the copy source.
    extractDemoVariants(demoSource).map(async ({ name, label, code }) => ({
      name,
      label,
      lines: code.trimEnd().split("\n").length,
      html: await highlight(code),
    })),
  );
  const propGroups = extractProps(componentSource);
  const category = getCategory(entry.category);
  const { prev, next } = getSiblings(slug);
  const libFiles = await Promise.all(
    install.libFiles.map(async (path) => ({ path, source: await readProjectFile(path) })),
  );
  const tokenCss = install.tokens.length
    ? [
        ":root {",
        ...install.tokens.map((t) => `  --${t}: ${EXTRA_TOKENS[t].light};`),
        "}",
        "",
        ".dark {",
        ...install.tokens.map((t) => `  --${t}: ${EXTRA_TOKENS[t].dark};`),
        "}",
        "",
        "@theme inline {",
        ...install.tokens.map((t) => `  --color-${t}: var(--${t});`),
        "}",
      ].join("\n")
    : null;

  const toc: TocItem[] = [
    { id: "installation", title: "Installation" },
    { id: "usage", title: "Usage" },
    { id: "api", title: "API reference" },
    { id: "accessibility", title: "Accessibility" },
  ];

  return (
    <DocsPage toc={<TableOfContents items={toc} />}>
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <Link href="/components" className="focus-ring rounded-sm hover:text-foreground">
          Components
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <Link href={`/components?category=${category.id}`} className="focus-ring rounded-sm hover:text-foreground">
          {category.name}
        </Link>
      </nav>

      <PageHeader
        title={entry.name}
        description={entry.description}
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-full border border-border bg-surface px-2.5 text-xs font-medium text-muted-foreground">
              {category.name}
            </span>
            {entry.isNew ? <NewBadge /> : null}
          </span>
        }
      />

      {entry.category === "html-canvas" ? <HtmlCanvasNotice className="mb-6" /> : null}

      <ComponentPreview
        slug={slug}
        variants={variants}
        copy={{ name: entry.name, description: entry.description, install: `npx shadcn@latest add ${registryUrl(slug)}`, usage: docs.usage, source: componentSource }}
      />

      <SectionHeading id="installation">Installation</SectionHeading>
      <h3 className="mb-3 text-[15px] font-semibold text-foreground">CLI</h3>
      <InstallTabs kind="dlx" command={`shadcn@latest add ${registryUrl(slug)}`} />

      <h3 id="manual" className="mt-10 mb-5 scroll-mt-24 text-[15px] font-semibold text-foreground">
        Manual
      </h3>
      <Steps>
        <Step title="Install the dependencies">
          <InstallTabs kind="packages" packages={install.manualPackages} />
        </Step>
        <Step title="Add the shared helpers">
          <p className="text-sm leading-6 text-muted-foreground">
            Components use <code className="rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">cn()</code>{" "}
            from <code className="rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">lib/utils.ts</code>
            {libFiles.length ? " and the motion tokens below" : ""}. See{" "}
            <Link href="/docs/installation" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
              Installation
            </Link>{" "}
            if you have not set them up yet.
          </p>
          {libFiles.map((file) => (
            <CodeBlock key={file.path} code={file.source} lang="ts" title={file.path.replace(/^src\//, "")} collapsible />
          ))}
        </Step>
        {tokenCss ? (
          <Step title="Add the theme tokens">
            <p className="text-sm leading-6 text-muted-foreground">
              This component uses {install.tokens.map((t) => `--${t}`).join(" and ")}, which shadcn does not define by
              default. Add it to your global CSS:
            </p>
            <CodeBlock code={tokenCss} lang="css" title="app/globals.css" />
          </Step>
        ) : null}
        <Step title="Copy the source">
          <CodeBlock code={componentSource} title={files.component.replace(/^src\//, "")} collapsible />
        </Step>
      </Steps>

      <SectionHeading id="usage">Usage</SectionHeading>
      <CodeBlock code={docs.usage} />

      <SectionHeading id="api">API reference</SectionHeading>
      <PropsTable groups={propGroups} />
      {docs.notes?.length ? (
        <Callout className="mt-5">
          <ul className="list-disc space-y-1 pl-4">
            {docs.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Callout>
      ) : null}

      <SectionHeading id="accessibility">Accessibility</SectionHeading>
      <ul className="space-y-2.5 text-[15px] leading-7 text-muted-foreground">
        {docs.a11y.map((note) => (
          <li key={note} className="flex gap-3">
            <span aria-hidden="true" className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-border" />
            <span>{note}</span>
          </li>
        ))}
      </ul>

      <Pager
        prev={prev ? { href: `/components/${prev.slug}`, title: prev.name } : undefined}
        next={next ? { href: `/components/${next.slug}`, title: next.name } : undefined}
      />
    </DocsPage>
  );
}
