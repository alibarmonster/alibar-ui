"use client";

import { studioProjects } from "@/components/site/studio-images";
import { PaneStackPortfolio, type PaneProject } from "@/components/ui/pane-stack-portfolio/pane-stack-portfolio";

// Motion pieces have no video file in the demo, so they play a simulated progress over their still.
const projects: PaneProject[] = studioProjects.map((p) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  client: p.client,
  year: p.year,
  tools: p.tools,
  description: p.description,
  media: p.category === "Motion" ? { type: "video", src: "", poster: p.src, duration: p.duration } : { type: "image", src: p.src },
}));

export function Studio() {
  return <PaneStackPortfolio projects={projects} owner={{ name: "Alibar", role: "Motion & 3D designer", timeZone: "Asia/Jakarta", status: "Booking from June" }} />;
}

export function CustomHeader() {
  return (
    <PaneStackPortfolio
      projects={projects.filter((p) => p.category !== "Stills")}
      header={
        <div className="flex w-full items-center justify-between text-[13px]">
          <span className="font-semibold tracking-tight">North Room Studio</span>
          <span className="font-mono text-[12px] opacity-70">3D & motion, 2024–2026</span>
        </div>
      }
    />
  );
}

export function Default() {
  return <PaneStackPortfolio />;
}
