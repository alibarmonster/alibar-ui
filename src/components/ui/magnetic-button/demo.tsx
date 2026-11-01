"use client";

import { ArrowUpRight, Mail, Plus, Sparkles } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button/magnetic-button";

export function Default() {
  return (
    <MagneticButton size="lg">
      Book a demo
      <ArrowUpRight aria-hidden="true" />
    </MagneticButton>
  );
}

export function IconButtons() {
  return (
    <div className="flex items-center gap-5">
      <MagneticButton shape="circle" variant="outline" size="lg" aria-label="Send email">
        <Mail aria-hidden="true" />
      </MagneticButton>
      <MagneticButton shape="circle" size="lg" aria-label="Create">
        <Plus aria-hidden="true" />
      </MagneticButton>
      <MagneticButton shape="circle" variant="outline" size="lg" aria-label="Open link">
        <ArrowUpRight aria-hidden="true" />
      </MagneticButton>
    </div>
  );
}

export function StrongPull() {
  return (
    <MagneticButton variant="primary" size="lg" radius={140} strength={0.6} contentStrength={0.6}>
      <Sparkles aria-hidden="true" />
      Come closer
    </MagneticButton>
  );
}
