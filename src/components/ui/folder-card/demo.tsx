"use client";

import { useState } from "react";
import { FolderCard } from "@/components/ui/folder-card/folder-card";

const Photo = ({ tint }: { tint: string }) => <div className={`size-full bg-gradient-to-br ${tint}`} />;

export function Default() {
  return (
    <div className="grid w-full max-w-xl grid-cols-2 gap-4 sm:grid-cols-3">
      <FolderCard title="Design reviews" meta="24 files" onClick={(event) => event.preventDefault()} />
      <FolderCard
        title="Trip photos"
        meta="312 photos"
        color="var(--chart-2)"
        items={[
          <Photo key="1" tint="from-rose-300 to-orange-300" />,
          <Photo key="2" tint="from-sky-300 to-indigo-400" />,
          <Photo key="3" tint="from-amber-200 to-emerald-300" />,
        ]}
      />
      <FolderCard title="Invoices 2026" meta="9 files" color="#52525b" />
    </div>
  );
}

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

export function Controlled() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex w-48 flex-col items-center gap-4">
      <FolderCard title="Shared with me" meta="7 items" color="var(--chart-3)" open={open} />
      <button type="button" className={control} aria-pressed={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Close folder" : "Open folder"}
      </button>
    </div>
  );
}
