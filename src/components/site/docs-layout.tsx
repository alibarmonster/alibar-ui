import Image from "next/image";
import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";

/** Left sidebar + content column shared by /docs and /components/[slug]. */
export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1760px] px-4 sm:px-6 md:grid md:grid-cols-[14.5rem_minmax(0,1fr)] md:gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 2xl:gap-16">
      <div className="hidden md:block">
        <div className="sticky top-14 py-5">
          <div className="h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-background p-3 [scrollbar-width:thin]">
            <SidebarNav />
          </div>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Article column with a sticky "On this page" rail on wide screens. */
export function DocsPage({ toc, children }: { toc: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10 2xl:gap-16">
      <article className="min-w-0 pt-8 pb-20 sm:pt-12">{children}</article>
      <aside className="hidden xl:block">
        <div className="sticky top-14 space-y-4 py-5">
          <div className="rounded-2xl border border-border bg-background p-4">{toc}</div>
          <TemplatesCard />
        </div>
      </aside>
    </div>
  );
}

/** A small promo for the templates, in the right rail. */
function TemplatesCard() {
  return (
    <Link href="/templates" className="focus-ring group block overflow-hidden rounded-2xl border border-border bg-background">
      <div className="overflow-hidden border-b border-border bg-surface">
        <Image src="/templates/pennant.png" alt="" width={1440} height={900} className="w-full transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none" />
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-foreground">Build the whole page</p>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">See every component working together in a complete website template.</p>
        <span className="mt-3 inline-flex h-8 items-center rounded-full bg-foreground px-3 text-[12px] font-medium text-background">Browse templates</span>
      </div>
    </Link>
  );
}
