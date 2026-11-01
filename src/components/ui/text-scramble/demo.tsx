"use client";

import { useState } from "react";
import { TextScramble } from "@/components/ui/text-scramble/text-scramble";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

const PHRASES = ["Decrypting the signal", "Rendering at 60 fps", "Shipping on Friday"];

export function Default() {
  const [index, setIndex] = useState(0);
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <TextScramble
        as="p"
        text={PHRASES[index]}
        className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-3xl"
      />
      <button type="button" className={control} onClick={() => setIndex((i) => (i + 1) % PHRASES.length)}>
        Next phrase
      </button>
    </div>
  );
}

const LINKS = ["Work", "Studio", "Journal", "Contact"];

export function OnHover() {
  return (
    <nav aria-label="Studio">
      <ul className="flex flex-wrap items-center justify-center gap-1">
        {LINKS.map((label) => (
          <li key={label}>
            <a
              href={`#${label.toLowerCase()}`}
              onClick={(event) => event.preventDefault()}
              className="inline-flex h-10 items-center rounded-md px-3 font-mono text-sm font-medium tracking-wider text-muted-foreground uppercase outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <TextScramble trigger="hover" text={label} duration={500} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const STEPS = ["PROCESSING", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED"];

export function Status() {
  const [step, setStep] = useState(0);
  const done = step === STEPS.length - 1;
  return (
    <div className="w-full max-w-xs rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        <span>Order #4821</span>
        <span className="tabular-nums">2 items</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={done ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"} aria-hidden="true" />
        <TextScramble text={STEPS[step]} duration={700} className="font-mono text-sm font-semibold tracking-wider text-foreground" />
      </div>
      <button type="button" className={`${control} mt-4 w-full justify-center`} onClick={() => setStep((s) => (s + 1) % STEPS.length)}>
        {done ? "Start over" : "Advance status"}
      </button>
    </div>
  );
}
