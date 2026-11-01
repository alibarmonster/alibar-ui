import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LogoCloudCycle } from "@/components/ui/logo-cloud-cycle/logo-cloud-cycle";

<LogoCloudCycle eyebrow="Loved by teams at" items={logos} slots={6} interval={2000} />`,
  a11y: [
    "Each visible logo is an image named after the company. Swaps aren't announced, since the change is decorative.",
    "Hovering or focusing the cloud pauses swapping, so nothing changes while someone is reading.",
    "With reduced motion logos cross-fade in place instead of sliding through a blur.",
  ],
  notes: [
    "One slot changes per interval, in a scattered order, and the next logo is always one that isn't already showing. Keep the pool bigger than the number of slots.",
  ],
};
