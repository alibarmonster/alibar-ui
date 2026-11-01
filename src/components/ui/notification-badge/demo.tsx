"use client";

import { useState } from "react";
import { Bell, Inbox, Minus, Plus } from "lucide-react";
import { NotificationBadge } from "@/components/ui/notification-badge/notification-badge";

const iconButton =
  "inline-flex size-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-xs transition-colors hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring";
const small =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-accent";

export function Default() {
  const [count, setCount] = useState(3);
  return (
    <div className="flex flex-col items-center gap-5">
      <NotificationBadge count={count}>
        <button type="button" aria-label={`Notifications, ${count} unread`} className={iconButton}>
          <Bell className="size-5" aria-hidden="true" />
        </button>
      </NotificationBadge>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Fewer" className={small} onClick={() => setCount((c) => Math.max(0, c - 1))}>
          <Minus className="size-3.5" aria-hidden="true" />
        </button>
        <span className="w-8 text-center font-mono text-sm tabular-nums text-muted-foreground">{count}</span>
        <button type="button" aria-label="More" className={small} onClick={() => setCount((c) => c + 1)}>
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function Dot() {
  return (
    <div className="flex items-center gap-6">
      <NotificationBadge dot pulse tone="success">
        <span className="block size-11 rounded-full bg-gradient-to-br from-sky-300 to-blue-600" role="img" aria-label="Alibar, online" />
      </NotificationBadge>
      <NotificationBadge dot tone="primary">
        <button type="button" aria-label="Inbox, new messages" className={iconButton}>
          <Inbox className="size-5" aria-hidden="true" />
        </button>
      </NotificationBadge>
    </div>
  );
}

export function Overflow() {
  const [count, setCount] = useState(97);
  return (
    <div className="flex flex-col items-center gap-5">
      <NotificationBadge count={count} max={99} pulse>
        <button type="button" aria-label={`Inbox, ${count} unread`} className={iconButton}>
          <Inbox className="size-5" aria-hidden="true" />
        </button>
      </NotificationBadge>
      <button type="button" className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => setCount((c) => (c >= 104 ? 97 : c + 1))}>
        Add one (now {count})
      </button>
    </div>
  );
}
