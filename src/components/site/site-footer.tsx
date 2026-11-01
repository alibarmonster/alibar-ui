import Link from "next/link";
import { siteConfig } from "@/config/site";
import { categories } from "@/content/components";
import { docsPages } from "@/content/docs-nav";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm leading-6 text-muted-foreground">{siteConfig.description}</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Docs</p>
          <ul className="space-y-2 text-sm">
            {docsPages.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="focus-ring rounded-sm text-muted-foreground transition-colors hover:text-foreground">
                  {page.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/lab" className="focus-ring rounded-sm text-muted-foreground transition-colors hover:text-foreground">
                WebGL lab
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Components</p>
          <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/components?category=${category.id}`}
                  className="focus-ring rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} {siteConfig.name}. Built with Next.js, Tailwind CSS and Motion.</span>
          <a href={siteConfig.github} target="_blank" rel="noreferrer" className="focus-ring rounded-sm hover:text-foreground">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
