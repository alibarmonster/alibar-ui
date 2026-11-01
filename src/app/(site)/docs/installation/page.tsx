import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock, InstallTabs } from "@/components/site/code-block";
import { Callout, PageHeader, Pager, Prose, SectionHeading, Step, Steps } from "@/components/site/docs-blocks";
import { DocsPage } from "@/components/site/docs-layout";
import { TableOfContents } from "@/components/site/toc";
import { registryUrl } from "@/config/site";
import { readyComponents } from "@/content/components";
import { readProjectFile } from "@/lib/docs/source";

export const metadata: Metadata = {
  title: "Installation",
  description: "Set up a project and add your first component.",
};

const toc = [
  { id: "requirements", title: "Requirements" },
  { id: "cli", title: "Install with the CLI" },
  { id: "manual", title: "Manual setup" },
];

const usage = `import { CopyButton } from "@/components/ui/copy-button/copy-button";

export default function Page() {
  return <CopyButton value="Hello" label="Copy" />;
}`;

export default async function InstallationPage() {
  const [utils, motion] = await Promise.all([readProjectFile("src/lib/utils.ts"), readProjectFile("src/lib/motion.ts")]);
  const example = readyComponents[0]?.slug ?? "copy-button";

  return (
    <DocsPage toc={<TableOfContents items={toc} />}>
      <PageHeader title="Installation" description="Add components with the shadcn CLI, or copy them in by hand." />

      <SectionHeading id="requirements" className="mt-0">
        Requirements
      </SectionHeading>
      <Prose>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-border">
          <li>React 19 and TypeScript. Next.js (App Router) is assumed, but any React 19 setup works.</li>
          <li>Tailwind CSS v4.</li>
          <li>
            A <code>components.json</code> created by <code>shadcn init</code> if you want to use the CLI.
          </li>
        </ul>
      </Prose>

      <SectionHeading id="cli">Install with the CLI</SectionHeading>
      <Steps>
        <Step title="Initialize shadcn (skip if you already use it)">
          <InstallTabs kind="dlx" command="shadcn@latest init" />
        </Step>
        <Step title="Add a component by URL">
          <p className="text-sm leading-6 text-muted-foreground">
            Every component page lists its own command. The CLI writes the component, the shared motion tokens and
            any theme tokens it needs, and installs its dependencies.
          </p>
          <InstallTabs kind="dlx" command={`shadcn@latest add ${registryUrl(example)}`} />
        </Step>
        <Step title="Use it">
          <CodeBlock code={usage} title="app/page.tsx" />
        </Step>
      </Steps>

      <SectionHeading id="manual">Manual setup</SectionHeading>
      <Steps>
        <Step title="Install the shared dependencies">
          <InstallTabs kind="packages" packages={["motion", "lucide-react", "clsx", "tailwind-merge"]} />
        </Step>
        <Step title="Add the cn() helper">
          <CodeBlock code={utils} lang="ts" title="lib/utils.ts" />
        </Step>
        <Step title="Add the motion tokens">
          <p className="text-sm leading-6 text-muted-foreground">
            Durations, curves and springs live in one file. Components import them, so the whole library moves
            the same way. <Link href="/docs/motion" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">Read the motion guidelines</Link>.
          </p>
          <CodeBlock code={motion} lang="ts" title="lib/motion.ts" collapsible />
        </Step>
        <Step title="Add the theme tokens">
          <p className="text-sm leading-6 text-muted-foreground">
            Components use the shadcn token names. If your project doesn&apos;t define them yet, copy the variables
            from <Link href="/docs/theming" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">Theming</Link>.
          </p>
        </Step>
        <Step title="Copy a component">
          <p className="text-sm leading-6 text-muted-foreground">
            Open any component, expand <em>Manual</em> under Installation, and paste the source into{" "}
            <code className="rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">components/ui/&lt;name&gt;/&lt;name&gt;.tsx</code>.
          </p>
        </Step>
      </Steps>

      <Callout className="mt-10">
        Components that need a client runtime start with <code className="font-mono text-[0.85em] text-foreground">&quot;use client&quot;</code>.
        Everything else stays a server component.
      </Callout>

      <Pager prev={{ href: "/docs", title: "Introduction" }} next={{ href: "/docs/theming", title: "Theming" }} />
    </DocsPage>
  );
}
