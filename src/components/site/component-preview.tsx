"use client";

import { useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { AppWindow, ArrowUpRight, Check, ChevronDown, Code2, Copy, Eye, FileCode, Maximize2, Menu, RotateCcw, Smartphone, Sparkles, Square, Terminal, X } from "lucide-react";
import { Dialog, DropdownMenu, Popover, ToggleGroup } from "radix-ui";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { CodeFrame } from "./code-frame";
import { DemoRenderer } from "./demo-renderer";
import { backdrops, type Backdrop } from "./preview-backdrops";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export interface PreviewVariant {
  name: string;
  label: string;
  /** Line count of the variant's source. */
  lines: number;
  html: string;
}

type Mode = "canvas" | "background" | "landing" | "mobile";

/** What the "Copy for AI" menu can hand over. */
export interface PreviewCopy {
  name: string;
  description: string;
  /** shadcn CLI command. */
  install: string;
  /** Usage snippet from docs.ts. */
  usage: string;
  /** The component's full source. */
  source: string;
}

function promptFor(copy: PreviewCopy) {
  return [
    `Add the ${copy.name} component from alibar/ui to my React + Tailwind project.`,
    copy.description,
    "",
    `Install it with:\n${copy.install}`,
    "",
    `Then use it like this:\n${copy.usage}`,
    "",
    "Match my project's existing styles and keep its accessibility and reduced-motion behavior.",
  ].join("\n");
}

function CopyForAI({ copy }: { copy: PreviewCopy }) {
  const [copied, setCopied] = useState<string | null>(null);
  const write = (key: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    });
  };
  const prompt = promptFor(copy);
  const q = encodeURIComponent(prompt);
  const tiles = [
    { key: "install", label: "Install", hint: "CLI command", Icon: Terminal, text: copy.install },
    { key: "usage", label: "Usage", hint: "Example code", Icon: Code2, text: copy.usage },
    { key: "source", label: "Source", hint: "Whole file", Icon: FileCode, text: copy.source },
  ];
  const sends = [
    { label: "ChatGPT", href: `https://chatgpt.com/?q=${q}` },
    { label: "Claude", href: `https://claude.ai/new?q=${q}` },
    { label: "v0", href: `https://v0.dev/chat?q=${q}` },
  ];
  const done = (key: string) => copied === key;

  return (
    <div className="inline-flex h-9 items-stretch rounded-[10px] border border-border bg-surface">
      {/* One click: the prompt. The caret opens everything else. */}
      <button
        type="button"
        onClick={() => write("prompt", prompt)}
        className="focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-l-[9px] px-3 text-[13px] font-medium text-foreground hover:bg-surface-2"
      >
        {done("prompt") ? <Check className="size-3.5 text-[color-mix(in_oklab,var(--success)_80%,var(--foreground))]" aria-hidden="true" /> : <Sparkles className="size-3.5" aria-hidden="true" />}
        {done("prompt") ? "Prompt copied" : "Copy prompt"}
      </button>
      <Popover.Root>
        <Popover.Trigger aria-label="More ways to use this with AI" className="focus-ring inline-flex w-8 cursor-pointer items-center justify-center rounded-r-[9px] border-l border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground data-[state=open]:bg-surface-2">
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="end" sideOffset={8} className="z-50 w-80 rounded-2xl border border-border bg-background p-3 shadow-xl outline-none">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              Use with AI
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Hand {copy.name} to your assistant, ready to drop in.</p>

            <div className="relative mt-3 rounded-xl border border-border bg-surface p-2.5 pr-10">
              <p className="line-clamp-3 font-mono text-[11px] leading-[1.55] whitespace-pre-line text-muted-foreground">{prompt}</p>
              <button
                type="button"
                onClick={() => write("prompt", prompt)}
                aria-label={done("prompt") ? "Prompt copied" : "Copy prompt"}
                className="focus-ring absolute top-2 right-2 grid size-7 cursor-pointer place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground"
              >
                {done("prompt") ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
              </button>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {tiles.map(({ key, label, hint, Icon, text }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => write(key, text)}
                  aria-label={done(key) ? `${label} copied` : `Copy ${hint.toLowerCase()}`}
                  className={cn(
                    "focus-ring flex cursor-pointer flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition-colors",
                    done(key) ? "border-success/40 bg-success/[0.06]" : "border-border hover:bg-surface",
                  )}
                >
                  {done(key) ? <Check className="size-4 text-[color-mix(in_oklab,var(--success)_80%,var(--foreground))]" aria-hidden="true" /> : <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
                  <span className="text-[12px] font-medium text-foreground">{done(key) ? "Copied" : label}</span>
                  <span className="text-[10.5px] leading-tight text-muted-foreground">{hint}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <span className="text-[11px] font-medium text-muted-foreground">Send to</span>
              <div className="ml-auto flex gap-1">
                {sends.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[12px] font-medium text-foreground hover:bg-surface"
                  >
                    {label}
                    <ArrowUpRight className="size-3 text-muted-foreground" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
            <p aria-live="polite" className="sr-only">
              {copied ? "Copied to the clipboard" : ""}
            </p>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

/** A plain white stage for previews. */
export function PreviewStage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("relative overflow-hidden rounded-xl border border-border bg-background", className)}>{children}</div>;
}

function ReplayButton({ count, onReplay }: { count: number; onReplay: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onReplay}
      aria-label="Replay animation"
      title="Replay"
      className="focus-ring relative inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
    >
      <m.span animate={{ rotate: reduceMotion ? 0 : -360 * count }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="inline-flex">
        <RotateCcw className="size-4" aria-hidden="true" />
      </m.span>
    </button>
  );
}

const MODE_META: Record<Mode, { label: string; icon: typeof Square }> = {
  canvas: { label: "Canvas", icon: Square },
  background: { label: "Background only", icon: Square },
  landing: { label: "Landing page", icon: AppWindow },
  mobile: { label: "Mobile", icon: Smartphone },
};

function ModeToggle({ modes, value, onChange }: { modes: Mode[]; value: Mode; onChange: (mode: Mode) => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => next && onChange(next as Mode)}
      aria-label="Preview mode"
      className="flex items-center gap-0.5 rounded-[10px] border border-border bg-surface p-0.5"
    >
      {modes.map((mode) => {
        const { label, icon: Icon } = MODE_META[mode];
        const active = mode === value;
        return (
          <ToggleGroup.Item
            key={mode}
            value={mode}
            aria-label={label}
            title={label}
            className={cn("focus-ring relative inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {active ? <m.span layoutId="preview-mode" transition={reduceMotion ? { duration: 0 } : spring.snappy} className="absolute inset-0 rounded-lg border border-border bg-background shadow-xs" /> : null}
            <Icon className="relative size-4" aria-hidden="true" />
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}

function StyleMenu({ variants, value, onChange }: { variants: PreviewVariant[]; value: string; onChange: (value: string) => void }) {
  const current = variants.find((v) => v.name === value) ?? variants[0];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="focus-ring inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs hover:bg-surface data-[state=open]:bg-surface">
        <span className="text-muted-foreground">Style</span>
        {current.label}
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-44 rounded-xl border border-border bg-background p-1 shadow-lg">
          <DropdownMenu.Label className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground">Style</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={current.name} onValueChange={onChange}>
            {variants.map((v) => (
              <DropdownMenu.RadioItem
                key={v.name}
                value={v.name}
                className="relative flex h-8 cursor-pointer items-center rounded-lg pr-8 pl-2.5 text-[13px] text-foreground outline-none select-none data-[highlighted]:bg-surface-2"
              >
                {v.label}
                <DropdownMenu.ItemIndicator className="absolute right-2.5">
                  <Check className="size-3.5" aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function backdropFor(backdrop: Backdrop, variant: string) {
  const v = backdrop.variants?.[variant];
  return { props: { ...backdrop.props, ...v?.props }, tone: v?.tone ?? backdrop.tone ?? "light" };
}

function Brand({ dark }: { dark: boolean }) {
  return (
    <span className={cn("flex items-center gap-1.5 text-[15px] font-semibold tracking-tight", dark ? "text-white" : "text-[#0b0b0c]")}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <circle cx="8" cy="12" r="5" fill="currentColor" opacity="0.35" />
        <circle cx="16" cy="12" r="5" fill="currentColor" />
      </svg>
      Lumen
    </span>
  );
}

/** A sample landing page drawn over a background, to see it in context. */
function SampleLanding({ dark }: { dark: boolean }) {
  const ink = dark ? "text-white" : "text-[#0b0b0c]";
  const muted = dark ? "text-white/70" : "text-[#52525b]";
  return (
    <div className="pointer-events-none relative z-10 flex h-full flex-col px-6 sm:px-8">
      <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 -z-10 h-3/5", dark ? "bg-gradient-to-t from-black/70 via-black/35 to-transparent" : "bg-gradient-to-t from-white via-white/75 to-transparent")} />
      <div className={cn("-mx-6 flex h-14 items-center gap-6 px-6 backdrop-blur-md sm:-mx-8 sm:px-8", dark ? "bg-black/25" : "bg-white/70")}>
        <Brand dark={dark} />
        <nav aria-hidden="true" className={cn("ml-auto hidden gap-6 text-[13px] sm:flex", muted)}>
          <span>Docs</span>
          <span>Showcase</span>
          <span>Pricing</span>
        </nav>
        <span className={cn("ml-auto rounded-lg px-3 py-1.5 text-[13px] font-medium sm:ml-0", dark ? "bg-white text-[#0b0b0c]" : "bg-[#0b0b0c] text-white")}>Get started</span>
      </div>
      <div className="mt-auto max-w-md pb-10">
        <p className={cn("text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] font-semibold tracking-[-0.03em]", ink)}>Backgrounds that feel alive.</p>
        <p className={cn("mt-3 max-w-sm text-[14px] leading-6", muted)}>Drop one behind your hero and ship. Every alibar/ui background is a copy-paste React component.</p>
        <div className="mt-5 flex gap-2">
          <span className={cn("rounded-lg px-4 py-2 text-[13px] font-medium", dark ? "bg-white text-[#0b0b0c]" : "bg-[#0b0b0c] text-white")}>Start building</span>
          <span className={cn("rounded-lg border px-4 py-2 text-[13px] font-medium", dark ? "border-white/30 text-white" : "border-black/10 bg-white text-[#0b0b0c]")}>Browse components</span>
        </div>
      </div>
    </div>
  );
}

function SampleMobile({ dark }: { dark: boolean }) {
  const ink = dark ? "text-white" : "text-[#0b0b0c]";
  const muted = dark ? "text-white/70" : "text-[#52525b]";
  return (
    <div className="pointer-events-none relative z-10 flex h-full flex-col px-5 pt-12 pb-6">
      <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 -z-10 h-1/2", dark ? "bg-gradient-to-t from-black/75 via-black/40 to-transparent" : "bg-gradient-to-t from-white via-white/80 to-transparent")} />
      <div className="flex items-center justify-between">
        <Brand dark={dark} />
        <span className={cn("grid size-8 place-items-center rounded-lg border", dark ? "border-white/25 text-white" : "border-black/10 bg-white/80 text-[#0b0b0c]")}>
          <Menu className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-auto">
        <p className={cn("text-[24px] leading-[1.1] font-semibold tracking-[-0.02em]", ink)}>Backgrounds that feel alive.</p>
        <p className={cn("mt-2 text-[13px] leading-5", muted)}>Drop one behind your hero and ship.</p>
        <span className={cn("mt-4 block rounded-xl py-2.5 text-center text-[13px] font-medium", dark ? "bg-white text-[#0b0b0c]" : "bg-[#0b0b0c] text-white")}>Start building</span>
        <span className={cn("mt-2 block rounded-xl border py-2.5 text-center text-[13px] font-medium", dark ? "border-white/30 text-white" : "border-black/10 bg-white text-[#0b0b0c]")}>Browse components</span>
      </div>
    </div>
  );
}

function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-full flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_30px_60px_-30px_rgb(0_0_0/0.35)]">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-black/5 bg-[#f6f6f7] px-3">
        <span className="size-2.5 rounded-full bg-black/15" />
        <span className="size-2.5 rounded-full bg-black/15" />
        <span className="size-2.5 rounded-full bg-black/15" />
        <span className="mx-auto rounded-md bg-black/[0.05] px-16 py-0.5 text-[11px] text-black/45">lumen.app</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

const PHONE = { width: 264, height: 540 };

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative shrink-0 rounded-[46px] bg-white p-[9px] shadow-[0_30px_60px_-24px_rgb(0_0_0/0.35),0_0_0_1px_rgb(0_0_0/0.08)]" style={PHONE}>
      <div className="relative size-full overflow-hidden rounded-[38px] bg-white">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 z-20 flex h-10 items-center justify-between px-7 text-[11px] font-semibold text-black/80">
          <span>9:41</span>
          <span className="h-[22px] w-[76px] rounded-full bg-black" />
          <span className="h-2.5 w-5 rounded-[3px] border border-black/60" />
        </div>
        {children}
        <span aria-hidden="true" className="absolute bottom-1.5 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-black/70" />
      </div>
    </div>
  );
}

/** Renders a demo at phone width, scaled to fit the phone's screen. */
function PhoneViewport({ children }: { children: ReactNode }) {
  const width = 390;
  const scale = (PHONE.width - 18) / width;
  return (
    <div className="absolute inset-0 overflow-y-auto pt-10">
      <div style={{ width, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <div className="flex min-h-[640px] items-center justify-center px-4 py-8">{children}</div>
      </div>
    </div>
  );
}

function StageContent({ mode, slug, variant, replays, tall = false }: { mode: Mode; slug: string; variant: string; replays: number; tall?: boolean }) {
  const backdrop = backdrops[slug];
  const demo = <DemoRenderer key={`${variant}:${replays}`} slug={slug} name={variant} />;
  if (backdrop && mode !== "canvas") {
    const { props, tone } = backdropFor(backdrop, variant);
    const Bg = backdrop.Component;
    const bg = <Bg key={`${variant}:${replays}`} {...props} className="absolute inset-0 size-full" />;
    if (mode === "background") return <div className="absolute inset-0">{bg}</div>;
    if (mode === "landing") {
      return (
        <div className={cn("absolute inset-0 p-6 sm:p-10", tall && "sm:p-16")}>
          <BrowserFrame>
            {bg}
            <SampleLanding dark={tone === "dark"} />
          </BrowserFrame>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 grid place-items-center">
        <PhoneFrame>
          {bg}
          <SampleMobile dark={tone === "dark"} />
        </PhoneFrame>
      </div>
    );
  }
  if (mode === "mobile") {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <PhoneFrame>
          <PhoneViewport>{demo}</PhoneViewport>
        </PhoneFrame>
      </div>
    );
  }
  return <div className={cn("relative flex w-full items-center justify-center px-4 py-14 sm:px-10", tall ? "min-h-dvh" : "min-h-[34rem]")}>{demo}</div>;
}

export function ComponentPreview({ slug, variants, copy }: { slug: string; variants: PreviewVariant[]; copy?: PreviewCopy }) {
  const isBackdrop = slug in backdrops;
  const modes: Mode[] = isBackdrop ? ["background", "landing", "mobile"] : ["canvas", "mobile"];
  const [tab, setTab] = useState("preview");
  const [mode, setMode] = useState<Mode>(modes[0]);
  const [variantName, setVariantName] = useState(variants[0]?.name ?? "");
  const [replays, setReplays] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const variant = variants.find((v) => v.name === variantName) ?? variants[0];
  const fixedHeight = mode !== "canvas";
  // A new slug starts over in its first mode and style.
  const [shownSlug, setShownSlug] = useState(slug);
  if (shownSlug !== slug) {
    setShownSlug(slug);
    setMode(modes[0]);
    setVariantName(variants[0]?.name ?? "");
  }

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
        <div className="flex flex-wrap items-center gap-2">
          {tab === "preview" ? (
            <>
              <ModeToggle modes={modes} value={mode} onChange={setMode} />
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                aria-label="Open the preview full screen"
                title="Full screen"
                className="focus-ring inline-flex size-9 cursor-pointer items-center justify-center rounded-[10px] border border-border bg-surface text-muted-foreground hover:text-foreground"
              >
                <Maximize2 className="size-4" aria-hidden="true" />
              </button>
            </>
          ) : null}
          {variants.length > 1 ? <StyleMenu variants={variants} value={variant.name} onChange={setVariantName} /> : null}
          {copy ? <CopyForAI copy={copy} /> : null}
        </div>
      </div>

      <TabsContent value="preview" className="rounded-xl">
        <PreviewStage className={cn(fixedHeight && "h-[38rem]")}>
          <div className={cn(fixedHeight ? "absolute inset-0" : "relative")}>
            <StageContent mode={mode} slug={slug} variant={variant.name} replays={replays} />
          </div>
          <div className="absolute top-3 right-3 z-30">
            <ReplayButton count={replays} onReplay={() => setReplays((n) => n + 1)} />
          </div>
        </PreviewStage>
      </TabsContent>

      <TabsContent value="code" className="rounded-xl">
        <CodeFrame html={variant.html} lines={variant.lines} title={`${slug}-demo.tsx`} collapsible />
      </TabsContent>

      <Dialog.Root open={fullscreen} onOpenChange={setFullscreen}>
        <Dialog.Portal>
          <Dialog.Content className="fixed inset-0 z-[60] bg-background outline-none" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">Full-screen preview</Dialog.Title>
            <div className="absolute inset-0 overflow-auto">
              <StageContent mode={mode} slug={slug} variant={variant.name} replays={replays} tall />
            </div>
            <Dialog.Close className="focus-ring absolute top-4 right-4 z-30 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 text-[13px] font-medium text-foreground shadow-sm backdrop-blur">
              <X className="size-4" aria-hidden="true" />
              Close
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Tabs>
  );
}
