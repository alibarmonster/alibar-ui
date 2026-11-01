import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ErrorShakeField } from "@/components/ui/error-shake-field/error-shake-field";

export function EmailField({ error, attempt }: { error?: string; attempt: number }) {
  return <ErrorShakeField label="Email" name="email" type="email" error={error} shakeKey={attempt} />;
}`,
  a11y: [
    "A real <label> names the input; the error or hint is linked with aria-describedby and read politely when it changes.",
    "Errors set aria-invalid and are always shown as text with an icon, never by the red border alone.",
    "The field never shakes on first render, only in response to a new error or a new attempt.",
    "With reduced motion enabled, nothing shakes and the message fades in place; the error state is still fully visible.",
  ],
  notes: [
    "The shake uses keyframes eased with cubic-bezier(0.36, 0.07, 0.19, 0.97): fast at first, then decaying wiggles.",
    "Pass a shakeKey that changes on every failed submit (for example an attempt counter) so repeated mistakes shake again.",
    "The message area opens with a 0fr → 1fr grid-rows transition, so nothing below jumps.",
  ],
};
