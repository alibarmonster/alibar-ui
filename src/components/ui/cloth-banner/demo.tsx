"use client";

import { useState } from "react";
import { HtmlCanvasDemo } from "@/components/site/html-canvas-demo";
import { ClothBanner } from "@/components/ui/cloth-banner/cloth-banner";

export function Default() {
  const [run, setRun] = useState(0);
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <div className="flex w-full flex-col items-center gap-3">
          <ClothBanner key={run} rendering={rendering} onModeChange={onModeChange}>
            <span className="mr-1.5 rounded-full bg-background/15 px-2 py-0.5 text-[11px] font-semibold">New</span>
            Version 0.3.0 is out with 37 components.{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Read the changelog
            </a>
          </ClothBanner>
          <button type="button" onClick={() => setRun((r) => r + 1)} className="h-8 cursor-pointer rounded-full border border-border px-3 text-[12px] font-medium text-foreground">
            Show again
          </button>
        </div>
      )}
    </HtmlCanvasDemo>
  );
}

export function Brand() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <ClothBanner variant="brand" wind={1.6} dismissible={false} rendering={rendering} onModeChange={onModeChange}>
          Summer sale: 30% off annual plans until Sunday.{" "}
          <a href="#" onClick={(e) => e.preventDefault()}>
            See pricing
          </a>
        </ClothBanner>
      )}
    </HtmlCanvasDemo>
  );
}
