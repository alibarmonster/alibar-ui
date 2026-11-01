"use client";

import { StatsSection } from "@/components/ui/stats-section/stats-section";

export function Default() {
  return (
    <StatsSection
      className="max-w-4xl"
      eyebrow="By the numbers"
      title="Built for teams that ship"
      stats={[
        { value: 151, label: "Components", description: "Animated and accessible." },
        { value: 4.9, decimals: 1, suffix: "/5", label: "Average rating", description: "From 2,400 reviews." },
        { value: 38, suffix: "%", label: "Faster launches", description: "Median across teams." },
        { value: 12, suffix: "M+", label: "Monthly views", description: "Rendered with alibar/ui." },
      ]}
    />
  );
}

export function Compact() {
  return (
    <StatsSection
      className="max-w-2xl"
      stats={[
        { value: 99.99, decimals: 2, suffix: "%", label: "Uptime" },
        { value: 120, prefix: "<", suffix: "ms", label: "p95 latency" },
      ]}
    />
  );
}
