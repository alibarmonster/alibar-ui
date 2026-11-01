import { MotionProvider } from "@/components/site/motion-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <a
        href="#content"
        className="focus-ring sr-only z-50 rounded-md bg-foreground px-3 py-2 text-sm text-background focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="content" className="min-h-[calc(100dvh-3.5rem)]">
        {children}
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
