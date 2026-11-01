"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { ActivityRings } from "@/components/ui/activity-rings/activity-rings";
import { NumberTicker } from "@/components/ui/number-ticker/number-ticker";
import { ShimmerText } from "@/components/ui/shimmer-text/shimmer-text";
import { Sparkline } from "@/components/ui/sparkline/sparkline";
import { SpringSwitch } from "@/components/ui/spring-switch/spring-switch";
import { Typewriter } from "@/components/ui/typewriter/typewriter";
import { cn } from "@/lib/utils";

export interface BentoFeature {
  title: string;
  description: string;
  /** The tile's live visual: any component or illustration. */
  visual: ReactNode;
  /** Grid placement, e.g. "@[48rem]:col-span-2". */
  className?: string;
}

export interface FeatureBentoProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Tiles. Defaults to five tiles built from alibar/ui components. */
  features?: BentoFeature[];
  /** Small line above the title. @default "Features" */
  eyebrow?: string;
  /** Section title. @default "Everything you need to ship delight" */
  title?: string;
  /** Supporting line under the title. */
  description?: string;
  /** Heading level of the section title; tile titles use the next level. @default 2 */
  headingLevel?: 2 | 3;
}

function AutomationsVisual() {
  const id = useId();
  const rules = [
    { label: "Notify on deploy", on: true },
    { label: "Auto-assign reviews", on: false },
    { label: "Weekly digest", on: true },
  ];
  return (
    <ul className="w-full max-w-60 space-y-2">
      {rules.map((rule, i) => (
        <li key={rule.label} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 shadow-xs">
          <label htmlFor={`${id}-${i}`} className="cursor-pointer text-[13px] text-foreground">
            {rule.label}
          </label>
          <SpringSwitch id={`${id}-${i}`} size="sm" defaultChecked={rule.on} />
        </li>
      ))}
    </ul>
  );
}

function StatusVisual() {
  return (
    <ul className="w-full max-w-60 space-y-2.5 text-[13px]">
      {["Build passed", "Tests green"].map((step) => (
        <li key={step} className="flex items-center gap-2 text-muted-foreground">
          <span className="grid size-5 place-items-center rounded-full bg-success/15 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]">
            <Check className="size-3" strokeWidth={3} aria-hidden="true" />
          </span>
          {step}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <Loader2 className="size-5 animate-spin p-0.5 text-primary motion-reduce:animate-none" aria-hidden="true" />
        <ShimmerText className="font-medium">Deploying to production…</ShimmerText>
      </li>
    </ul>
  );
}

const DEFAULT_FEATURES: BentoFeature[] = [
  {
    title: "Real-time analytics",
    description: "Watch every launch land, with numbers that count up the moment they're on screen.",
    className: "@[48rem]:col-span-2",
    visual: (
      <div className="flex w-full max-w-md items-end justify-between gap-6">
        <div>
          <p className="text-xs text-muted-foreground">Visitors today</p>
          <p className="font-mono text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            <NumberTicker value={48213} />
          </p>
        </div>
        <Sparkline data={[12, 18, 15, 22, 28, 24, 31, 36, 33, 42, 48, 46, 55]} label="Visitors over the last 13 hours" width={220} height={64} area drawOn />
      </div>
    ),
  },
  {
    title: "Automations",
    description: "Flip rules on and off without a deploy.",
    visual: <AutomationsVisual />,
  },
  {
    title: "AI writing",
    description: "Drafts that type themselves.",
    visual: (
      <p className="w-full max-w-60 rounded-xl border border-border bg-background p-3 text-[13px] leading-5 text-foreground shadow-xs">
        <Typewriter phrases={["Summarize this week's releases…", "Draft a changelog entry…", "Reply to the top issue…"]} />
      </p>
    ),
  },
  {
    title: "Goals",
    description: "Rings close as the team hits targets.",
    visual: (
      <ActivityRings
        size={120}
        thickness={12}
        label="Team goals"
        rings={[
          { label: "Shipped", value: 18, goal: 20 },
          { label: "Reviewed", value: 31, goal: 40 },
          { label: "Fixed", value: 9, goal: 15 },
        ]}
      />
    ),
  },
  {
    title: "Instant deploys",
    description: "Push, and it's live before your coffee cools.",
    visual: <StatusVisual />,
  },
];

export function FeatureBento({
  features = DEFAULT_FEATURES,
  eyebrow = "Features",
  title = "Everything you need to ship delight",
  description,
  headingLevel = 2,
  className,
  ...props
}: FeatureBentoProps) {
  const Heading = `h${headingLevel}` as const;
  const TileHeading = `h${headingLevel + 1}` as "h3" | "h4";
  return (
    <section className={cn("@container w-full", className)} {...props}>
      <div className="mb-8 max-w-xl">
        {eyebrow ? <p className="text-sm font-medium text-primary">{eyebrow}</p> : null}
        <Heading className="mt-1.5 text-2xl font-semibold tracking-tight text-balance text-foreground @[40rem]:text-3xl">{title}</Heading>
        {description ? <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-3 @[34rem]:grid-cols-2 @[48rem]:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className={cn("group flex min-h-64 flex-col overflow-hidden rounded-2xl border border-border bg-surface", feature.className)}
          >
            <div className="flex flex-1 items-center justify-center p-6">{feature.visual}</div>
            <div className="border-t border-border bg-background px-5 py-4">
              <TileHeading className="text-sm font-semibold text-foreground">{feature.title}</TileHeading>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{feature.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
