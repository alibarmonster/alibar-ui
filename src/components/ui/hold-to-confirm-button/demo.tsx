"use client";

import { Archive, Send, Trash2 } from "lucide-react";
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button/hold-to-confirm-button";

export function Default() {
  return (
    <HoldToConfirmButton icon={<Trash2 aria-hidden="true" />} confirmedLabel="Deleted">
      Hold to delete
    </HoldToConfirmButton>
  );
}

export function Primary() {
  return (
    <HoldToConfirmButton variant="primary" duration={1200} icon={<Send aria-hidden="true" />} confirmedLabel="Published">
      Hold to publish
    </HoldToConfirmButton>
  );
}

export function LongHold() {
  return (
    <HoldToConfirmButton
      variant="neutral"
      size="lg"
      duration={2500}
      icon={<Archive aria-hidden="true" />}
      confirmedLabel="Workspace archived"
    >
      Hold to archive workspace
    </HoldToConfirmButton>
  );
}
