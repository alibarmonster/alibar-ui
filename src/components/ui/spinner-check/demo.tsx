"use client";

import { useEffect, useState } from "react";
import { SpinnerCheck, type SpinnerStatus } from "@/components/ui/spinner-check/spinner-check";

export function Default() {
  const [status, setStatus] = useState<SpinnerStatus>("idle");
  const [fail, setFail] = useState(false);
  useEffect(() => {
    if (status === "loading") {
      const t = window.setTimeout(() => setStatus(fail ? "error" : "success"), 1400);
      return () => window.clearTimeout(t);
    }
    if (status === "success" || status === "error") {
      const t = window.setTimeout(() => setStatus("idle"), 1800);
      return () => window.clearTimeout(t);
    }
  }, [status, fail]);
  const label = { idle: "Save changes", loading: "Saving…", success: "Saved", error: "Couldn’t save" }[status];
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        disabled={status !== "idle"}
        onClick={() => setStatus("loading")}
        className="inline-flex h-10 min-w-40 cursor-pointer items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default"
      >
        {status !== "idle" ? <SpinnerCheck status={status} size={18} /> : null}
        {label}
      </button>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
        <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} className="size-3.5 accent-[var(--primary)]" />
        Make the next save fail
      </label>
    </div>
  );
}

const STATUSES: SpinnerStatus[] = ["idle", "loading", "success", "error"];

export function AllStates() {
  return (
    <div className="grid grid-cols-4 gap-x-8 gap-y-4 text-center">
      {STATUSES.map((status) => (
        <div key={status} className="flex flex-col items-center gap-3 text-muted-foreground">
          {[16, 20, 28].map((size) => (
            <SpinnerCheck key={size} status={status} size={size} />
          ))}
          <span className="text-xs">{status}</span>
        </div>
      ))}
    </div>
  );
}
