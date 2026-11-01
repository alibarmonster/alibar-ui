"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, FileCode2, Folder, Home } from "lucide-react";
import { AnimatedBreadcrumb, type BreadcrumbItem } from "@/components/ui/animated-breadcrumb/animated-breadcrumb";

const TRAIL: BreadcrumbItem[] = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Aurora", href: "#aurora" },
  { label: "Components", href: "#components" },
  { label: "Buttons", href: "#buttons" },
  { label: "spring-press-button.tsx", href: "#file" },
];

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40";

export function Default() {
  const [depth, setDepth] = useState(3);
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-5">
      <div className="flex h-10 items-center">
        <AnimatedBreadcrumb
          aria-label="File path"
          items={TRAIL.slice(0, depth)}
          onNavigate={(_, index, event) => {
            event.preventDefault();
            setDepth(index + 1);
          }}
        />
      </div>
      <div className="flex gap-2">
        <button type="button" className={control} disabled={depth <= 1} onClick={() => setDepth((d) => d - 1)}>
          <ArrowUp className="size-3.5" aria-hidden="true" />
          Up a level
        </button>
        <button type="button" className={control} disabled={depth >= TRAIL.length} onClick={() => setDepth((d) => d + 1)}>
          <ArrowDown className="size-3.5" aria-hidden="true" />
          Go deeper
        </button>
      </div>
      <p className="text-[13px] text-muted-foreground">Past four levels, the middle collapses into a menu.</p>
    </div>
  );
}

export function WithIcons() {
  return (
    <AnimatedBreadcrumb
      aria-label="File path"
      separator={<span className="text-muted-foreground/50">/</span>}
      items={[
        { label: "Home", href: "#home", icon: <Home /> },
        { label: "src", href: "#src", icon: <Folder /> },
        { label: "components", href: "#components", icon: <Folder /> },
        { label: "dock.tsx", icon: <FileCode2 /> },
      ]}
    />
  );
}
