"use client";

import { CreditTrend } from "@/components/ui/credit-trend/credit-trend";
import { mockCategories, mockCycle, mockDailyUsage, mockWorkflows } from "@/lib/usage/mock";

export function Default() {
  return <CreditTrend categories={mockCategories} days={mockDailyUsage} today={mockCycle.today} renewsOn={mockCycle.renewsOn} dailyBudget={mockCycle.dailyBudget} workflows={mockWorkflows} />;
}

export function FullCycle() {
  return <CreditTrend categories={mockCategories} days={mockDailyUsage} today={mockCycle.today} renewsOn={mockCycle.renewsOn} dailyBudget={13_000} defaultRange="cycle" title="Team credits" />;
}
