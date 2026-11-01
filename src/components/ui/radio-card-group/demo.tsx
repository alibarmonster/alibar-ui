"use client";

import { Store, Truck, Zap } from "lucide-react";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card-group/radio-card-group";

export function Default() {
  return (
    <RadioCardGroup defaultValue="pro" aria-label="Plan" className="w-full max-w-2xl sm:grid-cols-3">
      <RadioCard value="starter" title="Starter" description="For side projects." aside="$0" />
      <RadioCard value="pro" title="Pro" description="For growing teams." aside="$24" />
      <RadioCard value="scale" title="Scale" description="SSO and audit logs." aside="$79" />
    </RadioCardGroup>
  );
}

export function WithIcons() {
  return (
    <RadioCardGroup defaultValue="standard" aria-label="Shipping" className="w-full max-w-sm">
      <RadioCard value="standard" icon={<Truck />} title="Standard" description="3–5 business days" aside="Free" />
      <RadioCard value="express" icon={<Zap />} title="Express" description="Next business day" aside="$12" />
      <RadioCard value="pickup" icon={<Store />} title="Pick up in store" description="Ready in 2 hours" aside="Free" />
    </RadioCardGroup>
  );
}

export function DisabledOption() {
  return (
    <RadioCardGroup defaultValue="monthly" aria-label="Billing period" className="w-full max-w-sm">
      <RadioCard value="monthly" title="Monthly" description="Cancel any time." />
      <RadioCard value="yearly" title="Yearly" description="Two months free." />
      <RadioCard value="lifetime" title="Lifetime" description="Sold out." disabled />
    </RadioCardGroup>
  );
}
