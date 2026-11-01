import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { NftCard } from "@/components/ui/nft-card/nft-card";

<NftCard
  image={<img src={metadata.image} alt="" />}
  name="Lumen Orb #0427"
  collection="Lumen Orbs"
  rarity="legendary"
  price={listing.price} // bigint in wei
  traits={[{ type: "Core", value: "Glass orb", rarity: 0.031 }]}
  likes={248}
/>`,
  a11y: [
    "Traits reveal on hover and keyboard focus, and the Traits button (aria-expanded) toggles them for touch and keyboard users.",
    "The rarity badge and trait shares are text, so nothing depends on color. The like button is labelled \"Like {name}\".",
    "Tilt follows a mouse only, so touch scrolling is unaffected. Reduced motion turns off the tilt and glare and fades the traits panel without sliding it.",
  ],
  notes: [
    "Reuses Tilt Card for tilt and glare and Like Button for the heart, so they install as dependencies.",
    "Pass an <img> with an empty alt when the name is shown below it; the artwork fills a square frame with object-cover.",
  ],
};
