import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SpinnerCheck } from "@/components/ui/spinner-check/spinner-check";

export function SaveButton({ status }: { status: "idle" | "loading" | "success" | "error" }) {
  return (
    <button>
      {status !== "idle" && <SpinnerCheck status={status} size={18} />}
      Save
    </button>
  );
}`,
  a11y: [
    "A status region: each change is announced (“Loading”, “Done”, “Failed”); override the words with `labels`.",
    "Success and failure pair color with a drawn check or cross, never color alone.",
    "With reduced motion enabled, the spinner pulses in place instead of spinning, and the check appears without drawing.",
  ],
  notes: [
    "The spinner inherits currentColor, so it matches the text around it. Success uses --success and failure --destructive.",
    "The badge pops in on a bouncy spring and the check draws on; a failure shakes once.",
    "Also used by Thinking States and Agent Progress Steps.",
  ],
};
