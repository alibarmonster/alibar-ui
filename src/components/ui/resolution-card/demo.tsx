"use client";

import { useState } from "react";
import { ResolutionCard, type ResolutionStage } from "@/components/ui/resolution-card/resolution-card";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { getMockMarket } from "@/lib/markets/mock";

const album = getMockMarket("album-week");
const phone = getMockMarket("glass-phone");
const stages: ResolutionStage[] = ["open", "closed", "resolving", "resolved"];
// The dispute window closes 3 days 4 hours after trading ended (relative to the mock clock).
const disputeEndsAt = album.endsAt + (3 * 24 + 4) * 3600_000;

export function Lifecycle() {
  const [stage, setStage] = useState<ResolutionStage>("resolving");
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <SimulatedBadge />
      <div role="radiogroup" aria-label="Stage" className="flex flex-wrap justify-center gap-1">
        {stages.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={stage === s} onClick={() => setStage(s)} className={`h-8 cursor-pointer rounded-full px-3 text-[12px] capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring ${stage === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
            {s}
          </button>
        ))}
      </div>
      <ResolutionCard market={album} stage={stage} disputeEndsAt={disputeEndsAt} />
    </div>
  );
}

export function OpenMarket() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <SimulatedBadge />
      <ResolutionCard market={phone} stage="open" />
    </div>
  );
}
