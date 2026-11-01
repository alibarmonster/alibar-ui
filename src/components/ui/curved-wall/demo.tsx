"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { CurvedWall } from "@/components/ui/curved-wall/curved-wall";

export function Rotunda() {
  return (
    <div className="h-[30rem] w-full">
      <CurvedWall items={galleryItems} ariaLabel="Abstract prints" />
    </div>
  );
}

export function FlatStrip() {
  return (
    <div className="h-[26rem] w-full">
      <CurvedWall items={galleryItems.slice(0, 12)} curvature={0} autoplay="step" interval={3000} reflection={0} aspect={1} size={0.62} ariaLabel="Album covers" />
    </div>
  );
}

export function NightDrum() {
  return (
    <div className="h-[30rem] w-full overflow-hidden rounded-xl">
      <CurvedWall
        items={galleryItems}
        backgroundColor="#0B0B0F"
        curvature={0.9}
        viewerDistance={0.8}
        viewAngle={6}
        reflection={0.4}
        dim={0.55}
        speed={0.18}
        ariaLabel="Abstract prints at night"
      />
    </div>
  );
}
