import { cn } from "@/lib/utils";

/** A generated avatar: a gradient from a hash of the name, with initials. No images needed. */
export function MarketAvatar({ name, className }: { name: string; className?: string }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (Math.imul(hash, 31) + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  const initials = name
    .replace(/^@/, "")
    .split(/[\s._-]+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-background", className)}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 40%))` }}
    >
      {initials}
    </span>
  );
}

/** A small "Simulated" badge for demos that use mock data. */
export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 text-[11px] font-medium text-[color-mix(in_oklab,var(--warning)_75%,var(--foreground))]", className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-warning" />
      Simulated
    </span>
  );
}
