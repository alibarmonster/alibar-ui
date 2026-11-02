"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { PrintedReceipt, type ReceiptOrder } from "@/components/ui/printed-receipt/printed-receipt";
import { mockMerchant, mockMerchantIdr, mockOrder, mockOrderIdr } from "@/lib/usage/mock";
import { mockTxHash } from "@/lib/web3/mock";

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-surface-2";

type Status = "paid" | "pending" | "refunded";

export function Default() {
  const [status, setStatus] = useState<Status>("paid");
  const [run, setRun] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <DemoStateSwitcher<Status>
          label="Receipt status"
          states={[
            { value: "paid", label: "Paid" },
            { value: "pending", label: "Pending" },
            { value: "refunded", label: "Refunded" },
          ]}
          value={status}
          onChange={(next) => {
            setStatus(next);
            setRun((r) => r + 1);
          }}
        />
        <button type="button" className={control} onClick={() => setRun((r) => r + 1)}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reprint
        </button>
      </div>
      <PrintedReceipt merchant={mockMerchant} order={mockOrder} status={status} printKey={run} timeZone="America/New_York" />
    </div>
  );
}

export function Rupiah() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <button type="button" className={control} onClick={() => setRun((r) => r + 1)}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Cetak ulang
      </button>
      <PrintedReceipt merchant={mockMerchantIdr} order={mockOrderIdr} currency="IDR" locale="id-ID" timeZone="Asia/Jakarta" printKey={run} footer="Terima kasih!" />
    </div>
  );
}

const cryptoOrder: ReceiptOrder = {
  number: "TX-88213",
  date: "2026-11-02T13:05:00Z",
  items: [
    { id: "swap", name: "Swap 0.5 ETH → USDC", qty: 1, price: 170_629, note: "Received 1,700.83 USDC" },
    { id: "fee", name: "Router fee 0.3%", qty: 1, price: 512 },
  ],
  payment: { type: "crypto", network: "Ethereum", token: "ETH", amount: "0.5", txHash: mockTxHash("receipt:swap"), gasFee: 418 },
};

export function Crypto() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <button type="button" className={control} onClick={() => setRun((r) => r + 1)}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reprint
      </button>
      <PrintedReceipt merchant={{ name: "Harbor Wallet", address: ["Transaction receipt", "Simulated · no funds moved"] }} order={cryptoOrder} printKey={run} footer="Keep this for your records" />
    </div>
  );
}
