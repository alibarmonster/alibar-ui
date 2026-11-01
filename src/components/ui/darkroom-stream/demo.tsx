"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { DarkroomStream } from "@/components/ui/darkroom-stream/darkroom-stream";

export function Stream() {
  return (
    <div className="h-[32rem] w-full">
      <DarkroomStream items={galleryItems} ariaLabel="Abstract prints">
        <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Contact sheet</p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">Every frame develops on the way out</p>
      </DarkroomStream>
    </div>
  );
}

export function Prints() {
  return (
    <div className="h-[32rem] w-full overflow-hidden rounded-xl">
      <DarkroomStream items={galleryItems} printBorder scatterTilt={12} rush={0.35} spiral={0} backgroundColor="#1C1A17" paperColor="#F4F1EA" ariaLabel="Darkroom prints">
        <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Darkroom</p>
        <p className="mt-1.5 text-[13px] text-white/70">Hover a print to catch it.</p>
      </DarkroomStream>
    </div>
  );
}

export function Sinking() {
  return (
    <div className="h-[30rem] w-full">
      <DarkroomStream items={galleryItems} speed={-1.2} spiral={-0.8} rush={1} develop={false} count={36} ariaLabel="Photos sinking into the center" />
    </div>
  );
}
