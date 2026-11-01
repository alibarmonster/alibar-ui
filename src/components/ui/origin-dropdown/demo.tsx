"use client";

import { ChevronDown, Clipboard, Copy, CreditCard, LogOut, Redo2, Scissors, Settings, Undo2, User } from "lucide-react";
import {
  OriginDropdown,
  OriginDropdownContent,
  OriginDropdownItem,
  OriginDropdownLabel,
  OriginDropdownSeparator,
  OriginDropdownTrigger,
} from "@/components/ui/origin-dropdown/origin-dropdown";

const trigger =
  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3.5 text-sm font-medium text-foreground shadow-xs transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent";

export function Default() {
  return (
    <OriginDropdown>
      <OriginDropdownTrigger asChild>
        <button type="button" className={`${trigger} pl-1.5`}>
          <span className="size-7 rounded-full bg-gradient-to-br from-sky-300 to-blue-600" aria-hidden="true" />
          Alibar
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </OriginDropdownTrigger>
      <OriginDropdownContent>
        <OriginDropdownLabel>alibar@example.com</OriginDropdownLabel>
        <OriginDropdownItem icon={<User />}>Profile</OriginDropdownItem>
        <OriginDropdownItem icon={<CreditCard />}>Billing</OriginDropdownItem>
        <OriginDropdownItem icon={<Settings />} shortcut="⌘,">
          Settings
        </OriginDropdownItem>
        <OriginDropdownSeparator />
        <OriginDropdownItem icon={<LogOut />} destructive>
          Log out
        </OriginDropdownItem>
      </OriginDropdownContent>
    </OriginDropdown>
  );
}

function Menu({ align, label }: { align: "start" | "center" | "end"; label: string }) {
  return (
    <OriginDropdown>
      <OriginDropdownTrigger asChild>
        <button type="button" className={trigger}>
          {label}
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </OriginDropdownTrigger>
      <OriginDropdownContent align={align}>
        <OriginDropdownItem>Duplicate</OriginDropdownItem>
        <OriginDropdownItem>Move to…</OriginDropdownItem>
        <OriginDropdownItem>Archive</OriginDropdownItem>
      </OriginDropdownContent>
    </OriginDropdown>
  );
}

export function Origins() {
  return (
    <div className="flex w-full max-w-lg items-center justify-between gap-2">
      <Menu align="start" label="Start" />
      <Menu align="center" label="Center" />
      <Menu align="end" label="End" />
    </div>
  );
}

export function Shortcuts() {
  return (
    <OriginDropdown>
      <OriginDropdownTrigger asChild>
        <button type="button" className={trigger}>
          Edit
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </OriginDropdownTrigger>
      <OriginDropdownContent>
        <OriginDropdownItem icon={<Undo2 />} shortcut="⌘Z">
          Undo
        </OriginDropdownItem>
        <OriginDropdownItem icon={<Redo2 />} shortcut="⇧⌘Z" disabled>
          Redo
        </OriginDropdownItem>
        <OriginDropdownSeparator />
        <OriginDropdownItem icon={<Scissors />} shortcut="⌘X">
          Cut
        </OriginDropdownItem>
        <OriginDropdownItem icon={<Copy />} shortcut="⌘C">
          Copy
        </OriginDropdownItem>
        <OriginDropdownItem icon={<Clipboard />} shortcut="⌘V">
          Paste
        </OriginDropdownItem>
      </OriginDropdownContent>
    </OriginDropdown>
  );
}
