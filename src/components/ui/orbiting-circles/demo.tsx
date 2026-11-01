"use client";

import { OrbitingCircles } from "@/components/ui/orbiting-circles/orbiting-circles";
import { placeholderBrands } from "@/components/site/placeholder-logos";

const apps = (from: number, to: number) => placeholderBrands.slice(from, to).map((brand) => ({ name: brand.name, icon: <brand.Mark /> }));

const Hub = () => (
  <span className="grid size-16 place-items-center rounded-2xl bg-foreground text-background shadow-lg">
    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-label="Your app">
      <path d="M6.5 16.75c2.6 0 3.7-1.5 4.6-4.1l.5-1.4c.9-2.5 2-4 4.9-4" />
    </svg>
  </span>
);

export function Integrations() {
  return (
    <div className="w-full max-w-lg text-center">
      <p className="text-sm font-medium text-primary">Integrations</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Connects to the tools you already use</p>
      <OrbitingCircles
        className="mt-4"
        center={<Hub />}
        rings={[
          { radius: 110, duration: 26, items: apps(0, 4) },
          { radius: 200, duration: 40, reverse: true, iconSize: 44, items: apps(4, 10) },
        ]}
      />
    </div>
  );
}

const PEOPLE = ["Maya Chen", "Raka Pratama", "Lena Okafor", "Omar Haddad", "Sari Wibowo"];

export function Team() {
  return (
    <OrbitingCircles
      className="max-w-sm"
      designSize={360}
      pathStyle="dashed"
      center={<span className="rounded-full bg-background px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border">5 online</span>}
      rings={[
        {
          radius: 130,
          duration: 60,
          iconSize: 44,
          items: PEOPLE.map((name, i) => ({
            name,
            icon: (
              <span
                className="grid size-full place-items-center rounded-xl text-xs font-semibold text-white"
                style={{ background: `linear-gradient(135deg, hsl(${i * 67} 70% 62%), hsl(${i * 67 + 40} 70% 48%))` }}
              >
                {name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </span>
            ),
          })),
        },
      ]}
    />
  );
}

export function ThreeRings() {
  return (
    <OrbitingCircles
      className="max-w-md"
      showPaths
      center={<span className="size-4 rounded-full bg-primary shadow-[0_0_0_6px_color-mix(in_oklab,var(--primary)_20%,transparent)]" aria-hidden="true" />}
      rings={[
        { radius: 80, duration: 14, iconSize: 32, items: apps(0, 3) },
        { radius: 150, duration: 22, reverse: true, iconSize: 36, items: apps(3, 7) },
        { radius: 220, duration: 34, iconSize: 40, items: apps(7, 12) },
      ]}
    />
  );
}
