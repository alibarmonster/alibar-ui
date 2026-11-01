import { registryUrl } from "../../config/site";
import type { ComponentEntry } from "../../content/components";
import {
  componentFiles,
  EXTRA_TOKENS,
  extractDependencies,
  extractExtraTokens,
  readProjectFile,
  type ExtraToken,
} from "./source";

/** Shared lib files that ship inside each registry item that imports them. */
const LIB_FILES: Record<string, string> = {
  "@/lib/motion": "src/lib/motion.ts",
  "@/lib/color": "src/lib/color.ts",
  "@/lib/webgl/use-shader-canvas": "src/lib/webgl/use-shader-canvas.ts",
  "@/lib/webgl/noise.glsl": "src/lib/webgl/noise.glsl.ts",
  "@/lib/web3/format": "src/lib/web3/format.ts",
};

const UTILS_PACKAGES = ["clsx", "tailwind-merge"];

export interface InstallInfo {
  /** npm packages the component imports directly or through shipped lib files. */
  packages: string[];
  /** Packages for a manual install, including what `cn()` needs. */
  manualPackages: string[];
  registryDependencies: string[];
  /** Lib files shipped alongside the component, e.g. src/lib/motion.ts. */
  libFiles: string[];
  tokens: ExtraToken[];
}

export async function getInstallInfo(slug: string): Promise<InstallInfo> {
  const packages = new Set<string>();
  const registryDependencies = new Set<string>();
  const libFiles = new Set<string>();
  const tokens = new Set<ExtraToken>();
  let usesUtils = false;

  async function visit(source: string, origin: string) {
    const deps = extractDependencies(source);
    deps.packages.forEach((p) => packages.add(p));
    extractExtraTokens(source).forEach((t) => tokens.add(t));

    for (const spec of deps.local) {
      if (spec === "@/lib/utils") {
        usesUtils = true;
        registryDependencies.add("utils");
        continue;
      }
      const libFile = LIB_FILES[spec];
      if (libFile) {
        if (!libFiles.has(libFile)) {
          libFiles.add(libFile);
          await visit(await readProjectFile(libFile), libFile);
        }
        continue;
      }
      const sibling = spec.match(/^@\/components\/ui\/([\w-]+)\/\1$/);
      if (sibling) {
        registryDependencies.add(registryUrl(sibling[1]));
        continue;
      }
      throw new Error(`Unsupported import "${spec}" in ${origin}. Registry components may only import npm packages, @/lib/utils, the shared lib files (${Object.keys(LIB_FILES).join(", ")}) or other @/components/ui components. Demo-only modules such as @/lib/web3/mock must stay in demos.`);
    }
  }

  const file = componentFiles(slug).component;
  await visit(await readProjectFile(file), file);

  const sortedPackages = [...packages].sort();
  return {
    packages: sortedPackages,
    manualPackages: [...new Set([...sortedPackages, ...(usesUtils ? UTILS_PACKAGES : [])])].sort(),
    registryDependencies: [...registryDependencies].sort(),
    libFiles: [...libFiles].sort(),
    tokens: [...tokens].sort(),
  };
}

export function tokenCssVars(tokens: ExtraToken[]) {
  if (tokens.length === 0) return undefined;
  return {
    theme: Object.fromEntries(tokens.map((t) => [`color-${t}`, `var(--${t})`])),
    light: Object.fromEntries(tokens.map((t) => [t, EXTRA_TOKENS[t].light])),
    dark: Object.fromEntries(tokens.map((t) => [t, EXTRA_TOKENS[t].dark])),
  };
}

export async function buildRegistryItem(entry: ComponentEntry) {
  const info = await getInstallInfo(entry.slug);
  const cssVars = tokenCssVars(info.tokens);
  return {
    name: entry.slug,
    type: "registry:ui",
    title: entry.name,
    description: entry.description,
    categories: [entry.category],
    dependencies: info.packages,
    registryDependencies: info.registryDependencies,
    files: [
      { path: componentFiles(entry.slug).component, type: "registry:ui" },
      ...info.libFiles.map((path) => ({ path, type: "registry:lib" })),
    ],
    ...(cssVars ? { cssVars } : {}),
  };
}
