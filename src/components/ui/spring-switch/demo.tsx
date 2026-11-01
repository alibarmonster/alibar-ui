"use client";

import { Bluetooth, Plane, Wifi } from "lucide-react";
import { SpringSwitch } from "@/components/ui/spring-switch/spring-switch";

const SETTINGS = [
  { id: "wifi", label: "Wi-Fi", hint: "Studio 5G", icon: Wifi, on: true },
  { id: "bluetooth", label: "Bluetooth", hint: "2 devices", icon: Bluetooth, on: false },
  { id: "airplane", label: "Airplane mode", hint: "Turns off radios", icon: Plane, on: false },
];

export function Default() {
  return (
    <ul className="w-full max-w-sm divide-y divide-border rounded-xl border border-border bg-background shadow-sm">
      {SETTINGS.map(({ id, label, hint, icon: Icon, on }) => (
        <li key={id} className="flex items-center gap-3 px-4 py-3">
          <span className="flex size-8 items-center justify-center rounded-md bg-muted text-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <label htmlFor={`switch-${id}`} className="flex-1 cursor-pointer">
            <span className="block text-sm font-medium text-foreground">{label}</span>
            <span className="block text-[13px] text-muted-foreground">{hint}</span>
          </label>
          <SpringSwitch id={`switch-${id}`} defaultChecked={on} />
        </li>
      ))}
    </ul>
  );
}

export function Sizes() {
  return (
    <div className="flex items-center gap-6">
      <SpringSwitch size="sm" aria-label="Small switch" defaultChecked />
      <SpringSwitch size="md" aria-label="Medium switch" defaultChecked />
      <SpringSwitch size="lg" aria-label="Large switch" defaultChecked />
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex items-center gap-6">
      <SpringSwitch aria-label="Disabled, off" disabled />
      <SpringSwitch aria-label="Disabled, on" disabled defaultChecked />
    </div>
  );
}
