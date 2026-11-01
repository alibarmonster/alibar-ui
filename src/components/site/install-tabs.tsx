"use client";

import { SiteCopyButton } from "@/components/site/site-copy-button";
import { packageManagers, type PackageManager } from "./package-manager";
import { usePackageManager } from "./use-package-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export function InstallTabsClient({ commands }: { commands: Record<PackageManager, { text: string; html: string }> }) {
  const [packageManager, setPackageManager] = usePackageManager();

  return (
    <Tabs
      value={packageManager}
      onValueChange={(value) => setPackageManager(value as PackageManager)}
      variant="underline"
      className="code-block overflow-hidden rounded-xl border border-border bg-background"
    >
      <div className="flex h-11 items-center justify-between gap-2 border-b border-border bg-surface pr-1.5 pl-2">
        <TabsList aria-label="Package manager">
          {packageManagers.map((pm) => (
            <TabsTrigger key={pm} value={pm} className="font-mono text-xs">
              {pm}
            </TabsTrigger>
          ))}
        </TabsList>
        <SiteCopyButton value={commands[packageManager].text} variant="ghost" size="sm" aria-label="Copy command" />
      </div>
      {packageManagers.map((pm) => (
        <TabsContent key={pm} value={pm} className="rounded-b-xl">
          <div dangerouslySetInnerHTML={{ __html: commands[pm].html }} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
