"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import * as m from "motion/react-m";

// Each live demo loads only when its tile nears the viewport, so the landing page ships no demo code up front.
const load = (name: keyof typeof import("./featured-tiles")) =>
  dynamic(() => import("./featured-tiles").then((mod) => mod[name] as ComponentType), { ssr: false });

const TILES = {
  dock: load("DockTile"),
  rotator: load("RotatorTile"),
  chart: load("ChartTile"),
  tilt: load("TiltTile"),
  switch: load("SwitchTile"),
  hold: load("HoldTile"),
  thinking: load("ThinkingTile"),
  otp: load("OtpTile"),
  island: load("IslandTile"),
  dots: load("DotGridTile"),
  chat: load("ChatTile"),
};

export type TileName = keyof typeof TILES;

export function LiveTile({ name }: { name: TileName }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tile = TILES[name];
  return (
    <div ref={ref} className="flex size-full items-center justify-center">
      {shown ? (
        <m.div className="flex size-full items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <Tile />
        </m.div>
      ) : null}
    </div>
  );
}
