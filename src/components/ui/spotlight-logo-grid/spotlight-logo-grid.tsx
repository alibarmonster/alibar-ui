"use client";

import { useRef, type ComponentProps, type CSSProperties, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SpotlightLogo {
  name: string;
  logo: ReactNode;
  href?: string;
}

export interface SpotlightLogoGridProps extends Omit<ComponentProps<"section">, "children"> {
  /** Logos to show. */
  items: SpotlightLogo[];
  /** Columns on wider containers (2 below 34rem). @default 4 */
  columns?: 2 | 3 | 4 | 5;
  /** Glow radius in pixels. @default 220 */
  radius?: number;
  /** Glow color (any CSS color). @default the primary color */
  color?: string;
  /** Small line above the grid. */
  eyebrow?: string;
}

const COLUMNS = { 2: "@[34rem]:grid-cols-2", 3: "@[34rem]:grid-cols-3", 4: "@[34rem]:grid-cols-4", 5: "@[34rem]:grid-cols-5" } as const;

export function SpotlightLogoGrid({ items, columns = 4, radius = 220, color = "var(--primary)", eyebrow, className, ...props }: SpotlightLogoGridProps) {
  const grid = useRef<HTMLUListElement>(null);
  const frame = useRef(0);
  const mobileFill = (2 - (items.length % 2)) % 2;
  const wideFill = (columns - (items.length % columns)) % columns;

  // Pointer position goes straight into CSS variables: no React renders while moving.
  function place(x: number, y: number, on: boolean) {
    const el = grid.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--spot-x", `${x}px`);
      el.style.setProperty("--spot-y", `${y}px`);
      el.style.setProperty("--spot-on", on ? "1" : "0");
    });
  }

  function onPointerMove(event: PointerEvent<HTMLUListElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    place(event.clientX - rect.left, event.clientY - rect.top, true);
  }

  function onFocus(event: FocusEvent<HTMLUListElement>) {
    const target = (event.target as HTMLElement).closest("li");
    const el = grid.current;
    if (!target || !el || !(event.target as HTMLElement).matches(":focus-visible")) return;
    const cell = target.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    place(cell.left - rect.left + cell.width / 2, cell.top - rect.top + cell.height / 2, true);
  }

  return (
    <section className={cn("@container w-full py-10", className)} {...props}>
      {eyebrow ? <p className="mb-6 px-4 text-center text-sm text-muted-foreground">{eyebrow}</p> : null}
      <ul
        ref={grid}
        onPointerMove={onPointerMove}
        onPointerLeave={() => place(0, 0, false)}
        onFocus={onFocus}
        onBlur={() => place(0, 0, false)}
        style={{ "--spot-r": `${radius}px`, "--spot-color": color } as CSSProperties}
        className={cn("relative isolate grid grid-cols-2 gap-px border-y border-border bg-border", COLUMNS[columns])}
      >
        {/* The glow sits under the cells, so it only shows through the 1px gaps: the hairlines light up. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[var(--spot-on,0)] transition-opacity duration-300 motion-reduce:transition-none"
          style={{
            background:
              "radial-gradient(var(--spot-r) circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--spot-color) 85%, transparent), transparent 70%)",
          }}
        />
        {items.map((item) => (
          <li key={item.name} className="relative bg-surface transition-colors duration-300 hover:bg-background">
            {item.href ? (
              <a
                href={item.href}
                className="relative flex h-28 items-center justify-center text-[21px] text-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="sr-only">{item.name}</span>
                <span aria-hidden="true">{item.logo}</span>
              </a>
            ) : (
              <span role="img" aria-label={item.name} className="relative flex h-28 items-center justify-center text-[21px] text-foreground/80">
                <span aria-hidden="true">{item.logo}</span>
              </span>
            )}
          </li>
        ))}
        {Array.from({ length: Math.max(mobileFill, wideFill) }, (_, i) => (
          <li
            key={`filler-${i}`}
            aria-hidden="true"
            className={cn("bg-surface", i < mobileFill ? "block" : "hidden", i < wideFill ? "@[34rem]:block" : "@[34rem]:hidden")}
          />
        ))}
      </ul>
    </section>
  );
}
