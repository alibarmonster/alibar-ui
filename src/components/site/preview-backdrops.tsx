"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Site-only: components that work as full backgrounds. The preview can show them on their own, behind
 * a sample landing page in a browser window, or behind a mobile hero in a phone. Each one loads only
 * when its page needs it. `variants` maps a demo export name to the props that match it.
 */
type BackdropProps = { className?: string } & Record<string, unknown>;

export interface Backdrop {
  Component: ComponentType<BackdropProps>;
  /** Text color for the sample hero laid over it. @default "light" (dark text) */
  tone?: "light" | "dark";
  /** Default props. */
  props?: Record<string, unknown>;
  /** Props per demo variant, by export name. */
  variants?: Record<string, { props?: Record<string, unknown>; tone?: "light" | "dark" }>;
}

const load = <T,>(loader: () => Promise<T>, pick: (m: T) => unknown) =>
  dynamic(() => loader().then((m) => pick(m) as ComponentType<BackdropProps>), { ssr: false });

export const backdrops: Record<string, Backdrop> = {
  "cloud-shader": { Component: load(() => import("@/components/ui/cloud-shader/cloud-shader"), (m) => m.CloudShader) },
  "mesh-gradient": {
    Component: load(() => import("@/components/ui/mesh-gradient/mesh-gradient"), (m) => m.MeshGradient),
    variants: { Sunset: { props: { colors: ["#FED7AA", "#FBCFE8", "#DDD6FE", "#FEF3C7"], speed: 1.6 } } },
  },
  "grain-gradient": { Component: load(() => import("@/components/ui/grain-gradient/grain-gradient"), (m) => m.GrainGradient) },
  "dithered-waves": { Component: load(() => import("@/components/ui/dithered-waves/dithered-waves"), (m) => m.DitheredWaves) },
  "liquid-ripple": { Component: load(() => import("@/components/ui/liquid-ripple/liquid-ripple"), (m) => m.LiquidRipple) },
  "dot-matrix-field": { Component: load(() => import("@/components/ui/dot-matrix-field/dot-matrix-field"), (m) => m.DotMatrixField) },
  "light-rays": { Component: load(() => import("@/components/ui/light-rays/light-rays"), (m) => m.LightRays) },
  "gpu-aurora": { Component: load(() => import("@/components/ui/gpu-aurora/gpu-aurora"), (m) => m.GpuAurora) },
  "aurora-background": { Component: load(() => import("@/components/ui/aurora-background/aurora-background"), (m) => m.AuroraBackground) },
  "particle-field": {
    Component: load(() => import("@/components/ui/particle-field/particle-field"), (m) => m.ParticleField),
    variants: { Accent: { props: { links: false, density: 3, color: "var(--primary)", repelRadius: 90, repelStrength: 1.6, speed: 0.15 } } },
  },
  "dot-grid": { Component: load(() => import("@/components/ui/dot-grid/dot-grid"), (m) => m.DotGrid) },
  "animated-grid-pattern": { Component: load(() => import("@/components/ui/animated-grid-pattern/animated-grid-pattern"), (m) => m.AnimatedGridPattern) },
  "ascii-aquarium-background": { Component: load(() => import("@/components/ui/ascii-aquarium-background/ascii-aquarium-background"), (m) => m.AsciiAquariumBackground) },
  "ascii-koi-pond": {
    Component: load(() => import("@/components/ui/ascii-koi-pond/ascii-koi-pond"), (m) => m.AsciiKoiPond),
    props: { showCounter: false },
    variants: {
      Night: { props: { palette: "dark", koi: 7, lilyPads: 4, showCounter: false }, tone: "dark" },
      Custom: { props: { koi: 3, cell: 18, lilyPads: 2, showCounter: false, palette: { base: "light", background: "#eef6f4", body: "#dbe6e3", line: "#a9c4bd", patch: "#f0b43c", patchDeep: "#e07a2c" } } },
    },
  },
  "pixel-landscape": {
    Component: load(() => import("@/components/ui/pixel-landscape/pixel-landscape"), (m) => m.PixelLandscape),
    variants: { Alpine: { props: { palette: "alpine", seed: 3, height: 0.66 } }, Dusk: { props: { palette: "dusk", seed: 12, shape: "square", cell: 8 } } },
  },
  "dither-wildlife": {
    Component: load(() => import("@/components/ui/dither-wildlife/dither-wildlife"), (m) => m.DitherWildlife),
    variants: {
      Flock: { props: { scene: "birds" } },
      Grove: { props: { scene: "grove" } },
      Sepia: { props: { tones: ["#e3cfa8", "#c49a62", "#8a5d34", "#4a2f1a"], background: "#fbf4e6" } },
    },
  },
  "pixel-mosaic": {
    Component: load(() => import("@/components/ui/pixel-mosaic/pixel-mosaic"), (m) => m.PixelMosaic),
    props: { edge: "bottom", fill: 0.45 },
    variants: { Sunset: { props: { edge: "both", fill: 0.35, cell: 10, colors: ["#3b0764", "#be185d", "#f97316", "#fde047"] } } },
  },
};
