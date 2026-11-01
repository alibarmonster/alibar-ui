import { SidebarNav } from "./sidebar-nav";

/** Left sidebar + content column shared by /docs and /components/[slug]. */
export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:grid md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      <div className="hidden md:block">
        <div className="sticky top-14 -ml-2.5 h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain py-8 pr-3 [scrollbar-width:thin]">
          <SidebarNav />
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Article column with a sticky "On this page" rail on wide screens. */
export function DocsPage({ toc, children }: { toc: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_12.5rem] xl:gap-14">
      <article className="min-w-0 pt-8 pb-20 sm:pt-12">{children}</article>
      <div className="hidden xl:block">
        <div className="sticky top-14 pt-12">{toc}</div>
      </div>
    </div>
  );
}
