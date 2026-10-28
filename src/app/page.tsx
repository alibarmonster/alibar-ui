"use client";

import { useState } from "react";
import { FerrofluidShader } from "@/components/bits/ferrofluid-shader";
import { DitherField } from "@/components/bits/dither-field";
import { CausticBeams } from "@/components/bits/caustic-beams";
import { CymaticsShader } from "@/components/bits/cymatics-shader";
import { ThinFilmShader } from "@/components/bits/thin-film-shader";
import { TopographyShader } from "@/components/bits/topography-shader";
import { EventHorizonShader } from "@/components/bits/event-horizon-shader";
import { VoronoiBioCellShader } from "@/components/bits/voronoi-biocell-shader";
import { QuantumLatticeShader } from "@/components/bits/quantum-lattice-shader";
import { PlasmaTokamakShader } from "@/components/bits/plasma-tokamak-shader";
import { TuringMorphogenesisShader } from "@/components/bits/turing-morphogenesis-shader";
import { AsciiMatrixRainShader } from "@/components/bits/ascii-matrix-rain-shader";
import { CyberCircuitTracesShader } from "@/components/bits/cyber-circuit-traces-shader";
import { ChromaticPrismLensShader } from "@/components/bits/chromatic-prism-lens-shader";
import { AuroraBorealisVeilShader } from "@/components/bits/aurora-borealis-veil-shader";
import { MagmaConvectionShader } from "@/components/bits/magma-convection-shader";
import { WarpSlipstreamTunnelShader } from "@/components/bits/warp-slipstream-tunnel-shader";
import { HolographicGlobeMeshShader } from "@/components/bits/holographic-globe-mesh-shader";
import { HexagonalHiveForcefieldShader } from "@/components/bits/hexagonal-hive-forcefield-shader";
import { SonarPhasedArrayShader } from "@/components/bits/sonar-phased-array-shader";
import { LightningArcDischargeShader } from "@/components/bits/lightning-arc-discharge-shader";
import { FractalJuliaSingularityShader } from "@/components/bits/fractal-julia-singularity-shader";
import { NeuralSynapsePlexusShader } from "@/components/bits/neural-synapse-plexus-shader";
import { HalftoneMoireWaveShader } from "@/components/bits/halftone-moire-wave-shader";
import { CrystalKaleidoscopePrismShader } from "@/components/bits/crystal-kaleidoscope-prism-shader";
import { MagneticDipoleFluxShader } from "@/components/bits/magnetic-dipole-flux-shader";
import { SolarCoronaEclipseShader } from "@/components/bits/solar-corona-eclipse-shader";
import { AerodynamicWindTunnelShader } from "@/components/bits/aerodynamic-wind-tunnel-shader";
import { LiquidMercuryMetaballsShader } from "@/components/bits/liquid-mercury-metaballs-shader";
import { SynthwaveGridHorizonShader } from "@/components/bits/synthwave-grid-horizon-shader";
import { BioluminescentEmbersShader } from "@/components/bits/bioluminescent-embers-shader";
import { TactileKnob } from "@/components/bits/tactile-knob";
import { ElasticTabs } from "@/components/bits/elastic-tabs";
import { SplitFlapBoard } from "@/components/bits/split-flap-board";
import { MorphicCommandPalette } from "@/components/bits/morphic-command-palette";
import { ReasoningTrace } from "@/components/bits/reasoning-trace";
import { ToolCallCard } from "@/components/bits/tool-call-card";
import { HyperCipherText } from "@/components/bits/hyper-cipher-text";
import { KineticPressureText } from "@/components/bits/kinetic-pressure-text";
import { MagneticDock } from "@/components/bits/magnetic-dock";
import { DynamicIslandNav } from "@/components/bits/dynamic-island-nav";
import { HapticMicroButton } from "@/components/bits/haptic-micro-button";
import { HorizonHeroStage } from "@/components/bits/horizon-hero-stage";
import { REGISTRY } from "@/lib/registry";

