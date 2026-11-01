"use client";

import { Copy, FilePlus2, FolderPlus, Link2, PenLine, Plus, Share2, Trash2, Upload, UserPlus } from "lucide-react";
import { MorphMenu } from "@/components/ui/morph-menu/morph-menu";

export function Default() {
  return (
    <div className="flex h-56 items-start pt-6">
      <MorphMenu
        label="Actions"
        items={[
          { label: "New file", icon: <FilePlus2 />, shortcut: "⌘N" },
          { label: "Upload", icon: <Upload />, shortcut: "⌘U" },
          { label: "Share", icon: <Share2 /> },
          { label: "Rename", icon: <PenLine />, disabled: true },
          { label: "Delete", icon: <Trash2 />, destructive: true },
        ]}
      />
    </div>
  );
}

export function IconTrigger() {
  return (
    <div className="flex h-52 items-start pt-6">
      <MorphMenu
        tone="dark"
        aria-label="Create"
        label={<Plus className="size-4" aria-hidden="true" />}
        items={[
          { label: "New document", icon: <FilePlus2 /> },
          { label: "New folder", icon: <FolderPlus /> },
          { label: "Invite people", icon: <UserPlus /> },
        ]}
      />
    </div>
  );
}

export function AlignEnd() {
  return (
    <div className="flex h-48 w-full max-w-sm items-start justify-end pt-6">
      <MorphMenu
        align="end"
        label="Share"
        icon={<Share2 />}
        items={[
          { label: "Copy link", icon: <Link2 />, shortcut: "⌘L" },
          { label: "Duplicate", icon: <Copy /> },
          { label: "Invite", icon: <UserPlus /> },
        ]}
      />
    </div>
  );
}
