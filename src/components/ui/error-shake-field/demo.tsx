"use client";

import { useState, type FormEvent } from "react";
import { ErrorShakeField } from "@/components/ui/error-shake-field/error-shake-field";

const submit =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md bg-foreground text-sm font-medium text-background transition-colors hover:bg-foreground/90 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function Default() {
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [attempt, setAttempt] = useState(0);
  const [done, setDone] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const next = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : "Enter a valid email address.",
      password: password.length >= 8 ? undefined : "Use at least 8 characters.",
    };
    setErrors(next);
    setAttempt((n) => n + 1);
    setDone(!next.email && !next.password);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="w-full max-w-xs space-y-4">
      <ErrorShakeField name="email" type="email" label="Email" placeholder="you@company.com" error={errors.email} shakeKey={attempt} autoComplete="email" />
      <ErrorShakeField name="password" type="password" label="Password" error={errors.password} shakeKey={attempt} description="At least 8 characters." autoComplete="current-password" />
      <button type="submit" className={submit}>
        {done ? "Signed in ✓" : "Sign in"}
      </button>
    </form>
  );
}

const TAKEN = ["alibar", "admin", "raka", "design"];

export function Username() {
  const [value, setValue] = useState("alibar");
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<string>();

  return (
    <form
      noValidate
      className="w-full max-w-xs space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const name = value.trim().toLowerCase();
        setAttempt((n) => n + 1);
        if (TAKEN.includes(name)) setError(`“${name}” is taken. Try ${name}${Math.floor(10 + Math.random() * 89)}.`);
        else if (!/^[a-z0-9_]{3,}$/.test(name)) setError("Use 3 or more letters, numbers or underscores.");
        else {
          setError(undefined);
          setSaved(name);
        }
      }}
    >
      <ErrorShakeField
        label="Username"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={error}
        shakeKey={attempt}
        description={saved ? `Saved as @${saved}.` : "This is how others mention you."}
        autoComplete="username"
      />
      <button type="submit" className={submit}>
        Save username
      </button>
    </form>
  );
}
