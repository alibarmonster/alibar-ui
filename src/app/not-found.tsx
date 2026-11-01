import Link from "next/link";
import { LogoMark } from "@/components/site/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <LogoMark className="size-9" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">This page doesn&apos;t exist, or the component hasn&apos;t shipped yet.</p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/components"
          className="focus-ring inline-flex h-10 items-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/85"
        >
          Browse components
        </Link>
        <Link
          href="/"
          className="focus-ring inline-flex h-10 items-center rounded-[10px] border border-border px-4 text-sm font-medium text-foreground hover:bg-surface"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
