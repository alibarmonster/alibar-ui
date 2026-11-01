"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { TransactionToastStack, type TransactionToastItem } from "@/components/ui/transaction-toast/transaction-toast";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { getMockChain, mockTxHash } from "@/lib/web3/mock";

type Preview = "stack" | "pending" | "confirmed" | "failed" | "empty";

const PRESETS: Record<Preview, TransactionToastItem[]> = {
  stack: [
    { id: "a", title: "Approved USDC", status: "confirmed", hash: mockTxHash("toast:a"), description: "Confirmed in 9s" },
    { id: "b", title: "Bridging 0.8 ETH to Base", status: "failed", hash: mockTxHash("toast:b"), description: "Out of gas" },
    { id: "c", title: "Swapping 0.5 ETH for USDC", status: "pending", hash: mockTxHash("toast:c"), progress: 0.6 },
  ],
  pending: [{ id: "p", title: "Swapping 0.5 ETH for USDC", status: "pending", hash: mockTxHash("toast:p") }],
  confirmed: [{ id: "k", title: "Swapped 0.5 ETH for 1,701 USDC", status: "confirmed", hash: mockTxHash("toast:k"), description: "Confirmed in 12s" }],
  failed: [{ id: "f", title: "Send 120 ARB", status: "failed", hash: mockTxHash("toast:f"), description: "Rejected: insufficient gas" }],
  empty: [],
};

export function Default() {
  const [preview, setPreview] = useState<Preview>("stack");
  const [toasts, setToasts] = useState<TransactionToastItem[]>(PRESETS.stack);
  const sent = useRef(0);

  // Live toasts: progress climbs for ~3s, then confirms (every third one fails).
  const live = toasts.filter((t) => t.id.startsWith("live") && t.status === "pending");
  useEffect(() => {
    if (live.length === 0) return;
    const timer = window.setInterval(() => {
      setToasts((list) =>
        list.map((t) => {
          if (!t.id.startsWith("live") || t.status !== "pending") return t;
          const progress = (t.progress ?? 0) + 0.2;
          if (progress < 1) return { ...t, progress };
          const fails = Number(t.id.split("-")[1]) % 3 === 0;
          return fails
            ? { ...t, status: "failed", description: "Reverted by the contract", progress: undefined }
            : { ...t, status: "confirmed", description: "Confirmed in 3s", progress: undefined };
        }),
      );
    }, 600);
    return () => window.clearInterval(timer);
  }, [live.length]);

  function send() {
    sent.current += 1;
    const n = sent.current;
    setToasts((list) => [...list, { id: `live-${n}`, title: `Sending ${n * 25} USDC`, status: "pending", hash: mockTxHash(`toast:live:${n}`), progress: 0 }]);
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex h-80 w-full max-w-sm items-end">
        <TransactionToastStack
          toasts={toasts}
          explorerUrl={getMockChain(1).explorerUrl}
          onDismiss={(id) => setToasts((list) => list.filter((t) => t.id !== id))}
        />
      </div>
      <button
        type="button"
        onClick={send}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Send className="size-4" aria-hidden="true" />
        Send transaction
      </button>
      <DemoStateSwitcher<Preview>
        states={["stack", "pending", "confirmed", "failed", "empty"]}
        value={preview}
        onChange={(next) => {
          setPreview(next);
          setToasts(PRESETS[next]);
        }}
      />
    </div>
  );
}
