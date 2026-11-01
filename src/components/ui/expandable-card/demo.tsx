"use client";

import { ExpandableCard } from "@/components/ui/expandable-card/expandable-card";

const PROJECTS = [
  {
    id: "aurora",
    title: "Aurora Design System",
    description: "Tokens, components and docs for 40 product teams.",
    tint: "from-sky-300 via-indigo-400 to-fuchsia-400",
    body: "Aurora replaced six drifting UI kits with one source of truth. Tokens ship as CSS variables, components as copy-paste files, and every change lands with a visual diff. Adoption reached 90% of surfaces in two quarters.",
    stats: [["Teams", "40"], ["Components", "112"], ["Build time", "−38%"]],
  },
  {
    id: "atlas",
    title: "Atlas Maps",
    description: "Offline-first maps for field crews.",
    tint: "from-emerald-200 via-teal-400 to-cyan-500",
    body: "Atlas syncs vector tiles in the background and keeps working without signal. Crews mark hazards on site; changes merge the next time any device is online.",
    stats: [["Regions", "18"], ["Offline days", "14"], ["Sync conflicts", "0.2%"]],
  },
  {
    id: "sunset",
    title: "Sunset Radio",
    description: "A calmer way to listen together.",
    tint: "from-amber-200 via-orange-400 to-rose-400",
    body: "Sunset Radio pairs friends' queues into one shared stream. No feeds, no counts; just what's playing and who picked it.",
    stats: [["Listeners", "84K"], ["Avg session", "52m"], ["Rating", "4.8"]],
  },
];

export function Default() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
      {PROJECTS.map((project) => (
        <ExpandableCard
          key={project.id}
          title={project.title}
          description={project.description}
          media={<div className={`size-full bg-gradient-to-br ${project.tint}`} />}
        >
          <p className="text-muted-foreground">{project.body}</p>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {project.stats.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-surface p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </ExpandableCard>
      ))}
    </div>
  );
}
