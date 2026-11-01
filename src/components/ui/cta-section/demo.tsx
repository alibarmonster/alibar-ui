"use client";

import { CtaSection } from "@/components/ui/cta-section/cta-section";

export function Default() {
  return (
    <CtaSection
      className="max-w-3xl"
      eyebrow="Ready when you are"
      title="Ship interfaces that feel alive"
      description="151 animated, accessible components. Copy one in and see the difference in minutes."
      primaryAction={{ label: "Browse components", href: "#components" }}
      secondaryAction={{ label: "Read the docs", href: "#docs" }}
    />
  );
}

export function Calm() {
  return (
    <CtaSection
      className="max-w-2xl"
      title="Join 12,000 builders"
      description="One email a month: new components, no spam."
      primaryAction={{ label: "Subscribe" }}
      beamColor="var(--foreground)"
      duration={10}
      radius={16}
    />
  );
}
