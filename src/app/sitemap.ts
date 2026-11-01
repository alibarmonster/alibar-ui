import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { readyComponents } from "@/content/components";

const PAGES = ["", "/components", "/docs", "/docs/installation", "/docs/theming", "/docs/motion"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    ...PAGES.map((path) => ({
      url: `${siteConfig.url}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...readyComponents.map((entry) => ({
      url: `${siteConfig.url}/components/${entry.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
