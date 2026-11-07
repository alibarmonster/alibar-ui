"use client";

import { glyphSources, studioPeople } from "@/components/site/studio-images";
import { GlyphMapCard } from "@/components/ui/glyph-map-card/glyph-map-card";

const [fish, bird, skyline] = glyphSources;
const watchers = (offset: number, total: number) => ({
  people: studioPeople.slice(offset, offset + 3).map((p) => ({ name: p.name, image: p.portrait })),
  total,
});

export function Trio() {
  return (
    <div className="@container w-full">
      <div className="grid justify-items-center gap-5 @[34rem]:grid-cols-2 @[52rem]:grid-cols-3">
        <GlyphMapCard
          image={fish.src}
          imageAlt={fish.alt}
          tone="indigo"
          title="Reef Drifter"
          description="A striped reef fish, sampled into a map of classic ASCII glyphs."
          location="Tidepool Studio, Bay 3"
          watchers={watchers(0, 33)}
        />
        <GlyphMapCard
          image={bird.src}
          imageAlt={bird.alt}
          tone="green"
          ramp="binary"
          label="Field Card"
          title="Morning Perch"
          description="A songbird on a leafy branch, written in ones and zeros."
          location="Orchard Lane Feeder"
          watchers={watchers(3, 18)}
        />
        <GlyphMapCard
          image={skyline.src}
          imageAlt={skyline.alt}
          tone="ember"
          ramp="blocks"
          label="City Card"
          title="Low Sun Skyline"
          description="Towers at dusk in shade blocks, warm as the hour."
          location="Harbor District"
          watchers={watchers(5, 52)}
          defaultAdded
        />
      </div>
    </div>
  );
}

export function Default() {
  return <GlyphMapCard />;
}

export function Mono() {
  return (
    <GlyphMapCard
      image={skyline.src}
      imageAlt={skyline.alt}
      tone="mono"
      cell={8}
      label="Archive"
      title="Night Shift"
      description="The same skyline in ink on paper, with finer cells."
      caption="Skyline study, 8px cells"
    />
  );
}
