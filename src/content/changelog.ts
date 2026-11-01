export type ChangeType = "Added" | "Changed" | "Fixed";

export interface Release {
  version: string;
  /** ISO date of the release. Leave it out while the release is in progress. */
  date?: string;
  title: string;
  summary: string;
  changes: { type: ChangeType; items: string[] }[];
}

/**
 * Release notes, newest first. Each release's component list comes from the catalog
 * (`version` on each entry), so only the prose lives here.
 */
export const releases: Release[] = [
  {
    version: "0.2.0",
    title: "Web3, marketing sections, shaders and orbits",
    summary:
      "Fifty new components in five new categories, built on shared foundations for WebGL2 shaders and bigint-safe on-chain formatting.",
    changes: [
      {
        type: "Added",
        items: [
          "Five categories: Web3: Wallet & Identity, Web3: DeFi & Trading, Marketing Sections & Logo Clouds, Shaders & Backgrounds, and Orbits, Beams & Illustrations.",
          "useShaderCanvas: renders a fragment shader with WebGL2 (no three.js), caps the pixel ratio, pauses offscreen and in hidden tabs, draws one static frame under reduced motion and recovers from context loss.",
          "Shared GLSL snippets (hash, simplex noise, fBm, Bayer dither), a hex-to-vec3 color helper, and web3 formatting built on bigint math and viem.",
          "A version badge in the navbar and this changelog.",
        ],
      },
      {
        type: "Changed",
        items: [
          "The New badge marks every component added in the latest release, instead of a hand-picked list. Components from 0.1.0 no longer show it.",
          "Registry items can ship the new shared lib files (color, shader and web3 helpers) next to a component, just like lib/motion.ts.",
        ],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-11-01",
    title: "Initial release",
    summary: "100 animated, accessible components in ten categories, with a docs site and a shadcn-compatible registry.",
    changes: [
      {
        type: "Added",
        items: [
          "100 components: Buttons & Actions, Inputs & Forms, Toggles & Selection, Overlays & Feedback, Navigation, Text Animations, Numbers & Data Display, Cards & Layout, Media, Scroll & Backgrounds, and Loaders, AI & Widgets.",
          "A shadcn registry that installs each component with its dependencies, helpers, design tokens and sibling components.",
          "A docs site with live previews, variants, code, install commands, props tables and accessibility notes for every component.",
          "Shared motion tokens (durations, easings, springs) and design tokens for color, radius and shadows.",
        ],
      },
    ],
  },
];

export const releaseAnchor = (version: string) => `v${version.replace(/\./g, "-")}`;
