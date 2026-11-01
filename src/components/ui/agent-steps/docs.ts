import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AgentSteps } from "@/components/ui/agent-steps/agent-steps";

<AgentSteps
  steps={[
    { id: "read", title: "Reading the issue", status: "done" },
    { id: "fix", title: "Writing a fix", status: "running", description: "pricing/total.ts" },
    { id: "test", title: "Running the tests", status: "pending" },
  ]}
/>`,
  a11y: [
    "An ordered list; the running step has aria-current=\"step\" and every step's status is spelled out for screen readers (completed, in progress, pending, failed).",
    "With reduced motion enabled, connectors fill instantly and checks appear without drawing.",
  ],
  notes: [
    "Each step's icon moves from a hollow ring to a spinner to a drawn check (or a cross), and the connector to the next step fills once it's done.",
    "The running step's title shimmers. Built from Spinner to Check and Shimmer Text, installed along with it.",
  ],
};
