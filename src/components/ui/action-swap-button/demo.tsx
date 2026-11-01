"use client";

import { Bell, BellRing, Pause, Play, UserCheck, UserPlus, Volume2, VolumeX } from "lucide-react";
import { ActionSwapButton } from "@/components/ui/action-swap-button/action-swap-button";

export function Default() {
  return (
    <ActionSwapButton
      label="Follow"
      pressedLabel="Following"
      icon={<UserPlus aria-hidden="true" />}
      pressedIcon={<UserCheck aria-hidden="true" />}
    />
  );
}

export function IconOnly() {
  return (
    <div className="flex items-center gap-3">
      <ActionSwapButton
        iconOnly
        size="lg"
        variant="primary"
        pressedVariant="primary"
        label="Play"
        pressedLabel="Pause"
        icon={<Play aria-hidden="true" />}
        pressedIcon={<Pause aria-hidden="true" />}
      />
      <ActionSwapButton
        iconOnly
        size="lg"
        variant="outline"
        pressedVariant="outline"
        label="Mute"
        pressedLabel="Unmute"
        icon={<Volume2 aria-hidden="true" />}
        pressedIcon={<VolumeX aria-hidden="true" />}
      />
    </div>
  );
}

export function Subscribe() {
  return (
    <ActionSwapButton
      size="lg"
      variant="primary"
      pressedVariant="outline"
      label="Notify me"
      pressedLabel="You're on the list"
      icon={<Bell aria-hidden="true" />}
      pressedIcon={<BellRing aria-hidden="true" />}
    />
  );
}
