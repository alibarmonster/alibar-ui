"use client";

import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HtmlCanvasStatusChip, useHtmlCanvasStatus } from "@/components/site/html-canvas-status";
import { Default as ClothDemo } from "@/components/ui/cloth-banner/demo";
import { Default as CrtDemo } from "@/components/ui/crt-terminal/demo";
import { Default as DisintegrateDemo } from "@/components/ui/disintegrate-delete/demo";
import { Default as DissolveDemo } from "@/components/ui/dissolve-transition/demo";
import { Laptop as ScreenDemo } from "@/components/ui/floating-screen/demo";
import { Default as GlassDemo } from "@/components/ui/liquid-glass-overlay/demo";
import { Default as BookDemo } from "@/components/ui/living-book/demo";
import { Default as LensDemo } from "@/components/ui/magnifier-lens/demo";
import { Default as PeelDemo } from "@/components/ui/peel-card/demo";
import { Default as RippleDemo } from "@/components/ui/ripple-form/demo";
import { describeSupport } from "@/lib/html-canvas/support";
import { TwoDCheck, WebGLCheck } from "./adapter-check";

const COMPONENTS = [
  { slug: "ripple-form", name: "Ripple Form", number: 179, Demo: RippleDemo },
  { slug: "dissolve-transition", name: "Dissolve Transition", number: 182, Demo: DissolveDemo },
  { slug: "crt-terminal", name: "CRT Terminal", number: 183, Demo: CrtDemo },
  { slug: "disintegrate-delete", name: "Disintegrate Delete", number: 184, Demo: DisintegrateDemo },
  { slug: "magnifier-lens", name: "Magnifier Lens", number: 185, Demo: LensDemo },
  { slug: "cloth-banner", name: "Cloth Banner", number: 187, Demo: ClothDemo },
  { slug: "peel-card", name: "Peel Card", number: 180, Demo: PeelDemo },
  { slug: "liquid-glass-overlay", name: "Liquid Glass Overlay", number: 188, Demo: GlassDemo },
  { slug: "floating-screen", name: "Floating Screen", number: 186, Demo: ScreenDemo },
  { slug: "living-book", name: "Living Book", number: 181, Demo: BookDemo },
];

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("inline-flex items-center gap-1 font-medium", on ? "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" : "text-muted-foreground")}>
        {on ? <Check className="size-3.5" aria-hidden="true" /> : <Minus className="size-3.5" aria-hidden="true" />}
        {on ? "Yes" : "No"}
      </span>
    </li>
  );
}

function SupportPanel() {
  const { hydrated, support, reduceMotion } = useHtmlCanvasStatus();
  return (
    <section aria-labelledby="support-title" className="rounded-2xl border border-border bg-background p-5">
      <h2 id="support-title" className="text-sm font-semibold text-foreground">
        This browser
      </h2>
      <ul className="mt-2 divide-y divide-border">
        <li className="flex items-center justify-between gap-3 py-2 text-[13px]">
          <span className="text-muted-foreground">API version</span>
          <span className="font-medium text-foreground">{hydrated ? describeSupport(support) : "Checking…"}</span>
        </li>
        <Flag on={support.twoD} label="2D drawElementImage" />
        <Flag on={support.webgl} label="WebGL element textures" />
        <Flag on={support.webgpu} label="WebGPU element textures" />
        <Flag on={!reduceMotion} label="Motion allowed (no reduced-motion preference)" />
      </ul>
    </section>
  );
}

function EnableSteps() {
  return (
    <section aria-labelledby="enable-title" className="rounded-2xl border border-border bg-background p-5 text-[13px] leading-6 text-muted-foreground">
      <h2 id="enable-title" className="text-sm font-semibold text-foreground">
        Turn it on
      </h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>Open Chrome Canary (or a Chrome build in the origin trial).</li>
        <li>
          Go to <code className="rounded bg-surface-2 px-1 font-mono text-[12px] text-foreground">chrome://flags/#canvas-draw-element</code>, enable it and relaunch.
        </li>
        <li>
          For production, register for the origin trial and set <code className="rounded bg-surface-2 px-1 font-mono text-[12px] text-foreground">NEXT_PUBLIC_HTML_IN_CANVAS_OT_TOKEN</code>; the site adds the token as a meta tag.
        </li>
      </ol>
      <p className="mt-2">
        Every component also works without it. Use the Native / Fallback switch on each one to compare. Reduced motion always uses the fallback.
      </p>
    </section>
  );
}

export function HtmlInCanvasDemo() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-20 sm:px-6">
      <div className="mb-6">
        <p className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-6 items-center rounded-full bg-warning/15 px-2.5 text-xs font-semibold text-[color-mix(in_oklab,var(--warning)_70%,var(--foreground))]">Experimental · Chrome origin trial</span>
          <HtmlCanvasStatusChip />
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">HTML in Canvas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Real DOM (text, inputs, buttons, links) drawn into a canvas or used as a WebGL texture, distorted by shaders, and still interactive, selectable and accessible. Built on the WICG{" "}
          <a href="https://github.com/WICG/html-in-canvas" target="_blank" rel="noreferrer" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            HTML-in-Canvas
          </a>{" "}
          proposal through one adapter in <code className="rounded bg-surface-2 px-1 font-mono text-[12px] text-foreground">src/lib/html-canvas/</code>.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SupportPanel />
        <EnableSteps />
      </div>

      <section aria-labelledby="check-title" className="mt-4 rounded-2xl border border-border bg-background p-5">
        <h2 id="check-title" className="text-sm font-semibold text-foreground">
          Adapter check
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">Both forms are drawn by the canvas. Type in them and press their buttons: the adapter keeps hit-testing and focus where each form is drawn.</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-surface p-2">
            <TwoDCheck />
          </div>
          <div className="rounded-xl bg-surface p-2">
            <WebGLCheck />
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4">
        {COMPONENTS.map(({ slug, name, number, Demo }) => (
          <section key={slug} aria-labelledby={`${slug}-title`} className="rounded-2xl border border-border bg-background p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`${slug}-title`} className="text-base font-semibold text-foreground">
                <span className="mr-2 font-mono text-[12px] text-muted-foreground">#{number}</span>
                {name}
              </h2>
              <Link href={`/components/${slug}`} className="text-[13px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                Docs
              </Link>
            </div>
            <div className="flex justify-center">
              <Demo />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}


