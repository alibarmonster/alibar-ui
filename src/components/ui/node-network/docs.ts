import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { NodeNetwork } from "@/components/ui/node-network/node-network";

<NodeNetwork
  nodes={[{ id: "api", label: "API", x: 0.5, y: 0.45 }, { id: "db", label: "Database", x: 0.8, y: 0.2 }]}
  edges={[["api", "db"]]}
/>`,
  a11y: [
    "Each node is focusable and announces its connections (\"API, connected to Auth, Database…\"); focus highlights the same links as hover.",
    "Highlighted links change width as well as color, and unrelated links dim.",
    "With reduced motion the nodes stay put.",
  ],
  notes: [
    "Positions are relative (0–1), so the graph scales with its container. Floating writes straight to the SVG each frame (no React renders), and lines follow their nodes. It pauses offscreen.",
  ],
};
