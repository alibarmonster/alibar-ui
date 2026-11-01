"use client";

import { useState } from "react";
import { Activity, Bell, Bookmark, ChartColumn, Heart, House, Inbox, LayoutGrid, Search, Settings, User } from "lucide-react";
import { LensTabBar, lensPanelId, lensTabId, type LensTab } from "@/components/ui/lens-tab-bar/lens-tab-bar";

export function MobileBar() {
  const [value, setValue] = useState("home");
  const [unread, setUnread] = useState(3);
  const tabs: LensTab[] = [
    { value: "home", label: "Home", icon: <House />, activeIcon: <House className="fill-current" /> },
    { value: "search", label: "Search", icon: <Search /> },
    { value: "inbox", label: "Inbox", icon: <Inbox />, activeIcon: <Inbox className="fill-current/20" />, badge: unread, badgeLabel: `${unread} unread` },
    { value: "profile", label: "Profile", icon: <User />, activeIcon: <User className="fill-current" /> },
  ];
  return (
    <div className="flex h-[26rem] w-[22rem] max-w-full flex-col overflow-hidden rounded-[2rem] border border-border bg-surface">
      {tabs.map((tab) => (
        <div key={tab.value} role="tabpanel" id={lensPanelId("phone", tab.value)} aria-labelledby={lensTabId("phone", tab.value)} hidden={tab.value !== value} className="flex-1 p-6">
          <p className="text-lg font-semibold tracking-tight text-foreground">{tab.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">Drag the lens, or use the arrow keys.</p>
          {tab.value === "inbox" ? (
            <button type="button" onClick={() => setUnread((n) => n + 1)} className="mt-4 h-9 cursor-pointer rounded-full border border-border bg-background px-3 text-sm">
              Simulate a new message
            </button>
          ) : null}
        </div>
      ))}
      <div className="flex justify-center px-4 pb-4">
        <LensTabBar id="phone" tabs={tabs} value={value} onValueChange={setValue} label="App sections" />
      </div>
    </div>
  );
}

export function AllLabels() {
  const [value, setValue] = useState("overview");
  const tabs: LensTab[] = [
    { value: "overview", label: "Overview", icon: <LayoutGrid />, activeIcon: <LayoutGrid className="fill-current" /> },
    { value: "activity", label: "Activity", icon: <Activity /> },
    { value: "reports", label: "Reports", icon: <ChartColumn /> },
    { value: "settings", label: "Settings", icon: <Settings /> },
  ];
  return <LensTabBar tabs={tabs} value={value} onValueChange={setValue} labels="always" label="Dashboard" />;
}

export function IconsOnly() {
  const [value, setValue] = useState("home");
  const tabs: LensTab[] = [
    { value: "home", label: "Home", icon: <House />, activeIcon: <House className="fill-current" /> },
    { value: "likes", label: "Likes", icon: <Heart />, activeIcon: <Heart className="fill-current" /> },
    { value: "alerts", label: "Alerts", icon: <Bell />, activeIcon: <Bell className="fill-current" />, badge: 12, badgeLabel: "12 new alerts" },
    { value: "saved", label: "Saved", icon: <Bookmark />, activeIcon: <Bookmark className="fill-current" /> },
    { value: "settings", label: "Settings", icon: <Settings /> },
  ];
  return <LensTabBar tabs={tabs} value={value} onValueChange={setValue} labels="none" label="Shortcuts" />;
}
