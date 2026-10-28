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
    id: "event-horizon-shader",
    name: "Relativistic Event Horizon",
    category: "webgl",
    summary:
      "Gravitational lensing black hole shadow with Doppler-beamed swirling accretion disk and photon ring.",
    filePath: "src/components/bits/event-horizon-shader.tsx",
    code: `<EventHorizonShader speed={1.0} />`,
  },
  {
    id: "voronoi-biocell-shader",
    name: "Voronoi Bio-Cell Mitosis",
    category: "webgl",
    summary:
      "2-pass organic Voronoi cellular tissue with sub-surface membrane distance gradients and nuclei pulse.",
    filePath: "src/components/bits/voronoi-biocell-shader.tsx",
    code: `<VoronoiBioCellShader speed={1.0} />`,
  },
  {
    id: "quantum-lattice-shader",
    name: "3D Quantum Lattice",
    category: "webgl",
    summary:
      "Sphere-traced 3D infinite modular crystal lattice with volumetric distance-field glow accumulation.",
    filePath: "src/components/bits/quantum-lattice-shader.tsx",
    code: `<QuantumLatticeShader speed={1.0} />`,
  },
  {
    id: "plasma-tokamak-shader",
    name: "Tokamak Plasma Turbulence",
    category: "webgl",
    summary:
      "Iterative domain-rotated sinusoidal fluid advection simulating magnetic fusion confinement filaments.",
    filePath: "src/components/bits/plasma-tokamak-shader.tsx",
    code: `<PlasmaTokamakShader speed={1.0} />`,
  },
  {
    id: "turing-morphogenesis-shader",
    name: "Turing Morphogenesis Coral",
    category: "webgl",
    summary:
      "Multi-scale reaction-diffusion activator-inhibitor patterns forming organic biological labyrinth ridges.",
    filePath: "src/components/bits/turing-morphogenesis-shader.tsx",
    code: `<TuringMorphogenesisShader speed={1.0} />`,
  },
  {
    id: "ascii-matrix-rain-shader",
    name: "ASCII Glyph Vortex",
    category: "webgl",
    summary:
      "Procedural bitmask character glyph quantization driven by polar swirl and falling data streams.",
    filePath: "src/components/bits/ascii-matrix-rain-shader.tsx",
    code: `<AsciiMatrixRainShader speed={1.0} />`,
  },
  {
    id: "cyber-circuit-traces-shader",
    name: "Truchet Cyber Circuit",
    category: "webgl",
    summary:
      "Procedural Truchet dual-arc PCB traces with high-speed glowing data packets following conductive paths.",
    filePath: "src/components/bits/cyber-circuit-traces-shader.tsx",
    code: `<CyberCircuitTracesShader speed={1.0} />`,
  },
  {
    id: "chromatic-prism-lens-shader",
    name: "Chromatic Prism Dispersion",
    category: "webgl",
    summary:
      "Wavelength-dependent RGB refractive index splitting across concentric interferometric wave rings.",
    filePath: "src/components/bits/chromatic-prism-lens-shader.tsx",
    code: `<ChromaticPrismLensShader speed={1.0} />`,
  },
  {
    id: "aurora-borealis-veil-shader",
    name: "Aurora Borealis Veil",
    category: "webgl",
    summary:
      "12-layer volumetric geomagnetic ribbon curtains with parallax depth fade and exponential tone mapping.",
    filePath: "src/components/bits/aurora-borealis-veil-shader.tsx",
    code: `<AuroraBorealisVeilShader speed={1.0} />`,
  },
  {
    id: "magma-convection-shader",
    name: "Volcanic Magma Fissures",
    category: "webgl",
    summary:
      "Tectonic basalt crust plates fracturing over incandescent convective mantle fissures.",
    filePath: "src/components/bits/magma-convection-shader.tsx",
    code: `<MagmaConvectionShader speed={1.0} />`,
  },
  {
    id: "warp-slipstream-tunnel-shader",
    name: "Relativistic Warp Tunnel",
    category: "webgl",
    summary:
      "Log-polar coordinate transformation tunnel with high-velocity light streaks and cursor yaw steering.",
    filePath: "src/components/bits/warp-slipstream-tunnel-shader.tsx",
    code: `<WarpSlipstreamTunnelShader speed={1.0} />`,
  },
  {
    id: "holographic-globe-mesh-shader",
    name: "Holographic Dotted Globe",
    category: "webgl",
    summary:
      "Analytic ray-sphere intersection planetary globe with procedural latitude/longitude dot continents and Fresnel rim.",
    filePath: "src/components/bits/holographic-globe-mesh-shader.tsx",
    code: `<HolographicGlobeMeshShader speed={1.0} />`,
  },
  {
    id: "hexagonal-hive-forcefield-shader",
    name: "Hexagonal Forcefield Shield",
    category: "webgl",
    summary:
      "Exact isometric hexagonal grid distance field with reactive ripple waves and glowing cell borders.",
    filePath: "src/components/bits/hexagonal-hive-forcefield-shader.tsx",
    code: `<HexagonalHiveForcefieldShader speed={1.0} />`,
  },
  {
    id: "sonar-phased-array-shader",
    name: "Phased-Array Sonar Sweep",
    category: "webgl",
    summary:
      "Polar coordinate tactical radar display with phosphor decay trail, range rings, and cursor target ping.",
    filePath: "src/components/bits/sonar-phased-array-shader.tsx",
    code: `<SonarPhasedArrayShader speed={1.0} />`,
  },
  {
    id: "lightning-arc-discharge-shader",
    name: "Tesla Arc Discharge",
    category: "webgl",
    summary:
      "Multi-strand FBM domain-displaced high-voltage plasma filaments snapping toward cursor coordinates.",
    filePath: "src/components/bits/lightning-arc-discharge-shader.tsx",
    code: `<LightningArcDischargeShader speed={1.0} />`,
  },
  {
    id: "fractal-julia-singularity-shader",
    name: "Julia Set Singularity",
    category: "webgl",
    summary:
      "Real-time complex-plane quadratic Julia set iterator with continuous potential coloring and cursor C-parameter.",
    filePath: "src/components/bits/fractal-julia-singularity-shader.tsx",
    code: `<FractalJuliaSingularityShader speed={1.0} />`,
  },
  {
    id: "neural-synapse-plexus-shader",
    name: "Neural Synapse Plexus",
    category: "webgl",
    summary:
      "Multi-layer spatial hash node graph with oscillating axon filaments and synaptic action-potential pulses.",
    filePath: "src/components/bits/neural-synapse-plexus-shader.tsx",
    code: `<NeuralSynapsePlexusShader speed={1.0} />`,
  },
  {
    id: "halftone-moire-wave-shader",
    name: "Halftone Moiré Interference",
    category: "webgl",
    summary:
      "Dual-source acoustic wave interference modulating sub-cell halftone dot radii for kinetic moiré patterns.",
    filePath: "src/components/bits/halftone-moire-wave-shader.tsx",
    code: `<HalftoneMoireWaveShader speed={1.0} />`,
  },
  {
    id: "crystal-kaleidoscope-prism-shader",
    name: "Dihedral Kaleidoscope Prism",
    category: "webgl",
    summary:
      "6-fold dihedral mirror-folded IFS geometry producing razor-sharp geometric crystal facets.",
    filePath: "src/components/bits/crystal-kaleidoscope-prism-shader.tsx",
    code: `<CrystalKaleidoscopePrismShader speed={1.0} />`,
  },
  {
    id: "magnetic-dipole-flux-shader",
    name: "Magnetic Dipole Flux",
    category: "webgl",
    summary:
      "Bipolar vector potential field rendering magnetic flux lines and orthogonal equipotential contours.",
    filePath: "src/components/bits/magnetic-dipole-flux-shader.tsx",
    code: `<MagneticDipoleFluxShader speed={1.0} />`,
  },
  {
    id: "solar-corona-eclipse-shader",
    name: "Solar Corona Eclipse",
    category: "webgl",
    summary:
      "Total solar eclipse occlusion disc with harmonic coronal mass ejections and diamond-ring flare.",
    filePath: "src/components/bits/solar-corona-eclipse-shader.tsx",
    code: `<SolarCoronaEclipseShader speed={1.0} />`,
  },
  {
    id: "aerodynamic-wind-tunnel-shader",
    name: "Aerodynamic Streamlines",
    category: "webgl",
    summary:
      "Laminar flow streamlines deflecting around a cursor pressure boundary with wake turbulence.",
    filePath: "src/components/bits/aerodynamic-wind-tunnel-shader.tsx",
    code: `<AerodynamicWindTunnelShader speed={1.0} />`,
  },
  {
    id: "liquid-mercury-metaballs-shader",
    name: "Liquid Mercury Metaballs",
    category: "webgl",
    summary:
      "3D sphere-traced polynomial smooth-minimum (smin) metaballs with finite-difference normals and Fresnel chrome.",
    filePath: "src/components/bits/liquid-mercury-metaballs-shader.tsx",
    code: `<LiquidMercuryMetaballsShader speed={1.0} />`,
  },
  {
    id: "synthwave-grid-horizon-shader",
    name: "Pulsar Joy-Plot Horizon",
    category: "webgl",
    summary:
      "Stacked radio-astronomy elevation scanlines with foreground occlusion masking and Gaussian envelope.",
    filePath: "src/components/bits/synthwave-grid-horizon-shader.tsx",
    code: `<SynthwaveGridHorizonShader speed={1.0} />`,
  },
  {
    id: "bioluminescent-embers-shader",
    name: "Bioluminescent Deep Embers",
    category: "webgl",
    summary:
      "3-layer parallax rising particle field with harmonic drift and phase-shifted bioluminescent flicker.",
    filePath: "src/components/bits/bioluminescent-embers-shader.tsx",
    code: `<BioluminescentEmbersShader speed={1.0} />`,
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
