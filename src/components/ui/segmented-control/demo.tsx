"use client";

import { useState } from "react";
import { Columns3, LayoutGrid, List } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control/segmented-control";

export function Default() {
  return (
    <SegmentedControl
      aria-label="Date range"
      defaultValue="week"
      options={[
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
        { value: "month", label: "Month" },
        { value: "year", label: "Year" },
      ]}
    />
  );
}

export function IconOnly() {
  return (
    <SegmentedControl
      aria-label="Layout"
      size="sm"
      options={[
        { value: "list", icon: <List aria-hidden="true" />, "aria-label": "List view" },
        { value: "grid", icon: <LayoutGrid aria-hidden="true" />, "aria-label": "Grid view" },
        { value: "board", icon: <Columns3 aria-hidden="true" />, "aria-label": "Board view" },
      ]}
    />
  );
}

export function Billing() {
  const [period, setPeriod] = useState("yearly");
  return (
    <div className="w-full max-w-xs space-y-3 text-center">
      <SegmentedControl
        aria-label="Billing period"
        fullWidth
        value={period}
        onValueChange={setPeriod}
        options={[
          { value: "monthly", label: "Monthly" },
          {
            value: "yearly",
            label: (
              <>
                Yearly
                <span className="rounded-full bg-primary/10 px-1.5 py-px text-[11px] font-medium text-primary">−20%</span>
              </>
            ),
          },
        ]}
      />
      <p className="text-sm text-muted-foreground">
        <span className="text-2xl font-semibold text-foreground tabular-nums">{period === "yearly" ? "$19" : "$24"}</span> / month
      </p>
    </div>
  );
}
