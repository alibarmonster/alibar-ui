"use client";

import type { ReactNode } from "react";
import { ParallaxSlider } from "@/components/ui/parallax-slider/parallax-slider";

/** Seeded ridge path across a 1600-wide layer (layers are twice the slide's width). */
function ridge(seed: number, base: number, amp: number) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const points: string[] = [];
  for (let x = 0; x <= 1600; x += 100) points.push(`${x},${(base - rand() * amp).toFixed(0)}`);
  return `M0,500 L${points.join(" L")} L1600,500 Z`;
}

const Layer = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 1600 500" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden="true">
    {children}
  </svg>
);

const SCENES = [
  { id: "dawn", label: "Dawn", title: "Start before the sun", eyebrow: "01 · Dawn", sky: ["#fde4cf", "#fff6ee"], sun: "#fff3e0", hills: ["#f0b9a6", "#d48c86", "#9c5f6e"], ink: "text-zinc-900" },
  { id: "noon", label: "Noon", title: "Find the long view", eyebrow: "02 · Noon", sky: ["#bfe3ff", "#eef8ff"], sun: "#ffffff", hills: ["#9ec5ea", "#5f8fc4", "#30578f"], ink: "text-zinc-900" },
  { id: "dusk", label: "Dusk", title: "Stay for the last light", eyebrow: "03 · Dusk", sky: ["#2e1f4d", "#7b5aa8"], sun: "#ffd6a5", hills: ["#5a4486", "#3a2b63", "#1d1538"], ink: "text-white" },
];

export function Default() {
  return (
    <ParallaxSlider
      aria-label="Times of day"
      className="max-w-2xl"
      slides={SCENES.map((scene, i) => ({
        id: scene.id,
        label: scene.label,
        // Back to front: sky and sun lag furthest behind, the nearest hills move almost with the slide.
        layers: [
          {
            depth: 0.5,
            content: (
              <div className="absolute inset-0" style={{ background: `linear-gradient(${scene.sky[0]}, ${scene.sky[1]})` }}>
                <span className="absolute top-[18%] left-[62%] size-16 rounded-full sm:size-20" style={{ background: scene.sun }} />
              </div>
            ),
          },
          { depth: 0.35, content: <Layer><path d={ridge(3 + i * 5, 300, 110)} fill={scene.hills[0]} /></Layer> },
          { depth: 0.2, content: <Layer><path d={ridge(9 + i * 5, 380, 90)} fill={scene.hills[1]} /></Layer> },
          { depth: 0.05, content: <Layer><path d={ridge(17 + i * 5, 450, 60)} fill={scene.hills[2]} /></Layer> },
        ],
        children: (
          <div className={`flex h-full flex-col justify-start p-6 sm:p-8 ${scene.ink}`}>
            <p className="text-xs font-medium tracking-wider uppercase opacity-70">{scene.eyebrow}</p>
            <p className="mt-2 max-w-xs text-2xl font-semibold tracking-tight sm:text-3xl">{scene.title}</p>
          </div>
        ),
      }))}
    />
  );
}
