"use client";

import { FeatureBento } from "@/components/ui/feature-bento/feature-bento";
import { getPlaceholderBrand, PlaceholderLogo } from "@/components/site/placeholder-logos";

export function Default() {
  return <FeatureBento className="max-w-4xl" description="Five tiles, five live components: each one moves in its own small way." />;
}

export function Custom() {
  return (
    <FeatureBento
      className="max-w-3xl"
      eyebrow="Integrations"
      title="Plays well with your stack"
      features={["Lumivo", "Corvane", "Quorvex"].map((name, i) => ({
        title: name,
        description: ["Sync contacts both ways.", "Stream events in real time.", "Trigger flows from any webhook."][i],
        visual: <PlaceholderLogo brand={getPlaceholderBrand(name)} className="text-3xl text-foreground transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] group-hover:scale-110 motion-reduce:!scale-100" />,
      }))}
    />
  );
}
