"use client";

import { Phone } from "lucide-react";
import { RippleRings } from "@/components/ui/ripple-rings/ripple-rings";

export function Default() {
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <RippleRings>
        <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <Phone className="size-6" aria-hidden="true" />
        </span>
      </RippleRings>
      <p className="text-sm font-medium text-foreground" role="status">
        Calling Maya…
      </p>
    </div>
  );
}

export function Avatar() {
  return (
    <div className="py-10">
      <RippleRings variant="filled" color="#16A34A" count={2} duration={3} scale={2.2}>
        <span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-600 text-sm font-semibold text-white shadow-md ring-4 ring-background">
          LO
        </span>
      </RippleRings>
    </div>
  );
}
