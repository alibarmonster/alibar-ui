import type { Metadata } from "next";
import { CodeBlock } from "@/components/site/code-block";
import { PageHeader, Pager, Prose, SectionHeading } from "@/components/site/docs-blocks";
import { DocsPage } from "@/components/site/docs-layout";
import { TableOfContents } from "@/components/site/toc";
import { readProjectFile } from "@/lib/docs/source";

export const metadata: Metadata = {
  title: "Theming",
  description: "Color, radius and shadow tokens.",
};

const toc = [
  { id: "colors", title: "Colors" },
  { id: "radius", title: "Radius" },
  { id: "shadows", title: "Shadows" },
  { id: "css", title: "CSS variables" },
];

const roles: Record<string, string> = {
  background: "Page background",
  foreground: "Primary text",
  surface: "Site chrome, preview frames",
  "surface-2": "Subtle fills, hovers",
  card: "Card surface",
  popover: "Menus, dialogs, tooltips",
  primary: "Accent, used sparingly",
  "primary-foreground": "Text on accent",
  secondary: "Secondary fills",
  muted: "Muted fills",
  "muted-foreground": "Secondary text",
  accent: "Hover and active rows",
  destructive: "Danger",
  success: "Success",
  warning: "Warning",
  "chart-1": "Chart series 1",
  "chart-2": "Chart series 2",
  "chart-3": "Chart series 3",
  "chart-4": "Chart series 4",
  "chart-5": "Chart series 5",
  border: "Hairline borders",
  input: "Input borders",
  ring: "Focus ring",
};

const radii = [
  { name: "sm", value: "6px", className: "rounded-sm" },
  { name: "md", value: "10px", className: "rounded-md" },
  { name: "lg", value: "14px", className: "rounded-lg" },
  { name: "xl", value: "20px", className: "rounded-xl" },
  { name: "full", value: "9999px", className: "rounded-full" },
];

const shadows = ["shadow-xs", "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl"];

/** Reads the :root block from globals.css so the docs never drift from the real tokens. */
async function readRootTokens() {
  const css = await readProjectFile("src/app/globals.css");
  const block = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  const tokens = [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => ({ name, value: value.trim() }));
  return { tokens, block: `:root {${block}\n}` };
}

export default async function ThemingPage() {
  const { tokens, block } = await readRootTokens();
  const colors = tokens.filter((t) => t.value.startsWith("#") && roles[t.name]);

  return (
    <DocsPage toc={<TableOfContents items={toc} />}>
      <PageHeader
        title="Theming"
        description="Components are styled with CSS variables that follow the shadcn/ui naming, so they adopt your project's theme as-is."
      />

      <Prose>
        <p>
          The palette is white and zinc with a single blue accent. The accent is exposed as <code>--primary</code>{" "}
          and <code>--ring</code>, because shadcn reserves <code>--accent</code> for subtle hover fills. Override any
          variable in your own CSS and every component follows.
        </p>
      </Prose>

      <SectionHeading id="colors">Colors</SectionHeading>
      <div className="overflow-hidden rounded-xl border border-border">
        <ul className="divide-y divide-border">
          {colors.map((token) => (
            <li key={token.name} className="flex items-center gap-4 px-4 py-3">
              <span
                className="size-9 shrink-0 rounded-md shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
                style={{ backgroundColor: token.value }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <code className="block font-mono text-[13px] font-medium text-foreground">--{token.name}</code>
                <span className="block text-[13px] text-muted-foreground">{roles[token.name]}</span>
              </span>
              <code className="font-mono text-xs text-muted-foreground uppercase">{token.value}</code>
            </li>
          ))}
        </ul>
      </div>

      <SectionHeading id="radius">Radius</SectionHeading>
      <Prose>
        <p>
          A single <code>--radius</code> of 10px drives the scale: 6, 10, 14 and 20px, plus full for pills.
        </p>
      </Prose>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {radii.map((radius) => (
          <li key={radius.name} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-4">
            <span className={`size-14 border border-border bg-background shadow-xs ${radius.className}`} aria-hidden="true" />
            <span className="text-center">
              <code className="block font-mono text-xs text-foreground">{radius.className}</code>
              <span className="text-xs text-muted-foreground">{radius.value}</span>
            </span>
          </li>
        ))}
      </ul>

      <SectionHeading id="shadows">Shadows</SectionHeading>
      <Prose>
        <p>Shadows are soft and layered: a tight contact shadow plus a wide, faint ambient one.</p>
      </Prose>
      <ul className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-5">
        {shadows.map((shadow) => (
          <li key={shadow} className="flex flex-col items-center gap-3">
            <span className={`h-16 w-full rounded-lg bg-background ${shadow}`} aria-hidden="true" />
            <code className="font-mono text-xs text-muted-foreground">{shadow}</code>
          </li>
        ))}
      </ul>

      <SectionHeading id="css">CSS variables</SectionHeading>
      <Prose className="mb-4">
        <p>
          The full set, as defined in this site&apos;s <code>globals.css</code>. Each one is mapped to a Tailwind color
          in <code>@theme inline</code>, e.g. <code>--color-primary: var(--primary)</code>.
        </p>
      </Prose>
      <CodeBlock code={block} lang="css" title="app/globals.css" collapsible />

      <Pager prev={{ href: "/docs/installation", title: "Installation" }} next={{ href: "/docs/motion", title: "Motion" }} />
    </DocsPage>
  );
}
