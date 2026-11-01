"use client";

import { PricingSection, type PricingPlan } from "@/components/ui/pricing-section/pricing-section";

const PLANS: PricingPlan[] = [
  { name: "Hobby", description: "For side projects and experiments.", price: { monthly: 0, yearly: 0 }, features: ["3 projects", "Community support", "All 150 components"] },
  {
    name: "Pro",
    description: "For teams shipping every week.",
    price: { monthly: 24, yearly: 19 },
    features: ["Unlimited projects", "Priority support", "Figma kit", "Early access to new components"],
    cta: "Start free trial",
    popular: true,
  },
  { name: "Team", description: "For orgs with many products.", price: { monthly: 79, yearly: 63 }, features: ["Everything in Pro", "SSO and audit logs", "Custom theming session"], cta: "Talk to us" },
];

export function Default() {
  return <PricingSection className="max-w-4xl" plans={PLANS} description="Start free, upgrade when your team grows. Switch billing to watch prices roll." />;
}

export function Euro() {
  return <PricingSection className="max-w-4xl" plans={PLANS.slice(1)} currency="EUR" defaultBilling="yearly" yearlyBadge="2 months free" title="Plans for teams" />;
}
