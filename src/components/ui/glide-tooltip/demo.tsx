"use client";

import { Bold, Code, Info, Italic, Link2, List, Quote, Underline } from "lucide-react";
import { GlideTooltip, GlideTooltipProvider, TooltipKbd } from "@/components/ui/glide-tooltip/glide-tooltip";

const TOOLS = [
  { label: "Bold", keys: "⌘B", icon: Bold },
  { label: "Italic", keys: "⌘I", icon: Italic },
  { label: "Underline", keys: "⌘U", icon: Underline },
  { label: "Link", keys: "⌘K", icon: Link2 },
  { label: "Bulleted list", keys: "⇧⌘8", icon: List },
  { label: "Quote", keys: "⇧⌘9", icon: Quote },
  { label: "Code", keys: "⌘E", icon: Code },
];

export function Default() {
  return (
    <GlideTooltipProvider>
      <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5 rounded-xl border border-border bg-background p-1 shadow-sm">
        {TOOLS.map(({ label, keys, icon: Icon }) => (
          <GlideTooltip
            key={label}
            content={
              <>
                {label}
                <TooltipKbd>{keys}</TooltipKbd>
              </>
            }
          >
            <button
              type="button"
              aria-label={label}
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          </GlideTooltip>
        ))}
      </div>
    </GlideTooltipProvider>
  );
}

const PEOPLE = [
  { name: "Alibar", hue: "from-sky-300 to-blue-600" },
  { name: "Raka Pratama", hue: "from-amber-200 to-orange-500" },
  { name: "Dimas Saputra", hue: "from-emerald-200 to-teal-600" },
  { name: "Sari Wulandari", hue: "from-rose-200 to-pink-600" },
  { name: "Bima Nugroho", hue: "from-violet-200 to-indigo-600" },
];

export function Avatars() {
  return (
    <GlideTooltipProvider delay={300}>
      <div className="flex -space-x-2">
        {PEOPLE.map((person) => (
          <GlideTooltip key={person.name} content={person.name} side="bottom">
            <button
              type="button"
              aria-label={person.name}
              className={`size-10 cursor-pointer rounded-full border-2 border-background bg-gradient-to-br ${person.hue} outline-none transition-transform hover:z-10 hover:-translate-y-0.5 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring`}
            />
          </GlideTooltip>
        ))}
      </div>
    </GlideTooltipProvider>
  );
}

export function Standalone() {
  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      Monthly active users
      <GlideTooltip content="People who opened the app at least once in the last 30 days.">
        <button
          type="button"
          aria-label="About monthly active users"
          className="inline-flex size-6 cursor-help items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="size-4" aria-hidden="true" />
        </button>
      </GlideTooltip>
    </div>
  );
}
