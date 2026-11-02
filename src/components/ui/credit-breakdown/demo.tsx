"use client";

import { useState } from "react";
import { CreditBreakdown } from "@/components/ui/credit-breakdown/credit-breakdown";
import { mockBreakdownPeriods, mockCategories, mockPlan } from "@/lib/usage/mock";

export function Default() {
  const [note, setNote] = useState("");
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-2">
      <CreditBreakdown categories={mockCategories} periods={mockBreakdownPeriods} plan={mockPlan} onChangePlan={() => setNote("Opening plans…")} />
      <p aria-live="polite" className="h-5 text-[12px] text-muted-foreground">
        {note}
      </p>
    </div>
  );
}

export function NoDownload() {
  const [note, setNote] = useState("");
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-2">
      <CreditBreakdown
        categories={mockCategories}
        periods={mockBreakdownPeriods}
        defaultPeriod="quarter"
        plan={{ ...mockPlan, name: "Team Pro (annual)" }}
        visibleRows={3}
        onExport={(csv, fileName) => setNote(`${fileName}: ${csv.split("\n").length - 1} rows ready`)}
        title="Quarterly credits"
      />
      <p aria-live="polite" className="h-5 text-[12px] text-muted-foreground">
        {note}
      </p>
    </div>
  );
}
