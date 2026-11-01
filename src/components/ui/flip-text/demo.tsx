"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { FlipText } from "@/components/ui/flip-text/flip-text";

const LINKS = ["Work", "Services", "About", "Contact"];

export function Default() {
  return (
    <nav aria-label="Site">
      <ul className="flex flex-wrap items-center justify-center gap-1">
        {LINKS.map((label) => (
          <li key={label}>
            {/* `group` on the link: hovering or focusing anywhere on it flips the text. */}
            <a
              href={`#${label.toLowerCase()}`}
              onClick={(event) => event.preventDefault()}
              className="group inline-flex h-10 items-center rounded-md px-3 text-[15px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FlipText>{label}</FlipText>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function CallToAction() {
  return (
    <a
      href="#start"
      onClick={(event) => event.preventDefault()}
      className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground pr-2 pl-6 text-base font-medium text-background shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <FlipText stagger={18} flippedClassName="text-background/70">
        Start a project
      </FlipText>
      <span className="flex size-8 items-center justify-center rounded-full bg-background text-foreground transition-transform duration-300 group-hover:rotate-45 motion-reduce:transition-none">
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </span>
    </a>
  );
}

const PLANS = ["Monthly", "Yearly"];

export function Selected() {
  const [plan, setPlan] = useState("Monthly");
  return (
    <div role="radiogroup" aria-label="Billing period" className="inline-flex gap-1 rounded-full border border-border bg-surface p-1">
      {PLANS.map((label) => {
        const selected = label === plan;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPlan(label)}
            className={
              selected
                ? "h-9 cursor-pointer rounded-full bg-background px-5 text-sm font-medium text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                : "h-9 cursor-pointer rounded-full px-5 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            }
          >
            {/* `active` holds the flipped state for the selected option. */}
            <FlipText active={selected} flippedClassName="text-primary">
              {label}
            </FlipText>
          </button>
        );
      })}
    </div>
  );
}
