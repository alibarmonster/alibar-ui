"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { NftCard, type NftRarity } from "@/components/ui/nft-card/nft-card";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";

/** Generated artwork so the demo ships no images: layered gradients and orbs from a seed. */
function NftArt({ seed }: { seed: number }) {
  const hue = (seed * 67) % 360;
  const id = `nft-${seed}`;
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 85% 88%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 60) % 360} 80% 70%)`} />
        </linearGradient>
        <radialGradient id={`${id}-orb`} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.45" stopColor={`hsl(${(hue + 200) % 360} 85% 65%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 230) % 360} 70% 35%)`} />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${id}-bg)`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={30 + ((seed * 37 + i * 53) % 140)} cy={170 - i * 12} r={60 - i * 9} fill="#fff" opacity={0.08 + i * 0.03} />
      ))}
      <circle cx="100" cy="92" r="46" fill={`url(#${id}-orb)`} />
      <ellipse cx="100" cy="162" rx="40" ry="6" fill="#000" opacity="0.12" />
    </svg>
  );
}

const TRAITS = [
  { type: "Background", value: "Dawn", rarity: 0.124 },
  { type: "Core", value: "Glass orb", rarity: 0.031 },
  { type: "Aura", value: "Halo", rarity: 0.218 },
  { type: "Edition", value: "First", rarity: 0.009 },
];

type Preview = "listed" | "loading" | "unlisted";

export function Default() {
  const [preview, setPreview] = useState<Preview>("listed");
  return (
    <div className="flex flex-col items-center gap-6">
      <NftCard
        image={<NftArt seed={7} />}
        name="Lumen Orb #0427"
        collection="Lumen Orbs"
        rarity="legendary"
        price={preview === "listed" ? parseUnits("1.25", 18) : undefined}
        traits={TRAITS}
        likes={248}
        loading={preview === "loading"}
      />
      <DemoStateSwitcher<Preview> states={["listed", "loading", "unlisted"]} value={preview} onChange={setPreview} />
    </div>
  );
}

const GRID: { seed: number; rarity: NftRarity; price: string; likes: number }[] = [
  { seed: 2, rarity: "common", price: "0.042", likes: 12 },
  { seed: 11, rarity: "rare", price: "0.18", likes: 64 },
  { seed: 19, rarity: "epic", price: "0.6", likes: 131 },
];

export function Gallery() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {GRID.map((item) => (
        <NftCard
          key={item.seed}
          className="w-56"
          image={<NftArt seed={item.seed} />}
          name={`Lumen Orb #${String(item.seed * 113).padStart(4, "0")}`}
          collection="Lumen Orbs"
          rarity={item.rarity}
          price={parseUnits(item.price, 18)}
          traits={TRAITS.slice(0, 2)}
          likes={item.likes}
        />
      ))}
    </div>
  );
}
