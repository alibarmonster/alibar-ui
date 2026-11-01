"use client";

import { useRef, useState } from "react";
import { OtpInput } from "@/components/ui/otp-input/otp-input";

type Status = "idle" | "error" | "success";

export function Default() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<number | undefined>(undefined);

  return (
    <div className="flex flex-col items-center gap-4">
      <OtpInput
        groupSize={3}
        value={code}
        status={status}
        aria-label="Verification code"
        onValueChange={(next) => {
          setCode(next);
          if (status !== "idle") setStatus("idle");
        }}
        onComplete={(next) => {
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            if (next === "123456") setStatus("success");
            else {
              setStatus("error");
              setCode("");
            }
          }, 450);
        }}
      />
      <p className="text-[13px] text-muted-foreground">
        {status === "error" ? (
          <span className="text-destructive">That code didn&apos;t match. Try again.</span>
        ) : status === "success" ? (
          "Verified."
        ) : (
          <>
            Try <span className="font-mono text-foreground">123456</span>, or any other code to see an error.
          </>
        )}
      </p>
    </div>
  );
}

export function Pin() {
  return (
    <div className="flex flex-col items-center gap-3">
      <OtpInput length={4} mask aria-label="4-digit PIN" />
      <p className="text-[13px] text-muted-foreground">Masked, for PINs.</p>
    </div>
  );
}

export function Alphanumeric() {
  return (
    <div className="flex flex-col items-center gap-3">
      <OtpInput length={6} groupSize={3} alphanumeric aria-label="Invite code" defaultValue="K7Q" />
      <p className="text-[13px] text-muted-foreground">Letters and digits; paste works too.</p>
    </div>
  );
}
