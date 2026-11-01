import { FileCode2, Terminal } from "lucide-react";
import { highlight, type CodeLanguage } from "@/lib/docs/highlight";
import { CodeFrame } from "./code-frame";
import { InstallTabsClient } from "./install-tabs";
import { dlxCommand, installPackagesCommand, packageManagers, type PackageManager } from "./package-manager";

export async function CodeBlock({
  code,
  lang = "tsx",
  title,
  collapsible,
  className,
}: {
  code: string;
  lang?: CodeLanguage;
  title?: string;
  collapsible?: boolean;
  className?: string;
}) {
  const html = await highlight(code, lang);
  const icon =
    lang === "bash" ? (
      <Terminal className="size-3.5" aria-hidden="true" />
    ) : (
      <FileCode2 className="size-3.5" aria-hidden="true" />
    );
  return (
    <CodeFrame
      html={html}
      lines={code.trimEnd().split("\n").length}
      title={title}
      icon={title ? icon : undefined}
      collapsible={collapsible}
      className={className}
    />
  );
}

/** A shell command rendered once per package manager, with tabs to switch. */
export async function InstallTabs(
  props: { kind: "dlx"; command: string } | { kind: "packages"; packages: string[] },
) {
  const entries = await Promise.all(
    packageManagers.map(async (pm) => {
      const text = props.kind === "dlx" ? dlxCommand(pm, props.command) : installPackagesCommand(pm, props.packages);
      return [pm, { text, html: await highlight(text, "bash") }] as const;
    }),
  );
  return <InstallTabsClient commands={Object.fromEntries(entries) as Record<PackageManager, { text: string; html: string }>} />;
}
