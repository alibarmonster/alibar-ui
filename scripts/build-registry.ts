import fs from "node:fs/promises";
import path from "node:path";
import { siteConfig } from "../src/config/site";
import { readyComponents } from "../src/content/components";
import { buildRegistryItem } from "../src/lib/docs/install";

/**
 * Writes registry.json (shadcn registry format) from the component catalog.
 * `shadcn build` then turns it into public/r/<slug>.json.
 */
async function main() {
  const items = [];
  for (const entry of readyComponents) items.push(await buildRegistryItem(entry));

  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: siteConfig.shortName,
    homepage: siteConfig.url,
    items,
  };

  await fs.writeFile(path.join(process.cwd(), "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
  console.log(`registry.json: ${items.length} item(s) for ${siteConfig.url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
