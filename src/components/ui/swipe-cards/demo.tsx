"use client";

import { useRef, useState } from "react";
import { Heart, RotateCcw, X } from "lucide-react";
import { SwipeCards, type SwipeCardsHandle } from "@/components/ui/swipe-cards/swipe-cards";

const PEOPLE = [
  { id: "maya", name: "Maya Chen", role: "Product designer", city: "Lisbon", tint: "from-rose-300 via-fuchsia-300 to-indigo-300" },
  { id: "omar", name: "Omar Haddad", role: "Staff engineer", city: "Amman", tint: "from-amber-200 via-orange-300 to-rose-300" },
  { id: "lena", name: "Lena Fischer", role: "Data scientist", city: "Berlin", tint: "from-emerald-200 via-teal-300 to-sky-300" },
  { id: "kenji", name: "Kenji Sato", role: "iOS developer", city: "Osaka", tint: "from-sky-200 via-indigo-300 to-violet-300" },
  { id: "ana", name: "Ana Ruiz", role: "Brand strategist", city: "Bogotá", tint: "from-lime-200 via-emerald-300 to-cyan-300" },
];

const round =
  "inline-flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-background shadow-sm outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring active:scale-95";

export function Default() {
  const stack = useRef<SwipeCardsHandle>(null);
  const [round_, setRound] = useState(0);
  const [kept, setKept] = useState<string[]>([]);
  return (
    <div className="flex flex-col items-center gap-6">
      <SwipeCards
        key={round_}
        ref={stack}
        aria-label="Candidates"
        className="h-80 w-64"
        items={PEOPLE}
        getKey={(p) => p.id}
        getLabel={(p) => p.name}
        onSwipe={(p, direction) => direction === "right" && setKept((k) => [...k, p.name])}
        labels={{
          left: <span className="rounded-md border-2 border-destructive px-2 py-0.5 text-sm font-bold tracking-wider text-destructive uppercase">Pass</span>,
          right: <span className="rounded-md border-2 border-success px-2 py-0.5 text-sm font-bold tracking-wider text-success uppercase">Keep</span>,
        }}
        empty={
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">That’s everyone</p>
            <p className="mt-1 text-xs text-muted-foreground">Kept: {kept.length ? kept.join(", ") : "nobody"}</p>
          </div>
        }
        renderCard={(p) => (
          <div className="flex size-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg select-none">
            <div className={`flex-1 bg-gradient-to-br ${p.tint}`} />
            <div className="p-4">
              <p className="font-semibold text-zinc-900">{p.name}</p>
              <p className="text-sm text-zinc-500">
                {p.role} · {p.city}
              </p>
            </div>
          </div>
        )}
      />
      <div className="flex items-center gap-3">
        <button type="button" className={round} aria-label="Pass" onClick={() => stack.current?.swipe("left")}>
          <X className="size-5 text-destructive" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${round} size-10`}
          aria-label="Start over"
          onClick={() => {
            setKept([]);
            setRound((r) => r + 1);
          }}
        >
          <RotateCcw className="size-4 text-muted-foreground" aria-hidden="true" />
        </button>
        <button type="button" className={round} aria-label="Keep" onClick={() => stack.current?.swipe("right")}>
          <Heart className="size-5 text-success" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