export default function ComponentsVaultPage() {
  const [filter, setFilter] = useState<string>("all");
  const [speed, setSpeed] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const items = REGISTRY.filter((item) =>
    filter === "all" ? true : item.category === filter
  );

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const renderPreview = (id: string) => {
    switch (id) {
      case "horizon-hero-stage":
        return <HorizonHeroStage speed={speed} />;
      case "dynamic-island-nav":
        return <DynamicIslandNav />;
      case "magnetic-dock":
        return <MagneticDock />;
      case "hyper-cipher-text":
        return <HyperCipherText />;
      case "kinetic-pressure-text":
        return <KineticPressureText />;
      case "haptic-micro-button":
        return <HapticMicroButton />;
      case "ferrofluid-shader":
        return <FerrofluidShader speed={speed} />;
      case "dither-field":
        return <DitherField speed={speed} pixelSize={4} />;
      case "caustic-beams":
        return <CausticBeams speed={speed} intensity={1.2} />;
      case "cymatics-shader":
        return <CymaticsShader speed={speed} drive={0.7} />;
      case "thin-film-shader":
        return <ThinFilmShader speed={speed} thickness={2.4} />;
      case "topography-shader":
        return <TopographyShader speed={speed} density={18} />;
      case "event-horizon-shader":
        return <EventHorizonShader speed={speed} />;
      case "voronoi-biocell-shader":
        return <VoronoiBioCellShader speed={speed} />;
      case "quantum-lattice-shader":
        return <QuantumLatticeShader speed={speed} />;
      case "plasma-tokamak-shader":
        return <PlasmaTokamakShader speed={speed} />;
      case "turing-morphogenesis-shader":
        return <TuringMorphogenesisShader speed={speed} />;
      case "ascii-matrix-rain-shader":
        return <AsciiMatrixRainShader speed={speed} />;
      case "cyber-circuit-traces-shader":
        return <CyberCircuitTracesShader speed={speed} />;
      case "chromatic-prism-lens-shader":
        return <ChromaticPrismLensShader speed={speed} />;
      case "aurora-borealis-veil-shader":
        return <AuroraBorealisVeilShader speed={speed} />;
      case "magma-convection-shader":
        return <MagmaConvectionShader speed={speed} />;
      case "warp-slipstream-tunnel-shader":
        return <WarpSlipstreamTunnelShader speed={speed} />;
      case "holographic-globe-mesh-shader":
        return <HolographicGlobeMeshShader speed={speed} />;
      case "hexagonal-hive-forcefield-shader":
        return <HexagonalHiveForcefieldShader speed={speed} />;
      case "sonar-phased-array-shader":
        return <SonarPhasedArrayShader speed={speed} />;
      case "lightning-arc-discharge-shader":
        return <LightningArcDischargeShader speed={speed} />;
      case "fractal-julia-singularity-shader":
        return <FractalJuliaSingularityShader speed={speed} />;
      case "neural-synapse-plexus-shader":
        return <NeuralSynapsePlexusShader speed={speed} />;
      case "halftone-moire-wave-shader":
        return <HalftoneMoireWaveShader speed={speed} />;
      case "crystal-kaleidoscope-prism-shader":
        return <CrystalKaleidoscopePrismShader speed={speed} />;
      case "magnetic-dipole-flux-shader":
        return <MagneticDipoleFluxShader speed={speed} />;
      case "solar-corona-eclipse-shader":
        return <SolarCoronaEclipseShader speed={speed} />;
      case "aerodynamic-wind-tunnel-shader":
        return <AerodynamicWindTunnelShader speed={speed} />;
      case "liquid-mercury-metaballs-shader":
        return <LiquidMercuryMetaballsShader speed={speed} />;
      case "synthwave-grid-horizon-shader":
        return <SynthwaveGridHorizonShader speed={speed} />;
      case "bioluminescent-embers-shader":
        return <BioluminescentEmbersShader speed={speed} />;
      case "tactile-knob":
        return <TactileKnob />;
      case "elastic-tabs":
        return <ElasticTabs />;
      case "split-flap-board":
        return <SplitFlapBoard />;
      case "morphic-command-palette":
        return (
          <div className="px-4 w-full flex justify-center">
            <MorphicCommandPalette />
          </div>
        );
      case "reasoning-trace":
        return (
          <div className="px-4 w-full flex justify-center">
            <ReasoningTrace />
          </div>
        );
      case "tool-call-card":
        return (
          <div className="px-4 w-full flex justify-center">
            <ToolCallCard />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c8ff4d] shadow-[0_0_12px_#c8ff4d]" />
            <span className="font-mono text-sm font-semibold tracking-tight">
              alibar/components
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
              v1.0.0 · 43 Primitives
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span>SHADER SPEED</span>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-24 accent-[#c8ff4d] cursor-pointer"
              />
              <span className="text-[#c8ff4d] w-8">{speed.toFixed(1)}x</span>
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#111114] p-8 sm:p-12 mb-12">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#c8ff4d]">
              <span>SINGLE-CONTEXT MULTIPLEXED WEBGL2 + SPRING PHYSICS</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Personal UI, Motion &amp; Shader Arsenal.
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              43 zero-wrapper copy-pasteable primitives: 31 procedural WebGL2
              shaders multiplexed across a single offscreen GPU context (zero
              context-loss), plus tactile controls, navbars, and kinetic text.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "All (43)" },
              { key: "webgl", label: "WebGL Shaders (31)" },
              { key: "controls", label: "Tactile & Micro (5)" },
              { key: "navigation", label: "Navbars & Docks (2)" },
              { key: "text", label: "Text Animations (2)" },
              { key: "sections", label: "Hero & Sections (1)" },
              { key: "ai", label: "Agent Telemetry (2)" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                  filter === tab.key
                    ? "bg-[#c8ff4d] text-black font-semibold"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="group rounded-2xl border border-white/10 bg-[#111114] overflow-hidden flex flex-col shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            >
              <div className="relative h-72 w-full bg-[#0b0b0e] flex items-center justify-center overflow-hidden border-b border-white/10">
                {renderPreview(item.id)}

                <span className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 font-mono text-[10px] uppercase tracking-wider text-zinc-300">
                  {item.category}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-zinc-100">
                      {item.name}
                    </h2>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {item.filePath}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <code className="text-[11px] font-mono text-[#5eead4] truncate">
                    {item.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyCode(item.id, item.code)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 cursor-pointer transition"
                  >
                    {copiedId === item.id ? "Copied" : "Copy JSX"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
