"use client";

import type { ComponentProps } from "react";
import { NumberTicker } from "@/components/ui/number-ticker/number-ticker";
import { cn } from "@/lib/utils";

export interface Stat {
  /** Final value the ticker counts to. */
  value: number;
  label: string;
  /** Text before the number, e.g. "$". */
  prefix?: string;
  /** Text after the number, e.g. "%" or "M+". */
  suffix?: string;
  /** Decimal places. @default 0 */
  decimals?: number;
  /** Optional line under the label. */
  description?: string;
}

export interface StatsSectionProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Stats, ideally four. */
  stats: Stat[];
  /** Small line above the title. */
  eyebrow?: string;
  /** Section title. */
  title?: string;
  /** Supporting line under the title. */
  description?: string;
}

export function StatsSection({ stats, eyebrow, title, description, className, ...props }: StatsSectionProps) {
  return (
    <section className={cn("@container w-full", className)} {...props}>
      {eyebrow || title || description ? (
        <div className="mb-10 max-w-xl">
          {eyebrow ? <p className="text-sm font-medium text-primary">{eyebrow}</p> : null}
          {title ? <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-balance text-foreground @[40rem]:text-3xl">{title}</h2> : null}
          {description ? <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      <dl className="grid grid-cols-2 gap-px overflow-hidden border-y border-border bg-border @[44rem]:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col bg-background px-5 py-7">
            <dt className="order-2 mt-2 text-sm font-medium text-foreground">{stat.label}</dt>
            <dd className="order-1 font-mono text-4xl font-semibold tracking-tight text-foreground tabular-nums @[44rem]:text-[2.75rem]">
              <NumberTicker value={stat.value} decimals={stat.decimals ?? 0} prefix={stat.prefix} suffix={stat.suffix} trigger="inView" />
            </dd>
            {stat.description ? <dd className="order-3 mt-1 text-[13px] leading-5 text-muted-foreground">{stat.description}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
