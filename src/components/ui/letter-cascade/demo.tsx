"use client";

import { useEffect, useState } from "react";
import { Plus, Check } from "lucide-react";
import { LetterCascade } from "@/components/ui/letter-cascade/letter-cascade";

const VERBS = ["design", "develop", "deploy", "delight"];

export function Default() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % VERBS.length), 2200);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
        <LetterCascade text={VERBS[index]} />
      </p>
      <p className="text-[13px] text-muted-foreground">Shared letters stay put; only the ones that change swap.</p>
    </div>
  );
}

export function FollowButton() {
  const [following, setFollowing] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={() => setFollowing((f) => !f)}
      className={
        following
          ? "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      }
    >
      {following ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
      <LetterCascade text={following ? "Following" : "Follow"} animateOnMount={false} stagger={0.03} />
    </button>
  );
}

const PRICES = ["$1,240", "$1,284", "$1,312", "$1,297", "$1,350"];

export function Ticker() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % PRICES.length), 1800);
    return () => window.clearInterval(timer);
  }, []);
  const up = index === 0 ? false : PRICES[index] > PRICES[index - 1];
  return (
    <div className="w-full max-w-[16rem] rounded-xl border border-border bg-background p-4 shadow-sm">
      <p className="text-[13px] text-muted-foreground">Portfolio value</p>
      <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        <LetterCascade text={PRICES[index]} direction={up ? "up" : "down"} stagger={0.05} animateOnMount={false} />
      </p>
      <p className={up ? "mt-1 text-[13px] font-medium text-success" : "mt-1 text-[13px] font-medium text-destructive"}>
        {up ? "▲ Rising" : "▼ Falling"}
      </p>
    </div>
  );
}
