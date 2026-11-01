"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { FormationGallery } from "@/components/ui/formation-gallery/formation-gallery";

export function Showcase() {
  return (
    <div className="h-[34rem] w-full">
      <FormationGallery items={galleryItems} ariaLabel="Prints in formation">
        <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">alibar/ui</p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">Ninety-six prints, four formations</p>
        <button type="button" className="mt-4 h-9 cursor-pointer rounded-full bg-foreground px-4 text-sm font-medium text-background">
          Explore the set
        </button>
      </FormationGallery>
    </div>
  );
}

export function SwirlHundredSixty() {
  return (
    <div className="h-[34rem] w-full">
      <FormationGallery items={galleryItems} count={160} transition="swirl" rings={5} interval={5000} clearance={0.3} ariaLabel="A swirl of 160 prints">
        <p className="text-lg font-semibold tracking-tight text-foreground">160 cards</p>
      </FormationGallery>
    </div>
  );
}

export function NightGlobe() {
  return (
    <div className="h-[34rem] w-full overflow-hidden rounded-xl">
      <FormationGallery
        items={galleryItems}
        formations={["globe", "rings", "field"]}
        transition="direct"
        shape="circle"
        backgroundColor="#0A0B10"
        accentColor="#F472B6"
        count={110}
        ariaLabel="Prints on a night globe"
      >
        <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">After hours</p>
        <p className="mt-1.5 text-[13px] text-white/70">Drag to spin. Click a print to open it.</p>
      </FormationGallery>
    </div>
  );
}
