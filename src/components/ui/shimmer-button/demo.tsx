"use client";

import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button/shimmer-button";

export function Default() {
  return (
    <ShimmerButton size="lg">
      <Sparkles aria-hidden="true" />
      Upgrade to Pro
    </ShimmerButton>
  );
}

export function OnHover() {
  return (
    <ShimmerButton trigger="hover" variant="outline" size="lg">
      <Wand2 aria-hidden="true" />
      Hover to shimmer
    </ShimmerButton>
  );
}

export function Primary() {
  return (
    <ShimmerButton variant="primary" size="lg" duration={1.1} delay={1.2}>
      Start free trial
      <ArrowRight aria-hidden="true" />
    </ShimmerButton>
  );
}
