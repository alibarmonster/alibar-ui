/**
 * Public origin of the site. Registry URLs, install commands, the sitemap and OG images are
 * built from it, so set NEXT_PUBLIC_SITE_URL (see .env.example) before a production build.
 */
function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "alibar/ui",
  shortName: "alibar",
  /** Current release. Keep in sync with package.json (`bun run check` verifies it). */
  version: "0.4.0",
  description:
    "Animated, accessible React components for Next.js and Tailwind CSS. Copy, paste, or install with the shadcn CLI.",
  url: resolveSiteUrl(),
  github: "https://github.com/alibarmonster/alibar-ui",
};

/** Absolute URL of a component's shadcn registry item. */
export function registryUrl(slug: string) {
  return `${siteConfig.url}/r/${slug}.json`;
}
