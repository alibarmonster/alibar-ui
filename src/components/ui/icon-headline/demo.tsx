"use client";

import { Camera, Heart, Leaf, MessageCircle, Music, Rocket, Sparkles, Sun } from "lucide-react";
import { IconHeadline } from "@/components/ui/icon-headline/icon-headline";

const icon = "size-[0.5em] text-white";

export function Default() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <IconHeadline
        className="max-w-3xl"
        parts={[
          "Where",
          { icons: [<Rocket key="r" className={icon} />, <Music key="m" className={icon} />], backgrounds: ["#f43f5e", "#8b5cf6"] },
          "teams and agents",
          { icons: [<Leaf key="l" className={icon} />, <Camera key="c" className={icon} />], backgrounds: ["#22c55e", "#0ea5e9"] },
          "find designs",
          { icons: [<Sun key="s" className={icon} />, <Heart key="h" className={icon} />], backgrounds: ["#f97316", "#ec4899"] },
          "that work",
        ]}
      />
      <p className="max-w-md text-[15px] text-muted-foreground">A reference library for apps and sites. New screens every week.</p>
      <div className="flex gap-2">
        <button type="button" className="h-10 cursor-pointer rounded-full bg-foreground px-5 text-sm font-medium text-background">
          Join for free
        </button>
        <button type="button" className="h-10 cursor-pointer rounded-full bg-surface-2 px-5 text-sm font-medium text-foreground">
          See plans →
        </button>
      </div>
    </div>
  );
}

export function Single() {
  return (
    <IconHeadline
      as="h2"
      interval={1800}
      className="text-center text-[clamp(1.75rem,5vw,3rem)]"
      parts={[
        "Ship",
        { icons: [<Sparkles key="a" className={icon} />, <MessageCircle key="b" className={icon} />, <Rocket key="c" className={icon} />], backgrounds: ["#111827", "#2563eb", "#16a34a"] },
        "faster",
      ]}
    />
  );
}
