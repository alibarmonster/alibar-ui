"use client";

import { useState } from "react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input/floating-label-input";

export function Default() {
  return (
    <div className="w-full max-w-sm">
      <FloatingLabelInput label="Email address" type="email" autoComplete="email" />
    </div>
  );
}

export function Validation() {
  const [email, setEmail] = useState("hello@");
  const [touched, setTouched] = useState(true);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="w-full max-w-sm">
      <FloatingLabelInput
        label="Work email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        onBlur={() => setTouched(true)}
        description="We'll send the invite here."
        error={touched && !valid ? "Enter a valid email, like name@company.com." : undefined}
      />
    </div>
  );
}

export function Form() {
  return (
    <form className="w-full max-w-sm space-y-4" onSubmit={(event) => event.preventDefault()}>
      <FloatingLabelInput label="Full name" autoComplete="name" defaultValue="Alibar" />
      <FloatingLabelInput label="Company" autoComplete="organization" placeholder="Optional" />
      <FloatingLabelInput label="Team size" size="sm" inputMode="numeric" />
    </form>
  );
}
