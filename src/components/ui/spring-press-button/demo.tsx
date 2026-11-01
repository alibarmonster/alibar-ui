"use client";

import { ArrowRight, Download, Plus } from "lucide-react";
import { SpringPressButton } from "@/components/ui/spring-press-button/spring-press-button";

export function Default() {
  return (
    <SpringPressButton size="lg">
      Get started
      <ArrowRight aria-hidden="true" />
    </SpringPressButton>
  );
}

export function Styles() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <SpringPressButton>Solid</SpringPressButton>
      <SpringPressButton variant="primary">
        <Plus aria-hidden="true" />
        New project
      </SpringPressButton>
      <SpringPressButton variant="outline">
        <Download aria-hidden="true" />
        Export
      </SpringPressButton>
      <SpringPressButton variant="ghost">Cancel</SpringPressButton>
    </div>
  );
}

export function PressDepth() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <SpringPressButton variant="outline" pressScale={0.98} release="snappy">
        Subtle
      </SpringPressButton>
      <SpringPressButton variant="outline">Default</SpringPressButton>
      <SpringPressButton variant="outline" pressScale={0.85}>
        Squishy
      </SpringPressButton>
    </div>
  );
}
