"use client";

import { PasswordInput } from "@/components/ui/password-input/password-input";

export function Default() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <label htmlFor="new-password" className="text-sm font-medium text-foreground">
        New password
      </label>
      <PasswordInput id="new-password" autoComplete="new-password" placeholder="Choose a password" />
    </div>
  );
}

export function WithRequirements() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
        Password
      </label>
      <PasswordInput id="signup-password" autoComplete="new-password" defaultValue="motion" showRequirements />
    </div>
  );
}

export function ToggleOnly() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <label htmlFor="current-password" className="text-sm font-medium text-foreground">
        Current password
      </label>
      <PasswordInput
        id="current-password"
        autoComplete="current-password"
        defaultValue="correct horse battery staple"
        showStrength={false}
        size="lg"
      />
    </div>
  );
}
