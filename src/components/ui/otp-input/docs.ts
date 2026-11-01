import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { OtpInput } from "@/components/ui/otp-input/otp-input";

export function VerifyEmail() {
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  return (
    <OtpInput
      groupSize={3}
      status={status}
      onComplete={async (code) => setStatus((await verify(code)) ? "success" : "error")}
    />
  );
}`,
  a11y: [
    "A single native input sits under the slots, so screen readers announce one field (\"6-digit code\" unless you pass aria-label).",
    "autocomplete=\"one-time-code\" lets iOS and Android offer codes from SMS, and paste drops a whole code in at once.",
    "Non-matching characters are filtered, so pasting \"123-456\" yields 123456.",
    "status=\"error\" sets aria-invalid and a polite status region announces \"Incorrect code\" or \"Code verified\".",
    "With reduced motion enabled, characters fade in, the focus ring jumps, the caret stops blinking and there is no shake.",
  ],
  notes: [
    "The caret is pinned to the end so every keystroke fills the next slot; Backspace removes from the end.",
    "The success check sits just outside the right edge; leave about 40px of room for it.",
  ],
};
