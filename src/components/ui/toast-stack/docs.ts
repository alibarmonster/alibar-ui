import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ToastProvider, useToast } from "@/components/ui/toast-stack/toast-stack";

// app/layout.tsx
// <ToastProvider>{children}</ToastProvider>

export function SaveButton() {
  const { toast, promise } = useToast();
  return (
    <button onClick={() => promise(save(), { loading: "Saving…", success: "Saved", error: "Couldn't save" })}>
      Save
    </button>
  );
}`,
  a11y: [
    "Toasts live in a labelled \"Notifications\" region. Each one is a polite status, and errors are assertive alerts, so screen readers announce them without moving focus.",
    "Hovering or focusing the stack fans it out and pauses every timer, so nothing disappears while it's being read or reached by keyboard.",
    "Each toast has a labelled dismiss button; actions are real buttons.",
    "Collapsed toasts beyond the visible count are aria-hidden until the stack shrinks.",
    "With reduced motion enabled, toasts fade in place: no sliding, scaling or swinging out.",
  ],
  notes: [
    "update(id, …) and promise() morph an existing toast (icon, text and status) instead of stacking a new one.",
    "Loading toasts never auto-dismiss; they wait for an update.",
    "Swipe a toast sideways past 80px, or flick it, to dismiss it.",
    "State lives in ToastProvider (React context), with no module-level store, so multiple providers stay independent.",
  ],
};
