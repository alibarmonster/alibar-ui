"use client";

import { Copy } from "lucide-react";
import { PixelLandscape } from "@/components/ui/pixel-landscape/pixel-landscape";

export function Hero() {
  return (
    <PixelLandscape className="h-[480px] w-full rounded-2xl">
      <div className="flex flex-col items-center px-6 pt-14 text-center">
        <h3 className="max-w-xl text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.15] font-semibold tracking-tight text-white">
          <span className="box-decoration-clone bg-[#f2581d] px-2">Give your agents a map of the whole web.</span>
        </h3>
        <p className="mt-5 max-w-sm text-[15px] text-[#1c1c1c]">Move your cursor and the sun follows, relighting every slope.</p>
        <div className="mt-6 flex gap-2">
          <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-10 items-center rounded-full bg-black px-5 text-sm font-medium text-white">
            Get started
          </a>
          <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/70 px-5 text-sm font-medium text-black backdrop-blur">
            Copy setup <Copy className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </PixelLandscape>
  );
}

export function Alpine() {
  return <PixelLandscape palette="alpine" seed={3} height={0.66} className="h-80 w-full rounded-2xl" />;
}

export function Dusk() {
  return <PixelLandscape palette="dusk" seed={12} shape="square" cell={8} className="h-80 w-full rounded-2xl" />;
}
