"use client";

import { ToastProvider, useToast } from "@/components/ui/toast-stack/toast-stack";

const button =
  "inline-flex h-9 cursor-pointer items-center rounded-md border border-border bg-background px-3.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Buttons() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button type="button" className={button} onClick={() => toast({ title: "Event created", description: "Friday, Nov 7 at 10:00" })}>
        Default
      </button>
      <button type="button" className={button} onClick={() => toast({ title: "Changes saved", status: "success" })}>
        Success
      </button>
      <button
        type="button"
        className={button}
        onClick={() =>
          toast({
            title: "Couldn't send message",
            description: "Check your connection and try again.",
            status: "error",
            action: { label: "Retry", onClick: () => toast({ title: "Message sent", status: "success" }) },
          })
        }
      >
        Error with action
      </button>
    </div>
  );
}

export function Default() {
  return (
    <ToastProvider>
      <Buttons />
    </ToastProvider>
  );
}

function PromiseButton() {
  const { promise } = useToast();
  return (
    <button
      type="button"
      className={button}
      onClick={() =>
        promise(new Promise((resolve) => setTimeout(resolve, 1600)), {
          loading: "Publishing your site…",
          success: "Site published",
          error: "Publishing failed",
        })
      }
    >
      Publish site
    </button>
  );
}

export function PromiseStatus() {
  return (
    <ToastProvider>
      <PromiseButton />
    </ToastProvider>
  );
}

const BURST = ["New comment from Alibar", "Raka joined the project", "Build #482 passed", "Weekly report ready"];

function BurstButton() {
  const { toast, dismiss } = useToast();
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className={button}
        onClick={() => BURST.forEach((title, i) => setTimeout(() => toast({ title, status: i === 2 ? "success" : "info" }), i * 180))}
      >
        Show four
      </button>
      <button type="button" className={button} onClick={() => dismiss()}>
        Clear all
      </button>
    </div>
  );
}

export function Stack() {
  return (
    <div className="flex flex-col items-center gap-3">
      <ToastProvider duration={8000}>
        <BurstButton />
      </ToastProvider>
      <p className="text-[13px] text-muted-foreground">Hover the stack to fan it out; swipe a toast sideways to dismiss it.</p>
    </div>
  );
}
