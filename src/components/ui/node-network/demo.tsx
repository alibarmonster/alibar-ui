"use client";

import { NodeNetwork, type NetworkNode } from "@/components/ui/node-network/node-network";

const NODES: NetworkNode[] = [
  { id: "api", label: "API", x: 0.5, y: 0.45 },
  { id: "auth", label: "Auth", x: 0.22, y: 0.22 },
  { id: "db", label: "Database", x: 0.78, y: 0.2 },
  { id: "queue", label: "Queue", x: 0.82, y: 0.68 },
  { id: "web", label: "Web app", x: 0.18, y: 0.7 },
  { id: "cache", label: "Cache", x: 0.5, y: 0.88 },
  { id: "search", label: "Search", x: 0.62, y: 0.16 },
];

export function Default() {
  return (
    <NodeNetwork
      label="Service map"
      nodes={NODES}
      edges={[
        ["api", "auth"],
        ["api", "db"],
        ["api", "queue"],
        ["api", "web"],
        ["api", "cache"],
        ["api", "search"],
        ["web", "auth"],
        ["queue", "db"],
        ["search", "db"],
      ]}
    />
  );
}

export function Calm() {
  return (
    <NodeNetwork
      className="max-w-md"
      color="#16A34A"
      float={3}
      nodes={NODES.slice(0, 4)}
      edges={[
        ["api", "auth"],
        ["api", "db"],
        ["api", "queue"],
        ["auth", "db"],
      ]}
    />
  );
}
