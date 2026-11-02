"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { TumblingTags } from "@/components/ui/tumbling-tags/tumbling-tags";

export function Default() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <h3 className="text-3xl leading-tight font-medium tracking-tight text-[#14462f]">
        The easiest way to build
        <br />
        financial products.
      </h3>
      <button type="button" className="h-10 cursor-pointer rounded-lg bg-[#14462f] px-5 text-sm font-medium text-white">
        Get started
      </button>
      <TumblingTags
        replayKey={run}
        tags={[
          { label: "Credit", tone: "ember" },
          { label: "Savings + Investment", tone: "ink" },
          { label: "Cards", tone: "sand" },
          { label: "Accounts", tone: "ink" },
          { label: "Payments", tone: "mint" },
        ]}
      />
      <button type="button" onClick={() => setRun((r) => r + 1)} className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-[12px] font-medium text-foreground">
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Drop again
      </button>
    </div>
  );
}

export function Links() {
  return (
    <TumblingTags
      ghosts={false}
      label="Topics"
      blockHeight={52}
      tags={[
        { label: "Design systems", tone: { background: "#111827", color: "#fff" }, href: "#" },
        { label: "Motion", tone: { background: "#fde68a", color: "#111827" }, href: "#" },
        { label: "Accessibility", tone: { background: "#dbeafe", color: "#1e3a8a" }, href: "#" },
        { label: "Typography", tone: { background: "#fecaca", color: "#7f1d1d" }, href: "#" },
      ]}
    />
  );
}
