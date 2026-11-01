"use client";

import { useState } from "react";
import { Archive, Copy, Download, Pencil, Share2, Star, Trash2 } from "lucide-react";
import { ActionBar } from "@/components/ui/action-bar/action-bar";

export function Default() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <ActionBar
        aria-label="File actions"
        items={[
          { id: "edit", label: "Edit", icon: <Pencil />, onClick: () => setLast("Edit") },
          { id: "copy", label: "Duplicate", icon: <Copy />, onClick: () => setLast("Duplicate") },
          { id: "share", label: "Share", icon: <Share2 />, onClick: () => setLast("Share") },
          { id: "download", label: "Download", icon: <Download />, onClick: () => setLast("Download") },
          { id: "delete", label: "Delete", icon: <Trash2 />, destructive: true, onClick: () => setLast("Delete") },
        ]}
      />
      <p className="h-5 text-[13px] text-muted-foreground">{last ? `Chose “${last}”` : "Hover or Tab into the bar."}</p>
    </div>
  );
}

export function SelectionBar() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="w-full space-y-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex h-10 items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.04] px-3">
            <span className="size-4 rounded-[4px] bg-primary" />
            <span className="h-2 w-40 rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <ActionBar
        tone="dark"
        aria-label="3 selected"
        items={[
          { id: "star", label: "Star", icon: <Star /> },
          { id: "archive", label: "Archive", icon: <Archive /> },
          { id: "download", label: "Download", icon: <Download />, disabled: true },
          { id: "delete", label: "Delete", icon: <Trash2 />, destructive: true },
        ]}
      />
    </div>
  );
}
