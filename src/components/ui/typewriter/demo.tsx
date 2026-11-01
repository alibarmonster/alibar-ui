"use client";

import { Typewriter } from "@/components/ui/typewriter/typewriter";

export function Default() {
  return (
    <p className="max-w-md text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
      Interfaces that feel <Typewriter phrases={["alive", "effortless", "inevitable", "like yours"]} className="text-primary" />
    </p>
  );
}

export function Terminal() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl bg-foreground font-mono text-[13px] text-background shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-background/10 px-4 py-3" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-background/20" />
        <span className="size-2.5 rounded-full bg-background/20" />
        <span className="size-2.5 rounded-full bg-background/20" />
      </div>
      <p className="min-h-24 px-4 py-4 leading-relaxed">
        <span className="text-background/45">~/app $ </span>
        <Typewriter
          phrases={["npx shadcn add typewriter", "npm run dev", "git push origin main"]}
          typeSpeed={45}
          pause={1400}
        />
      </p>
    </div>
  );
}

export function ReservedSpace() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Built for <Typewriter reserveSpace phrases={["designers", "engineers", "founders"]} className="text-left text-primary" />{" "}
        today.
      </p>
      <p className="text-[13px] text-muted-foreground">Reserves the longest phrase, so “today.” never moves.</p>
    </div>
  );
}
