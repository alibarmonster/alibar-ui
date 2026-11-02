"use client";

import { SpendMeter } from "@/components/ui/spend-meter/spend-meter";
import { mockResources, mockResourcesIdr } from "@/lib/usage/mock";

export function Default() {
  return <SpendMeter resources={mockResources} defaultBudget={10000} periodLabel="November 2026" />;
}

export function NearLimit() {
  return <SpendMeter resources={mockResources} defaultBudget={7000} periodLabel="November 2026" title="API usage" />;
}

export function Rupiah() {
  return <SpendMeter resources={mockResourcesIdr} defaultBudget={80_000_000} step={10_000_000} min={10_000_000} max={500_000_000} currency="IDR" locale="id-ID" periodLabel="November 2026" title="Pemakaian" />;
}
