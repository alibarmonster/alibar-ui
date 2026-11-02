"use client";

import { useState } from "react";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { HtmlCanvasDemo } from "@/components/site/html-canvas-demo";
import { DissolveTransition } from "@/components/ui/dissolve-transition/dissolve-transition";

const TABS = [
  { id: "overview", label: "Overview", title: "Q4 launch plan", body: "Three workstreams, nine milestones. Design review is Thursday; the beta cohort opens the week after.", stat: "72%", statLabel: "on track" },
  { id: "activity", label: "Activity", title: "This week", body: "Mina shipped the billing migration. Theo opened 4 pull requests. Two incidents resolved in under an hour.", stat: "38", statLabel: "events" },
  { id: "settings", label: "Settings", title: "Notifications", body: "Email digests go out Mondays at 08:00. Mentions and assignments notify you right away.", stat: "3", statLabel: "channels" },
];

type Mode = "pixel" | "dither" | "noise";

function Panel({ tab }: { tab: (typeof TABS)[number] }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">{tab.label}</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">{tab.title}</h3>
        </div>
        <p className="text-right">
          <span className="block font-mono text-2xl font-semibold text-foreground">{tab.stat}</span>
          <span className="text-[12px] text-muted-foreground">{tab.statLabel}</span>
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{tab.body}</p>
      <div className="mt-4 flex gap-2">
        <button type="button" className="h-9 cursor-pointer rounded-full bg-foreground px-4 text-[13px] font-medium text-background">
          Open {tab.label.toLowerCase()}
        </button>
        <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[13px] font-medium text-foreground">
          Share
        </a>
      </div>
    </div>
  );
}

export function Default() {
  const [tab, setTab] = useState(TABS[0].id);
  const [effect, setEffect] = useState<Mode>("pixel");
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <div className="flex w-full max-w-md flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div role="tablist" aria-label="Sections" className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={t.id === tab}
                  onClick={() => setTab(t.id)}
                  className={`h-8 cursor-pointer rounded-full px-3 text-[13px] font-medium ${t.id === tab ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <DemoStateSwitcher<Mode> label="Effect" states={["pixel", "dither", "noise"]} value={effect} onChange={setEffect} />
          </div>
          <div role="tabpanel">
            <DissolveTransition contentKey={tab} mode={effect} rendering={rendering} onModeChange={onModeChange}>
              <Panel tab={current} />
            </DissolveTransition>
          </div>
        </div>
      )}
    </HtmlCanvasDemo>
  );
}

const STEPS = ["Account", "Workspace", "Invite"];

export function Steps() {
  const [step, setStep] = useState(0);
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <DissolveTransition contentKey={step} mode="noise" direction="right" duration={1.1} edgeColor="#7c3aed" rendering={rendering} onModeChange={onModeChange}>
            <div className="rounded-2xl border border-border bg-background p-5">
              <p className="text-[12px] text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">{STEPS[step]}</h3>
              <label className="mt-4 block text-[13px] font-medium text-foreground">
                {step === 0 ? "Email" : step === 1 ? "Workspace name" : "Teammate emails"}
                <input className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder={step === 0 ? "you@studio.dev" : step === 1 ? "Northwind Studio" : "mina@, theo@"} />
              </label>
            </div>
          </DissolveTransition>
          <div className="flex justify-between">
            <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="h-9 cursor-pointer rounded-full border border-border px-4 text-[13px] font-medium text-foreground disabled:opacity-40">
              Back
            </button>
            <button type="button" onClick={() => setStep((s) => (s + 1) % STEPS.length)} className="h-9 cursor-pointer rounded-full bg-foreground px-4 text-[13px] font-medium text-background">
              {step === STEPS.length - 1 ? "Start over" : "Continue"}
            </button>
          </div>
        </div>
      )}
    </HtmlCanvasDemo>
  );
}
