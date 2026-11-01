import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { components, readyComponents } from "../src/content/components";
import { getInstallInfo } from "../src/lib/docs/install";
import { componentFiles, extractDemoVariants, extractProps } from "../src/lib/docs/source";

/**
 * Verifies every "ready" component is wired up end to end: source, demo,
 * docs, loader maps, documented props and a buildable registry item.
 */
const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const demoMap = read("src/content/demos.ts");
const docsMap = read("src/content/docs.ts");
const failures: string[] = [];

assert.equal(components.length, 100, "The catalog should list 100 components");
assert.equal(new Set(components.map((c) => c.slug)).size, components.length, "Slugs must be unique");

async function check(slug: string) {
  const files = componentFiles(slug);
  for (const file of Object.values(files)) {
    if (!fs.existsSync(path.join(process.cwd(), file))) throw new Error(`missing ${file}`);
  }
  const source = read(files.component);
  if (!source.startsWith('"use client"') && /\buse(State|Effect|Ref|ReducedMotion)\b|motion\//.test(source)) {
    throw new Error(`${files.component} uses client APIs but has no "use client" directive`);
  }
  if (!extractDemoVariants(read(files.demo)).length) throw new Error("demo.tsx exports no variants");
  const props = extractProps(source).flatMap((g) => g.props);
  if (!props.length) throw new Error("no exported *Props interface found");
  const undocumented = props.filter((p) => !p.description).map((p) => p.name);
  if (undocumented.length) throw new Error(`props without JSDoc: ${undocumented.join(", ")}`);
  if (!demoMap.includes(`"${slug}"`)) throw new Error("not registered in src/content/demos.ts");
  if (!docsMap.includes(`"${slug}"`)) throw new Error("not registered in src/content/docs.ts");
  await getInstallInfo(slug);
}

async function main() {
  for (const entry of readyComponents) {
    try {
      await check(entry.slug);
    } catch (error) {
      failures.push(`${entry.slug}: ${(error as Error).message}`);
    }
  }
  if (failures.length) {
    console.error(failures.map((f) => `✗ ${f}`).join("\n"));
    process.exit(1);
  }
  console.log(`✔ ${readyComponents.length}/${components.length} components ready and fully wired.`);
}

main();
