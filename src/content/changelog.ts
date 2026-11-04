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
    version: "0.3.0",
    title: "3D galleries, physical surfaces, prediction markets, billing, HTML in Canvas and navbars",
    summary:
      "Sixty components, most in six new categories, built on a shared WebGL2 gallery engine, simulated market and billing data, and an adapter for the experimental HTML-in-Canvas API.",
    changes: [
      {
        type: "Added",
        items: [
          "Five categories: 3D Galleries & Carousels, Physical Surfaces & Navigation, Prediction Markets, Usage, Billing & Agent Commerce, and HTML in Canvas, each with its own sidebar group.",
          "A shared gallery engine: a WebGL2 renderer for textured cards (rounded corners, soft shadows, edge fades and floor reflections in one instanced draw), one input hook for drag, wheel, keyboard and autoplay, and a hidden DOM list that keeps every gallery keyboard and screen-reader operable.",
          "24 original generated placeholder images for gallery demos.",
          "Prediction market foundations (integer basis-point and cent math, formatting, a hydration-safe clock) and two demo pages built from the ten market components: a full market page at /demos/prediction-market and a filterable feed at /demos/prediction-feed. All market data is simulated.",
          "Usage and billing components built on integer minor-unit money (USD and IDR) and integer credits: Spend Meter, Credit Trend, Credit Breakdown, Printed Receipt and Wallet Agent Chat. Totals roll instead of swapping, every category color has a label, and the wallet agent is scripted and never signs anything without an explicit approve click.",
          "HTML in Canvas: ten components that draw live DOM through the experimental WICG API (Ripple Form, Dissolve Transition, CRT Terminal, Disintegrate Delete, Magnifier Lens, Cloth Banner, Peel Card, Liquid Glass Overlay, Floating Screen and Living Book), all through one adapter that keeps clicks, focus and selection on the drawn pixels, each with a CSS fallback for every other browser, and a demo page at /demos/html-in-canvas.",
          "ASCII Koi Pond in Shaders & Backgrounds: glyph-cell koi that swim, leave wakes, come to look at the cursor and race for food you drop.",
          "Shelf Gallery, Foil Card Drift, Icon Headline, Pixel Mosaic and Tumbling Tags: covers on floating shelves, foil cards drifting in 3D, a headline with inline app icons, a living pixel band and a pile of tumbling product blocks.",
          "Pixel Landscape: a dot-mosaic mountain range the pointer relights like a moving sun.",
          "Navbars & Headers: sixteen site headers (Island Nav, Float Bar, Split Islands, Duo Panel Menu, Catalog Menu, Ticker Header, Center Pill Nav, Morphing Dropdown Nav, Scroll-Aware Nav, Sheet Nav, Notch Nav, Gooey Nav, Liquid Tab Nav, Overlay Menu Nav, Takeover Nav and Gather Nav) sharing menu, scroll and mobile-menu helpers, all keyboard operable and sized by container queries.",
        ],
      },
      {
        type: "Changed",
        items: ["The New badge moves to 0.3.0 components; components from 0.2.0 no longer show it."],
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-11-01",
    title: "Web3, marketing sections, shaders and orbits",
    summary:
      "Fifty-one new components in five new categories, built on shared foundations for WebGL2 shaders and bigint-safe on-chain formatting.",
    changes: [
      {
        type: "Added",
        items: [
          "Five categories: Web3: Wallet & Identity, Web3: DeFi & Trading, Marketing Sections & Logo Clouds, Shaders & Backgrounds, and Orbits, Beams & Illustrations.",
          "useShaderCanvas: renders a fragment shader with WebGL2 (no three.js), caps the pixel ratio, pauses offscreen and in hidden tabs, draws one static frame under reduced motion and recovers from context loss.",
          "Shared GLSL snippets (hash, simplex noise, fBm, Bayer dither), a hex-to-vec3 color helper, and web3 formatting built on bigint math and viem.",
          "A version badge in the navbar and this changelog.",
          "Landing page: a What's new section with live showcases (Token Swap Widget, Orbiting Circles, ASCII Aquarium Background), Logo Grid Hover Reveal under the hero and an optional Cloud Shader hero background.",
          "useShaderCanvas also takes texture uniforms (images, canvases, video) and per-frame uniform functions, and exposes its clock. On software WebGL (no GPU), shaders use their CSS fallback instead of blocking the main thread.",
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
