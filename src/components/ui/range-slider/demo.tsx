"use client";

import { useState } from "react";
import { Volume1, Volume2 } from "lucide-react";
import { RangeSlider } from "@/components/ui/range-slider/range-slider";

export function Default() {
  const [volume, setVolume] = useState([40]);
  return (
    <div className="flex w-full max-w-sm items-center gap-3">
      <Volume1 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <RangeSlider aria-label="Volume" value={volume} onValueChange={setVolume} step={10} formatValue={(v) => `${v}%`} />
      <Volume2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

const price = (v: number) => `$${v.toLocaleString("en-US")}`;

export function PriceRange() {
  const [range, setRange] = useState([200, 750]);
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">Price</span>
        <span className="font-mono text-[13px] text-muted-foreground tabular-nums">
          {price(range[0])} – {price(range[1])}
        </span>
      </div>
      <RangeSlider
        aria-label="Price range"
        thumbLabels={["Minimum price", "Maximum price"]}
        value={range}
        onValueChange={setRange}
        min={0}
        max={1000}
        step={50}
        formatValue={price}
      />
    </div>
  );
}

const SIZES = ["XS", "S", "M", "L", "XL"];

export function Discrete() {
  return (
    <div className="w-full max-w-xs space-y-1 pt-8">
      <RangeSlider
        aria-label="Size"
        defaultValue={[2]}
        min={0}
        max={4}
        step={1}
        tooltip="always"
        formatValue={(v) => SIZES[v]}
      />
      <div className="flex justify-between px-0.5 text-xs text-muted-foreground" aria-hidden="true">
        {SIZES.map((size) => (
          <span key={size} className="w-0 text-center">
            <span className="inline-block -translate-x-1/2">{size}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
