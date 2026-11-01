"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { SiteCopyButton } from "@/components/site/site-copy-button";
import { cn } from "@/lib/utils";

const COLLAPSE_AFTER_LINES = 18;

export function CodeFrame({
  html,
  lines,
  title,
  icon,
  collapsible = false,
  className,
}: {
  html: string;
  /** Line count of the source, used to decide whether to collapse it. */
  lines: number;
  title?: string;
  icon?: ReactNode;
  collapsible?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const collapsed = collapsible && lines > COLLAPSE_AFTER_LINES && !expanded;
  // Copy what's on screen: the highlighted <pre> holds the exact source, so the raw text
  // doesn't need to ship a second time in the page payload.
  const readCode = () => frameRef.current?.querySelector("pre")?.textContent ?? "";

  return (
    <div
      ref={frameRef}
      className={cn("code-block relative overflow-hidden rounded-xl border border-border bg-background", className)}
    >
      {title ? (
        <div className="flex h-11 items-center justify-between gap-3 border-b border-border bg-surface pr-1.5 pl-4">
          <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
            {icon}
            <span className="truncate">{title}</span>
          </span>
          <SiteCopyButton value={readCode} variant="ghost" size="sm" aria-label={`Copy ${title}`} />
        </div>
      ) : (
        <SiteCopyButton
          value={readCode}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur"
        />
      )}

      <div className={cn("relative", collapsed && "max-h-[22rem] overflow-hidden", !title && "[&_pre]:pr-14")}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {collapsed ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/80 to-transparent" />
        ) : null}
      </div>

      {collapsible && lines > COLLAPSE_AFTER_LINES ? (
        <div className={cn("flex justify-center", collapsed ? "absolute inset-x-0 bottom-3" : "border-t border-border py-2")}>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => {
              setExpanded((value) => !value);
              if (expanded) frameRef.current?.scrollIntoView({ block: "nearest" });
            }}
            className="focus-ring inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-surface"
          >
            {expanded ? "Collapse" : `Show all ${lines} lines`}
            <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
