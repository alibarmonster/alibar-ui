"use client";

import { StackedCards } from "@/components/ui/stacked-cards/stacked-cards";

const PLACES = [
  { id: "kyoto", name: "Kyoto", country: "Japan", tint: "from-rose-300 to-orange-300" },
  { id: "lisbon", name: "Lisbon", country: "Portugal", tint: "from-amber-200 to-sky-300" },
  { id: "reykjavik", name: "Reykjavík", country: "Iceland", tint: "from-cyan-200 to-indigo-400" },
  { id: "marrakesh", name: "Marrakesh", country: "Morocco", tint: "from-orange-300 to-red-400" },
];

function Postcard({ name, country, tint }: { name: string; country: string; tint: string }) {
  return (
    <div className="flex aspect-[3/4] w-48 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white p-2 shadow-md sm:w-56">
      <div className={`flex-1 rounded-xl bg-gradient-to-br ${tint}`} />
      <div className="px-1.5 pt-2.5 pb-1">
        <p className="text-sm font-semibold text-zinc-900">{name}</p>
        <p className="text-xs text-zinc-500">{country}</p>
      </div>
    </div>
  );
}

export function Default() {
  return (
    <div className="flex flex-col items-center gap-6 pt-10">
      <StackedCards aria-label="Trips" items={PLACES.map((p) => ({ id: p.id, label: p.name, content: <Postcard {...p} /> }))} />
      <p className="text-[13px] text-muted-foreground">Hover to fan out; click a card behind to bring it forward.</p>
    </div>
  );
}

const NOTES = [
  { id: "1", title: "Deploy finished", body: "web · 42s · main@a1c9", time: "now" },
  { id: "2", title: "New comment", body: "Maya: “Love the new empty state”", time: "4m" },
  { id: "3", title: "Invoice paid", body: "Northwind · $2,400", time: "1h" },
];

export function Spread() {
  return (
    <div className="flex min-h-40 items-center justify-center sm:pl-44">
      <StackedCards
        variant="spread"
        aria-label="Notifications"
        items={NOTES.map((n) => ({
          id: n.id,
          label: n.title,
          content: (
            <div className="w-56 rounded-xl border border-border bg-card p-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <span className="text-[11px] text-muted-foreground">{n.time}</span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{n.body}</p>
            </div>
          ),
        }))}
      />
    </div>
  );
}
