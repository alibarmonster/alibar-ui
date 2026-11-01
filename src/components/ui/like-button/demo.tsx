"use client";

import { MessageCircle, Repeat2, Share } from "lucide-react";
import { LikeButton } from "@/components/ui/like-button/like-button";

export function Default() {
  return <LikeButton count={128} />;
}

export function IconOnly() {
  return (
    <div className="flex items-center gap-4">
      <LikeButton variant="ghost" size="lg" />
      <LikeButton size="lg" defaultLiked />
    </div>
  );
}

export function SocialBar() {
  return (
    <div className="flex w-full max-w-sm items-center justify-between rounded-xl border border-border bg-background px-2 py-1.5 shadow-xs">
      <LikeButton variant="ghost" size="sm" count={2399} />
      <button
        type="button"
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        86
      </button>
      <button
        type="button"
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Repeat2 className="size-4" aria-hidden="true" />
        14
      </button>
      <button
        type="button"
        aria-label="Share"
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Share className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
