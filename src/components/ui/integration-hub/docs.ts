import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { IntegrationHub } from "@/components/ui/integration-hub/integration-hub";

<IntegrationHub
  center={<YourLogo />}
  items={[{ name: "Slack", icon: <SlackIcon /> }, { name: "GitHub", icon: <GitHubIcon /> }]}
/>`,
  a11y: [
    "Tools are labelled lists, with names visible under each icon (or visually hidden with showLabels={false}).",
    "The beams are decorative; reduced motion stops the pulses and leaves still gradient lines.",
  ],
  notes: [
    "Reuses Animated Beam for each connection, so it installs with it. Pulses are staggered so they arrive one after another.",
    "Up to eight tools are split between two columns, and beams curve away from the middle row so they fan out cleanly.",
  ],
};
