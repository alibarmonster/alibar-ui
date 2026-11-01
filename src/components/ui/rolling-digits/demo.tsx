"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

export function Default() {
  const [price, setPrice] = useState(1284.5);
  const nudge = (amount: number) => setPrice((p) => Math.max(0, Math.round((p + amount) * 100) / 100));
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Portfolio</p>
        <RollingDigits value={price} decimals={2} format={{ style: "currency", currency: "USD" }} className="text-5xl font-semibold tracking-tight text-foreground" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={control} onClick={() => nudge(-87.25)}>
          −87.25
        </button>
        <button type="button" className={control} onClick={() => nudge(312.4)}>
          +312.40
        </button>
        <button type="button" className={control} onClick={() => setPrice(Math.round(Math.random() * 1_200_000) / 100)}>
          Random
        </button>
      </div>
    </div>
  );
}

export function LikeCounter() {
  const [likes, setLikes] = useState(998);
  const [liked, setLiked] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-pressed={liked}
        onClick={() => {
          setLiked((l) => !l);
          setLikes((n) => n + (liked ? -1 : 1));
        }}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Heart className={liked ? "size-4 fill-destructive text-destructive" : "size-4"} aria-hidden="true" />
        <RollingDigits value={likes} animateOnMount={false} />
        <span className="sr-only">likes</span>
      </button>
      <button type="button" className="cursor-pointer text-[13px] text-muted-foreground underline-offset-4 hover:underline" onClick={() => setLikes((n) => n + 1)}>
        Add one (watch 999 → 1,000)
      </button>
    </div>
  );
}

export function LiveVisitors() {
  const [count, setCount] = useState(2148);
  useEffect(() => {
    const timer = window.setInterval(() => setCount((c) => Math.max(1900, c + Math.round((Math.random() - 0.45) * 40))), 1600);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-5 py-4 shadow-sm">
      <span className="relative flex size-2.5" aria-hidden="true">
        <span className="absolute inline-flex size-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2.5 rounded-full bg-success" />
      </span>
      <div>
        <RollingDigits value={count} className="text-2xl font-semibold tracking-tight text-foreground" />
        <p className="text-xs text-muted-foreground">visitors right now</p>
      </div>
    </div>
  );
}
