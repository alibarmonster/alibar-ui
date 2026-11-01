import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ThinkingStates } from "@/components/ui/thinking-states/thinking-states";

export function Status({ done }: { done: boolean }) {
  return <ThinkingStates stages={["Reading your question", "Searching the docs", "Writing the answer"]} done={done} />;
}`,
  a11y: [
    "A polite status region: each new stage and the final message are announced once.",
    "The shimmer and spinner are decorative; with reduced motion enabled, stages crossfade and the shimmer becomes a gentle fade.",
  ],
  notes: [
    "Without `index`, stages advance every `interval` ms and wait on the last one until `done`. Pass `index` to drive it from real progress.",
    "Built from Shimmer Text and Spinner to Check, which are installed along with it.",
  ],
};
