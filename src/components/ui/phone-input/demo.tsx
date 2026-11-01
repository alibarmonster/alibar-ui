"use client";

import { useState } from "react";
import { PhoneInput, type PhoneDetails } from "@/components/ui/phone-input/phone-input";

export function Default() {
  const [value, setValue] = useState("");
  const [details, setDetails] = useState<PhoneDetails | null>(null);
  return (
    <div className="w-full max-w-sm space-y-2">
      <label htmlFor="phone-us" className="text-sm font-medium text-foreground">
        Phone number
      </label>
      <PhoneInput
        id="phone-us"
        value={value}
        onValueChange={(next, info) => {
          setValue(next);
          setDetails(info);
        }}
      />
      <p className="font-mono text-xs text-muted-foreground tabular-nums">
        {value || "E.164 appears here"}
        {details?.complete ? " · complete" : ""}
      </p>
    </div>
  );
}

export function Indonesia() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <label htmlFor="phone-id" className="text-sm font-medium text-foreground">
        Nomor WhatsApp
      </label>
      <PhoneInput id="phone-id" defaultCountry="ID" defaultValue="+6281234567890" />
      <p className="text-[13px] text-muted-foreground">Typing a leading 0 (0812…) is handled for you.</p>
    </div>
  );
}

export function SoutheastAsia() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <label htmlFor="phone-sea" className="text-sm font-medium text-foreground">
        Mobile
      </label>
      <PhoneInput id="phone-sea" defaultCountry="SG" countries={["SG", "ID", "MY", "TH", "PH", "VN"]} />
      <p className="text-[13px] text-muted-foreground">A limited country list. Paste a +62… number to switch automatically.</p>
    </div>
  );
}
