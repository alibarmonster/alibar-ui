export const packageManagers = ["npm", "pnpm", "bun", "yarn"] as const;
export type PackageManager = (typeof packageManagers)[number];

/** Run a package binary without installing it, e.g. `shadcn@latest add …`. */
export function dlxCommand(pm: PackageManager, command: string) {
  const runner = { npm: "npx", pnpm: "pnpm dlx", bun: "bunx --bun", yarn: "yarn dlx" }[pm];
  return `${runner} ${command}`;
}

export function installPackagesCommand(pm: PackageManager, packages: string[]) {
  const verb = { npm: "npm install", pnpm: "pnpm add", bun: "bun add", yarn: "yarn add" }[pm];
  return `${verb} ${packages.join(" ")}`;
}
