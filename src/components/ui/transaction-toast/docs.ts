import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TransactionToastStack } from "@/components/ui/transaction-toast/transaction-toast";

<TransactionToastStack
  className="fixed right-4 bottom-4 z-50"
  toasts={[{ id: hash, title: "Swapping 0.5 ETH for USDC", status: "pending", hash }]}
  explorerUrl="https://etherscan.io"
  dismissAfter={6000}
  onDismiss={(id) => remove(id)}
/>`,
  a11y: [
    "The stack is a labelled region. Each toast has a status message for screen readers, and failures use role=\"alert\".",
    "Hovering or focusing the stack fans it open, so every toast and its links are reachable by keyboard; toasts hidden behind the stack are inert.",
    "Dismiss buttons are labelled and keep a 40px hit area, and hash links read \"view transaction\".",
    "Reduced motion fades toasts instead of springing them, draws the check instantly and skips the failure shake.",
  ],
  notes: [
    "The component holds no queue of its own: add, update and remove toasts in your state, keyed by transaction hash.",
    "Pass progress (0–1) for a determinate ring, for example confirmations received out of those required.",
  ],
};
