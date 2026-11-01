"use client";

import { useState } from "react";
import { QuantityStepper } from "@/components/ui/quantity-stepper/quantity-stepper";

export function Default() {
  return <QuantityStepper defaultValue={1} min={1} max={10} />;
}

const GUESTS = [
  { key: "adults", title: "Adults", hint: "Ages 13 or above", min: 1, max: 8, initial: 2 },
  { key: "children", title: "Children", hint: "Ages 2–12", min: 0, max: 6, initial: 1 },
  { key: "infants", title: "Infants", hint: "Under 2", min: 0, max: 4, initial: 0 },
] as const;

export function Guests() {
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(GUESTS.map((g) => [g.key, g.initial])),
  );
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-background p-1 shadow-sm">
      <ul className="divide-y divide-border">
        {GUESTS.map((guest) => (
          <li key={guest.key} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{guest.title}</p>
              <p className="text-[13px] text-muted-foreground">{guest.hint}</p>
            </div>
            <QuantityStepper
              size="sm"
              label={guest.title}
              min={guest.min}
              max={guest.max}
              value={counts[guest.key]}
              onValueChange={(next) => setCounts((c) => ({ ...c, [guest.key]: next }))}
            />
          </li>
        ))}
      </ul>
      <p className="border-t border-border px-4 py-2.5 text-[13px] text-muted-foreground">
        {total} guest{total === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function Large() {
  return (
    <div className="flex flex-col items-center gap-3">
      <QuantityStepper size="lg" label="Donation in dollars" defaultValue={95} min={5} max={500} step={5} />
      <p className="text-[13px] text-muted-foreground">Step of 5. Hold a button to repeat.</p>
    </div>
  );
}
