"use client";

import { AtSign, Copy, Link2, Mail, MessageCircle, QrCode, Send, Share2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet/bottom-sheet";

const trigger =
  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TARGETS = [
  { label: "Messages", icon: MessageCircle },
  { label: "Mail", icon: Mail },
  { label: "Telegram", icon: Send },
  { label: "Post", icon: AtSign },
];

export function Default() {
  return (
    <BottomSheet
      title="Share “Launch plan”"
      description="Anyone with the link can view."
      snapPoints={[0.42, 0.9]}
      trigger={
        <button type="button" className={trigger}>
          <Share2 className="size-4" aria-hidden="true" />
          Share
        </button>
      }
    >
      <div className="grid grid-cols-4 gap-3 py-2">
        {TARGETS.map(({ label, icon: Icon }) => (
          <button key={label} type="button" className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg p-2 text-[12px] text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2 divide-y divide-border rounded-xl border border-border">
        {[
          { label: "Copy link", icon: Copy },
          { label: "Show QR code", icon: QrCode },
          { label: "Link settings", icon: Link2 },
        ].map(({ label, icon: Icon }) => (
          <button key={label} type="button" className="flex h-12 w-full cursor-pointer items-center gap-3 px-4 text-sm text-foreground outline-none first:rounded-t-xl last:rounded-b-xl hover:bg-accent focus-visible:bg-accent">
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

const COMMENTS = Array.from({ length: 14 }, (_, i) => ({
  name: ["Alibar", "Raka", "Dimas", "Sari", "Bima", "Laras", "Nadia"][i % 7],
  text: [
    "Love the new spring on the switch.",
    "Can the sheet snap halfway on tablets too?",
    "The drag feels great with a trackpad.",
    "Shipping this to the mobile app next week.",
    "Reduced motion fallback works nicely.",
    "Can we get a dark variant?",
    "Snap points make the comments readable.",
  ][i % 7],
}));

export function SnapPoints() {
  return (
    <BottomSheet
      title="Comments"
      description="Drag the handle between three heights, or press it to step through them."
      snapPoints={[0.35, 0.62, 0.92]}
      trigger={
        <button type="button" className={trigger}>
          <MessageCircle className="size-4" aria-hidden="true" />
          {COMMENTS.length} comments
        </button>
      }
    >
      <ul className="space-y-4 py-2">
        {COMMENTS.map((comment, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground" aria-hidden="true">
              {comment.name[0]}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{comment.name}</p>
              <p className="text-sm text-muted-foreground">{comment.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
