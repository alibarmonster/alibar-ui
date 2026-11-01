"use client";

import { useState } from "react";
import { AsciiWildlifeSim } from "@/components/bits/ascii-wildlife-sim";
import { AsciiRecipeCrtStudio } from "@/components/bits/ascii-recipe-crt-studio";
import { AsciiDitherPaletteLab } from "@/components/bits/ascii-dither-palette-lab";
import { DitherField } from "@/components/bits/dither-field";
import { CymaticsShader } from "@/components/bits/cymatics-shader";
import { PlasmaTokamakShader } from "@/components/bits/plasma-tokamak-shader";
import { AsciiMatrixRainShader } from "@/components/bits/ascii-matrix-rain-shader";
import { HalftoneMoireWaveShader } from "@/components/bits/halftone-moire-wave-shader";
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
      case "ascii-wildlife-sim":
        return <AsciiWildlifeSim speed={speed} defaultTheme="split" />;
      case "ascii-recipe-crt-studio":
        return <AsciiRecipeCrtStudio speed={speed} />;
      case "ascii-dither-palette-lab":
        return <AsciiDitherPaletteLab speed={speed} />;
      case "dither-field":
        return <DitherField speed={speed} pixelSize={4} />;
      case "cymatics-shader":
        return <CymaticsShader speed={speed} drive={0.7} />;
      case "plasma-tokamak-shader":
        return <PlasmaTokamakShader speed={speed} />;
      case "ascii-matrix-rain-shader":
        return <AsciiMatrixRainShader speed={speed} />;
      case "halftone-moire-wave-shader":
        return <HalftoneMoireWaveShader speed={speed} />;
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
              v1.0.0 · 20 Primitives
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
              <span>CURATED WEBGL2 + SPRING PHYSICS VAULT</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Personal UI, Motion &amp; Shader Arsenal.
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              17 curated zero-wrapper primitives: 5 signature WebGL2 shaders
              (Ordered Dither, Chladni Cymatics, Tokamak Plasma, ASCII Glyph
              Vortex, Halftone Moiré), plus tactile controls, navbars, and
              kinetic typography.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "All (20)" },
              { key: "webgl", label: "Shaders & ASCII Sim (8)" },
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
              className={`group rounded-2xl border border-white/10 bg-[#111114] overflow-hidden flex flex-col shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ${
                item.id === "ascii-wildlife-sim" ? "md:col-span-2" : ""
              }`}
            >
              <div
                className={`relative w-full bg-[#0b0b0e] flex items-center justify-center overflow-hidden border-b border-white/10 ${
                  item.id === "ascii-wildlife-sim" ? "h-96" : "h-72"
                }`}
              >
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
