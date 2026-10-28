export interface ComponentEntry {
  id: string;
  name: string;
  category: "webgl" | "controls" | "ai";
  summary: string;
  filePath: string;
  code: string;
}

export const REGISTRY: ComponentEntry[] = [
  {
    id: "ferrofluid-shader",
    name: "Ferrofluid Surface",
    category: "webgl",
    summary:
      "Domain-warped FBM liquid metal shader with mouse magnetic distortion and iridescent Fresnel highlights.",
    filePath: "src/components/bits/ferrofluid-shader.tsx",
    code: `<FerrofluidShader speed={1.0} distortion={1.6} />`,
  },
  {
    id: "dither-field",
    name: "Ordered Dither Matrix",
    category: "webgl",
    summary:
      "4x4 Bayer matrix quantization shader with pointer ripple propagation and adjustable pixel grid scale.",
    filePath: "src/components/bits/dither-field.tsx",
    code: `<DitherField speed={1.0} pixelSize={4} />`,
  },
  {
    id: "caustic-beams",
    name: "Caustic Energy Beams",
    category: "webgl",
    summary:
      "Multi-harmonic interferometric light curves reactive to cursor proximity with exponential tone mapping.",
    filePath: "src/components/bits/caustic-beams.tsx",
    code: `<CausticBeams speed={1.0} intensity={1.2} />`,
  },
  {
    id: "tactile-knob",
    name: "Tactile Rotary Knob",
    category: "controls",
    summary:
      "Pointer-captured vertical drag rotary encoder with SVG arc meter, keyboard arrows, and spring odometer.",
    filePath: "src/components/bits/tactile-knob.tsx",
    code: `<TactileKnob min={0} max={100} defaultValue={64} label="RESONANCE" />`,
  },
  {
    id: "elastic-tabs",
    name: "Elastic Morphing Tabs",
    category: "controls",
    summary:
      "Shared-layout spring pill navigation with independent hover indicator and full ARIA tablist semantics.",
    filePath: "src/components/bits/elastic-tabs.tsx",
    code: `<ElasticTabs tabs={["Shaders", "Tactile", "Telemetry", "Compute"]} />`,
  },
  {
    id: "reasoning-trace",
    name: "Agent Reasoning Trace",
    category: "ai",
    summary:
      "Collapsible execution trace accordion with staggered step reveal and live millisecond telemetry.",
    filePath: "src/components/bits/reasoning-trace.tsx",
    code: `<ReasoningTrace title="Synthesizing shader & motion graph" />`,
  },
];
