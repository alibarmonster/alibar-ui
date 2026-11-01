"use client";

import { BarChart3, FileText, LayoutDashboard, Settings } from "lucide-react";
import { SlidingTabs } from "@/components/ui/sliding-tabs/sliding-tabs";

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5 shadow-xs">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
      <div className="mt-4 flex h-16 items-end gap-1.5" aria-hidden="true">
        {[40, 65, 50, 80, 58, 92, 70].map((h, i) => (
          <span key={i} className="flex-1 rounded-sm bg-muted" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function Default() {
  return (
    <div className="w-full max-w-lg">
      <SlidingTabs
        aria-label="Dashboard sections"
        items={[
          { value: "overview", label: "Overview", icon: <LayoutDashboard aria-hidden="true" />, content: <Panel title="Overview" body="Revenue is up 12% on last week, led by annual plans." /> },
          { value: "analytics", label: "Analytics", icon: <BarChart3 aria-hidden="true" />, content: <Panel title="Analytics" body="Sessions peaked on Thursday after the launch email." /> },
          { value: "reports", label: "Reports", icon: <FileText aria-hidden="true" />, content: <Panel title="Reports" body="Three scheduled reports are ready to download." /> },
          { value: "settings", label: "Settings", icon: <Settings aria-hidden="true" />, content: <Panel title="Settings" body="Manage members, billing and integrations." /> },
        ]}
      />
    </div>
  );
}

export function Underline() {
  return (
    <div className="w-full max-w-md">
      <SlidingTabs
        variant="underline"
        aria-label="Account settings"
        items={[
          { value: "account", label: "Account", content: <p className="text-sm text-muted-foreground">Update your name, email and avatar.</p> },
          { value: "password", label: "Password", content: <p className="text-sm text-muted-foreground">Change your password and turn on two-factor sign-in.</p> },
          { value: "notifications", label: "Notifications", content: <p className="text-sm text-muted-foreground">Choose what you hear about, and where.</p> },
          { value: "billing", label: "Billing", disabled: true },
        ]}
      />
    </div>
  );
}

export function Segment() {
  return (
    <SlidingTabs
      variant="segment"
      aria-label="View"
      items={[
        { value: "preview", label: "Preview" },
        { value: "code", label: "Code" },
        { value: "tests", label: "Tests" },
      ]}
    />
  );
}
