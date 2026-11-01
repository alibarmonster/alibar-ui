"use client";

import { Bell, Bold, Home, Italic, Link2, Search, Underline, User } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs/expandable-tabs";

const NOTIFICATIONS = ["Alibar commented on Launch plan", "Deploy #482 finished", "Raka invited you to Design", "Weekly report is ready"];

export function Default() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center">
      <ExpandableTabs
        aria-label="Sections"
        items={[
          {
            value: "home",
            label: "Home",
            icon: <Home />,
            content: <p className="text-sm text-muted-foreground">Good morning. You have 3 tasks due today.</p>,
          },
          {
            value: "search",
            label: "Search",
            icon: <Search />,
            content: (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Recent searches</p>
                {["spring physics", "layout animation"].map((q) => (
                  <p key={q} className="rounded-md bg-muted px-2.5 py-1.5 text-[13px] text-muted-foreground">
                    {q}
                  </p>
                ))}
              </div>
            ),
          },
          {
            value: "inbox",
            label: "Inbox",
            icon: <Bell />,
            content: (
              <ul className="divide-y divide-border text-[13px]">
                {NOTIFICATIONS.map((n) => (
                  <li key={n} className="py-2 text-foreground first:pt-0 last:pb-0">
                    {n}
                  </li>
                ))}
              </ul>
            ),
          },
          {
            value: "profile",
            label: "Profile",
            icon: <User />,
            content: (
              <div className="flex items-center gap-3">
                <span className="size-10 rounded-full bg-gradient-to-br from-sky-300 to-blue-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">Alibar</p>
                  <p className="text-[13px] text-muted-foreground">Product designer</p>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export function Toolbar() {
  return (
    <ExpandableTabs
      tone="dark"
      aria-label="Text style"
      defaultValue="bold"
      items={[
        { value: "bold", label: "Bold", icon: <Bold /> },
        { value: "italic", label: "Italic", icon: <Italic /> },
        { value: "underline", label: "Underline", icon: <Underline /> },
        { value: "link", label: "Link", icon: <Link2 /> },
      ]}
    />
  );
}
