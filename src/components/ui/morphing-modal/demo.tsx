"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { MorphingModal } from "@/components/ui/morphing-modal/morphing-modal";

const button =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
const solid = `${button} bg-foreground text-background hover:bg-foreground/90`;
const outline = `${button} border border-border bg-background text-foreground hover:bg-accent`;

const PLANS = [
  { id: "pro", name: "Pro", price: "$24/mo", note: "Unlimited projects and history." },
  { id: "team", name: "Team", price: "$79/mo", note: "Everything in Pro, plus SSO and roles." },
];

export function Default() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"plans" | "checkout" | "done">("plans");
  const [plan, setPlan] = useState("pro");

  const content = {
    plans: {
      title: "Upgrade your workspace",
      description: "Pick a plan. You can change it any time.",
      body: (
        <div className="space-y-4">
          <div className="space-y-2" role="radiogroup" aria-label="Plan">
            {PLANS.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${plan === p.id ? "border-primary bg-primary/[0.04]" : "border-border hover:bg-accent/50"}`}
              >
                <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} className="accent-primary" />
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">{p.name}</span>
                  <span className="block text-[13px] text-muted-foreground">{p.note}</span>
                </span>
                <span className="text-sm font-medium text-foreground tabular-nums">{p.price}</span>
              </label>
            ))}
          </div>
          <button type="button" className={`${solid} w-full`} onClick={() => setView("checkout")} data-autofocus>
            Continue
          </button>
        </div>
      ),
    },
    checkout: {
      title: "Payment details",
      description: `You're upgrading to ${plan === "pro" ? "Pro" : "Team"}.`,
      body: (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setView("done");
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-[13px] font-medium text-foreground">Name on card</span>
            <input data-autofocus required defaultValue="Alibar" className="h-10 w-full rounded-md border border-input px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[13px] font-medium text-foreground">Card number</span>
            <input required inputMode="numeric" defaultValue="4242 4242 4242 4242" className="h-10 w-full rounded-md border border-input px-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input aria-label="Expiry" defaultValue="12 / 28" className="h-10 rounded-md border border-input px-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20" />
            <input aria-label="CVC" defaultValue="123" className="h-10 rounded-md border border-input px-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className={`${outline} flex-1`} onClick={() => setView("plans")}>
              Back
            </button>
            <button type="submit" className={`${solid} flex-1`}>
              Pay {plan === "pro" ? "$24" : "$79"}
            </button>
          </div>
        </form>
      ),
    },
    done: {
      title: "You're all set",
      description: "Your workspace has been upgraded. A receipt is on its way.",
      body: (
        <button type="button" className={`${solid} w-full`} onClick={() => setOpen(false)} data-autofocus>
          <Check className="size-4" aria-hidden="true" />
          Done
        </button>
      ),
    },
  }[view];

  return (
    <MorphingModal
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setView("plans");
      }}
      trigger={
        <button type="button" className={solid}>
          Upgrade plan
        </button>
      }
      view={view}
      title={content.title}
      description={content.description}
    >
      {content.body}
    </MorphingModal>
  );
}

export function Confirm() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"confirm" | "deleting" | "deleted">("confirm");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (view !== "deleting") return;
    const timer = window.setTimeout(() => setView("deleted"), 1400);
    return () => window.clearTimeout(timer);
  }, [view]);

  return (
    <MorphingModal
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setView("confirm");
          setTyped("");
        }
      }}
      trigger={
        <button type="button" className={`${button} bg-destructive text-white hover:bg-destructive/90`}>
          Delete project
        </button>
      }
      view={view}
      className="max-w-sm"
      showClose={view !== "deleting"}
      title={view === "confirm" ? "Delete “aurora”?" : view === "deleting" ? "Deleting…" : "Project deleted"}
      description={
        view === "confirm"
          ? "This permanently removes the project, its deployments and its history."
          : view === "deleting"
            ? "Removing deployments and history."
            : undefined
      }
    >
      {view === "confirm" ? (
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-[13px] text-muted-foreground">
              Type <span className="font-mono font-medium text-foreground">aurora</span> to confirm
            </span>
            <input
              data-autofocus
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              className="h-10 w-full rounded-md border border-input px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
            />
          </label>
          <button
            type="button"
            disabled={typed !== "aurora"}
            onClick={() => setView("deleting")}
            className={`${button} w-full bg-destructive text-white hover:bg-destructive/90`}
          >
            Delete forever
          </button>
        </div>
      ) : view === "deleting" ? (
        <div className="flex justify-center py-2 text-muted-foreground">
          <Loader2 className="size-6 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        </div>
      ) : (
        <button type="button" className={`${outline} w-full`} onClick={() => setOpen(false)} data-autofocus>
          Close
        </button>
      )}
    </MorphingModal>
  );
}
