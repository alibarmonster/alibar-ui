import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DynamicIsland } from "@/components/ui/dynamic-island/dynamic-island";

export function LiveActivity({ upload }: { upload?: number }) {
  return (
    <DynamicIsland view={upload === undefined ? "idle" : "upload"}>
      {upload === undefined ? undefined : <UploadProgress value={upload} />}
    </DynamicIsland>
  );
}`,
  a11y: [
    "The island is a plain container; give it role=\"status\" and a label when its content is a live update, as in the example.",
    "Controls inside expanded activities are ordinary buttons, reachable by keyboard.",
    "With reduced motion enabled, the island resizes instantly and its content cross-fades without blur or scale.",
  ],
  notes: [
    "Change view to move between activities. The island's size follows its content through a Motion layout animation, and the radius is corrected mid-morph.",
    "Pass a larger radius for tall, expanded activities; short ones stay pill-shaped.",
  ],
};
