"use client";

import { useId, useState, type ComponentProps } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export type Billing = "monthly" | "yearly";

export interface PricingPlan {
  name: string;
  description: string;
  /** Price per month for each billing period (yearly is the monthly equivalent). */
  price: { monthly: number; yearly: number };
  features: string[];
  /** Call-to-action label. @default "Get started" */
  cta?: string;
  /** Link for the call to action. */
  href?: string;
  /** Highlights the plan with a "Popular" badge. */
  popular?: boolean;
}

export interface PricingSectionProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Plans, left to right. */
  plans: PricingPlan[];
  /** Controlled billing period. */
  billing?: Billing;
  /** Initial billing period when uncontrolled. @default "monthly" */
  defaultBilling?: Billing;
  /** Called when the billing toggle changes. */
  onBillingChange?: (billing: Billing) => void;
  /** Badge next to "Yearly", e.g. "Save 20%". */
  yearlyBadge?: string;
  /** ISO currency code. @default "USD" */
  currency?: string;
  /** Section title. @default "Simple, honest pricing" */
  title?: string;
  /** Supporting line under the title. */
  description?: string;
  /** Called when a plan's button is pressed (when it has no href). */
  onSelectPlan?: (plan: PricingPlan, billing: Billing) => void;
}

export function PricingSection({
  plans,
  billing,
  defaultBilling = "monthly",
  onBillingChange,
  yearlyBadge = "Save 20%",
  currency = "USD",
  title = "Simple, honest pricing",
  description,
  onSelectPlan,
  className,
  ...props
}: PricingSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const [internal, setInternal] = useState<Billing>(defaultBilling);
  const period = billing ?? internal;
  const setPeriod = (next: Billing) => {
    if (billing === undefined) setInternal(next);
    onBillingChange?.(next);
  };

  return (
    <section className={cn("@container w-full", className)} {...props}>
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-balance text-foreground @[40rem]:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-lg text-[15px] leading-7 text-muted-foreground">{description}</p> : null}
        <LayoutGroup id={id}>
          <div role="radiogroup" aria-label="Billing period" className="mt-6 inline-flex rounded-full border border-border bg-surface p-1">
            {(["monthly", "yearly"] as const).map((option) => {
              const active = option === period;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPeriod(option)}
                  className={cn(
                    "relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-4 text-[13px] font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "text-background" : "text-foreground/65 hover:text-foreground",
                  )}
                >
                  {active ? (
                    <motion.span layoutId="billing-pill" transition={reduceMotion ? { duration: 0 } : spring.snappy} className="absolute inset-0 rounded-full bg-foreground" />
                  ) : null}
                  <span className="relative">{option}</span>
                  {option === "yearly" && yearlyBadge ? (
                    <span
                      className={cn(
                        "relative rounded-full px-1.5 py-0.5 text-[10px] font-semibold normal-case transition-colors",
                        active ? "bg-background/20 text-background" : "bg-success/12 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]",
                      )}
                    >
                      {yearlyBadge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <ul className="mt-8 grid grid-cols-1 gap-4 @[52rem]:grid-cols-3 @[52rem]:items-center">
        {plans.map((plan) => {
          const amount = plan.price[period];
          return (
            <li
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-background p-6",
                plan.popular ? "border-foreground shadow-lg @[52rem]:py-8" : "border-border shadow-xs",
              )}
            >
              {plan.popular ? (
                <span className="absolute -top-3 left-6 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background">Popular</span>
              ) : null}
              <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{plan.description}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <RollingDigits
                  value={amount}
                  format={{ style: "currency", currency, maximumFractionDigits: 0 }}
                  className="text-4xl font-semibold tracking-tight text-foreground"
                />
                <span className="text-[13px] text-muted-foreground">/ month</span>
              </p>
              <p className="mt-1 h-4 text-xs text-muted-foreground">
                {period === "yearly" && amount > 0
                  ? `${new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount * 12)} billed yearly`
                  : amount > 0
                    ? "Billed monthly"
                    : "Free forever"}
              </p>
              {plan.href ? (
                <a
                  href={plan.href}
                  className={cn(
                    "mt-6 flex h-11 items-center justify-center rounded-xl text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    plan.popular ? "bg-foreground text-background hover:bg-foreground/90" : "border border-border bg-background text-foreground hover:bg-surface",
                  )}
                >
                  {plan.cta ?? "Get started"}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectPlan?.(plan, period)}
                  className={cn(
                    "mt-6 flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    plan.popular ? "bg-foreground text-background hover:bg-foreground/90" : "border border-border bg-background text-foreground hover:bg-surface",
                  )}
                >
                  {plan.cta ?? "Get started"}
                </button>
              )}
              <ul className="mt-6 space-y-2.5 text-[13px]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]" strokeWidth={3} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
