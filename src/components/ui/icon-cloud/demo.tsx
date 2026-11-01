"use client";

import { IconCloud } from "@/components/ui/icon-cloud/icon-cloud";
import { placeholderBrands } from "@/components/site/placeholder-logos";

const ICONS = [...placeholderBrands, ...placeholderBrands.slice(0, 8).map((b) => ({ ...b, name: `${b.name} Cloud` }))].map((brand) => ({
  name: brand.name,
  icon: <brand.Mark />,
}));

export function Default() {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <IconCloud icons={ICONS} label="Supported integrations" />
      <p className="text-[13px] text-muted-foreground">Drag to spin.</p>
    </div>
  );
}

export function Slow() {
  return <IconCloud className="max-w-xs" icons={ICONS.slice(0, 12)} speed={0.15} iconSize={34} />;
}
