"use client";

import { Lock, Trash2 } from "lucide-react";
import { SlideToConfirm } from "@/components/ui/slide-to-confirm/slide-to-confirm";

export function Default() {
  return <SlideToConfirm label="Slide to pay $49" confirmedLabel="Payment sent" resetAfter={2500} />;
}

export function Destructive() {
  return (
    <SlideToConfirm
      tone="destructive"
      icon={<Trash2 aria-hidden="true" />}
      label="Slide to delete account"
      confirmedLabel="Account deleted"
      resetAfter={2500}
    />
  );
}

export function Unlock() {
  return (
    <SlideToConfirm
      tone="primary"
      icon={<Lock aria-hidden="true" />}
      label="Slide to unlock"
      confirmedLabel="Unlocked"
      threshold={0.95}
      resetAfter={2500}
      className="max-w-[16rem]"
    />
  );
}
