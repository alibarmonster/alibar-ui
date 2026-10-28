export interface ComponentEntry {
  id: string;
  name: string;
  category: "webgl" | "controls" | "text" | "navigation" | "sections" | "ai";
  summary: string;
  filePath: string;
  code: string;
}

export const REGISTRY: ComponentEntry[] = [
  {
    id: "horizon-hero-stage",
    name: "Horizon Hero Stage",
    category: "sections",
    summary:
      "Full-bleed caustic shader hero section with live FPS telemetry badge, cipher headline, and haptic CTA.",
    filePath: "src/components/bits/horizon-hero-stage.tsx",
    code: `<HorizonHeroStage speed={1.0} />`,
  },
  {
    id: "dynamic-island-nav",
    name: "Dynamic Island Navbar",
    category: "navigation",
    summary:
      "Multi-state morphing top navbar pill (Idle → Compiling GLSL → Edge Deployed) with spring layout transitions.",
    filePath: "src/components/bits/dynamic-island-nav.tsx",
    code: `<DynamicIslandNav />`,
  },
  {
    id: "magnetic-dock",
    name: "Magnetic Floating Dock",
    category: "navigation",
    summary:
      "Pointer-attracted floating navigation bar with spring-coupled cursor pull and shared active pill.",
    filePath: "src/components/bits/magnetic-dock.tsx",
    code: `<MagneticDock />`,
  },
  {
    id: "hyper-cipher-text",
    name: "Hyper-Cipher Matrix Text",
    category: "text",
    summary:
      "Cryptographic glyph-decryption text reveal with neon-acid active cursor sweep on click or hover.",
    filePath: "src/components/bits/hyper-cipher-text.tsx",
    code: `<HyperCipherText phrases={["ZERO-OVERHEAD GLSL", "SPRING PHYSICS"]} />`,
  },
  {
    id: "kinetic-pressure-text",
    name: "Kinetic Pressure Typography",
    category: "text",
    summary:
      "Proximity-reactive per-character spring scale and vertical wave distortion driven by cursor X-distance.",
    filePath: "src/components/bits/kinetic-pressure-text.tsx",
    code: `<KineticPressureText text="KINETIC WAVEFORM" />`,
  },
  {
    id: "haptic-micro-button",
    name: "Haptic Micro-Action Button",
    category: "controls",
    summary:
      "Tactile multi-stage deploy trigger (Idle → Verifying Signatures → Shipped) with spring compression.",
    filePath: "src/components/bits/haptic-micro-button.tsx",
    code: `<HapticMicroButton />`,
  },
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
    id: "cymatics-shader",
    name: "Chladni Cymatics Plate",
    category: "webgl",
    summary:
      "Acoustic standing-wave eigenmode solver rendering resonant Chladni nodal lines reactive to cursor coordinates.",
    filePath: "src/components/bits/cymatics-shader.tsx",
    code: `<CymaticsShader speed={1.0} drive={0.7} />`,
  },
  {
    id: "thin-film-shader",
    name: "Thin-Film Interference",
    category: "webgl",
    summary:
      "Optical path difference interference shader simulating soap-bubble spectral iridescence and fluid thickness.",
    filePath: "src/components/bits/thin-film-shader.tsx",
    code: `<ThinFilmShader speed={1.0} thickness={2.4} />`,
  },
  {
    id: "topography-shader",
    name: "Topography Isolines",
    category: "webgl",
    summary:
      "Anti-aliased screen-space derivative elevation contours (fwidth) with cursor terrain deformation.",
    filePath: "src/components/bits/topography-shader.tsx",
    code: `<TopographyShader speed={1.0} density={18} />`,
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
    id: "split-flap-board",
    name: "Split-Flap Solari Board",
    category: "controls",
    summary:
      "Mechanical airport departure board with per-character 3D X-axis spring flip and staggered cascade.",
    filePath: "src/components/bits/split-flap-board.tsx",
    code: `<SplitFlapBoard words={["ONLINE", "SHADER", "DEPLOY"]} />`,
  },
  {
    id: "morphic-command-palette",
    name: "Morphic Command Palette",
    category: "controls",
    summary:
      "Trigger button that morphs into a filtered command dialog via shared layoutId with keyboard arrow navigation.",
    filePath: "src/components/bits/morphic-command-palette.tsx",
    code: `<MorphicCommandPalette />`,
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
  {
    id: "tool-call-card",
    name: "Agent Tool Call Inspector",
    category: "ai",
    summary:
      "Interactive RPC invocation card with spring-underlined Payload/Result JSON inspector and status badge.",
    filePath: "src/components/bits/tool-call-card.tsx",
    code: `<ToolCallCard toolName="webgl.compile_shader" latencyMs={18} />`,
  },
];
