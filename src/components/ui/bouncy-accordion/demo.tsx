"use client";

import { CreditCard, LifeBuoy, ShieldCheck, Truck } from "lucide-react";
import { BouncyAccordion } from "@/components/ui/bouncy-accordion/bouncy-accordion";

export function Default() {
  return (
    <BouncyAccordion
      headingLevel={2}
      className="w-full max-w-lg"
      items={[
        { id: "copy", title: "Can I copy components into my project?", content: "Yes. Every component is a single file you can paste or install with the shadcn CLI. There is no runtime package to keep in sync." },
        { id: "deps", title: "What does it depend on?", content: "React 19, Tailwind CSS v4 and Motion. A few components also use Radix primitives for accessible overlays." },
        { id: "theme", title: "Will it match my theme?", content: "Components read shadcn's CSS variables, so your colors, radii and fonts apply without changes." },
        { id: "motion", title: "What about reduced motion?", content: "Every animation checks the user's reduced-motion setting and falls back to simple fades." },
      ]}
    />
  );
}

export function WithIcons() {
  return (
    <BouncyAccordion
      headingLevel={2}
      className="w-full max-w-lg"
      defaultValue="shipping"
      collapsible={false}
      items={[
        { id: "shipping", icon: <Truck />, title: "Shipping", content: "Orders ship within two business days. Tracking arrives by email the moment your parcel leaves us." },
        { id: "payment", icon: <CreditCard />, title: "Payment", content: "We accept all major cards, Apple Pay and bank transfer. You're only charged when the order ships." },
        { id: "warranty", icon: <ShieldCheck />, title: "Warranty", content: "Every product is covered for two years against defects in materials and workmanship." },
        { id: "support", icon: <LifeBuoy />, title: "Support", content: "Reach a real person seven days a week. Median first response is under an hour.", disabled: false },
      ]}
    />
  );
}
