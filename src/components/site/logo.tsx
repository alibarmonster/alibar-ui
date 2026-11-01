import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-6 text-foreground", className)}>
      <rect width="24" height="24" rx="7" fill="currentColor" />
      <path
        d="M6.5 16.75c2.6 0 3.7-1.5 4.6-4.1l.5-1.4c.9-2.5 2-4 4.9-4"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="16.75" cy="16.25" r="1.75" fill="white" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  const [name, suffix] = siteConfig.name.split("/");
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">
        {name}
        {suffix ? <span className="text-muted-foreground">/{suffix}</span> : null}
      </span>
    </span>
  );
}
