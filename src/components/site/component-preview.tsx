"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Code2, Eye, RotateCcw } from "lucide-react";
import { ToggleGroup } from "radix-ui";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { CodeFrame } from "./code-frame";
import { DemoRenderer } from "./demo-renderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export interface PreviewVariant {
  name: string;
  label: string;
  /** Line count of the variant's source. */
  lines: number;
  html: string;
}

export function PreviewStage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-background", className)}>
      <div
        aria-hidden="true"
        className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]"
      />
      {children}
    </div>
  );
}

function ReplayButton({ count, onReplay }: { count: number; onReplay: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onReplay}
      aria-label="Replay animation"
      title="Replay"
      className="focus-ring relative inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors after:absolute after:-inset-1 hover:bg-surface-2 hover:text-foreground"
    >
      <m.span
        animate={{ rotate: reduceMotion ? 0 : -360 * count }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
      </m.span>
    </button>
  );
}

function VariantSwitcher({
  variants,
  value,
  onChange,
}: {
  variants: PreviewVariant[];
  value: string;
  onChange: (value: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => next && onChange(next)}
      aria-label="Variant"
      className="no-scrollbar -mx-1 flex max-w-full items-center gap-0.5 overflow-x-auto px-1"
    >
      {variants.map((variant) => {
        const active = variant.name === value;
        return (
          <ToggleGroup.Item
            key={variant.name}
            value={variant.name}
            className={cn(
              "focus-ring relative inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full px-3 text-[13px] font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <m.span
                layoutId="variant-indicator"
                transition={reduceMotion ? { duration: 0 } : spring.snappy}
                className="absolute inset-0 rounded-full border border-border bg-background shadow-xs"
              />
            ) : null}
            <span className="relative">{variant.label}</span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}

export function ComponentPreview({ slug, variants }: { slug: string; variants: PreviewVariant[] }) {
  const [tab, setTab] = useState("preview");
  const [variantName, setVariantName] = useState(variants[0]?.name ?? "");
  const [replays, setReplays] = useState(0);
  const variant = variants.find((v) => v.name === variantName) ?? variants[0];

  if (!variant) return null;

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <TabsList aria-label="View">
          <TabsTrigger value="preview">
            <Eye className="size-3.5" aria-hidden="true" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code2 className="size-3.5" aria-hidden="true" />
            Code
          </TabsTrigger>
        </TabsList>
        {variants.length > 1 ? (
          <VariantSwitcher variants={variants} value={variant.name} onChange={setVariantName} />
        ) : null}
      </div>

      <TabsContent value="preview" className="rounded-xl">
        <PreviewStage>
          <div className="absolute top-2 right-2 z-10">
            <ReplayButton count={replays} onReplay={() => setReplays((n) => n + 1)} />
          </div>
          <div className="relative flex min-h-[22rem] w-full items-center justify-center px-4 py-14 sm:px-10">
            <DemoRenderer key={`${variant.name}:${replays}`} slug={slug} name={variant.name} />
          </div>
        </PreviewStage>
      </TabsContent>

      <TabsContent value="code" className="rounded-xl">
        <CodeFrame html={variant.html} lines={variant.lines} title={`${slug}-demo.tsx`} collapsible />
      </TabsContent>
    </Tabs>
  );
}
