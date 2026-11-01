import type { Metadata } from "next";
import { PageHeader } from "@/components/site/docs-blocks";
import { Gallery } from "@/components/site/gallery";
import { categories, components, readyComponents } from "@/content/components";
import { componentFiles, extractDemoVariants, readProjectFile } from "@/lib/docs/source";

export const metadata: Metadata = {
  title: "Components",
  description: "Browse every animated component with a live preview.",
};

export default async function ComponentsPage() {
  // The first demo variant of each ready component powers its gallery card.
  const previews = Object.fromEntries(
    await Promise.all(
      readyComponents.map(async (entry) => {
        const variants = extractDemoVariants(await readProjectFile(componentFiles(entry.slug).demo));
        return [entry.slug, variants[0]?.name ?? ""] as const;
      }),
    ),
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-10 pb-24 sm:px-6 sm:pt-14">
      <PageHeader
        title="Components"
        description={`${readyComponents.length} animated, accessible components across ${categories.length} categories${
          components.length > readyComponents.length ? `, with ${components.length - readyComponents.length} more on the way` : ""
        }. Every one has a live preview, full source, and a one-line install.`}
      />
      <Gallery previews={previews} />
    </div>
  );
}
