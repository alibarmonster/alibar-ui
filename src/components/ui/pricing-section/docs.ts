import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PricingSection } from "@/components/ui/pricing-section/pricing-section";

<PricingSection
  plans={[
    { name: "Pro", description: "For teams.", price: { monthly: 24, yearly: 19 }, features: ["Unlimited projects"], popular: true },
  ]}
  yearlyBadge="Save 20%"
/>`,
  a11y: [
    "The billing toggle is a labelled radio group; the active pill slides between options.",
    "Prices use Rolling Digits, which exposes the formatted price as plain text while the digit reels stay aria-hidden.",
    "Plan names are headings, features are lists, and the popular plan is marked with visible text, not only a border.",
    "Reduced motion moves the pill instantly and swaps prices without rolling.",
  ],
  notes: [
    "Prices are monthly amounts; yearly shows the monthly equivalent plus the yearly total underneath. Reuses Rolling Digits, so it installs with it.",
    "Cards stack below a 52rem container and sit side by side above it, with the popular plan slightly taller.",
  ],
};
