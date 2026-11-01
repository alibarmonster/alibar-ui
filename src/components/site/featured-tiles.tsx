"use client";

import { useEffect, useState } from "react";
import { Bell, Camera, Compass, FolderOpen, Mail, MessageCircle, Moon, Music, Settings, Timer, Trash2, Wifi } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart/area-chart";
import { ChatBubbles, type ChatMessage } from "@/components/ui/chat-bubbles/chat-bubbles";
import { Dock } from "@/components/ui/dock/dock";
import { DotGrid } from "@/components/ui/dot-grid/dot-grid";
import { DynamicIsland } from "@/components/ui/dynamic-island/dynamic-island";
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button/hold-to-confirm-button";
import { OtpInput } from "@/components/ui/otp-input/otp-input";
import { SpringSwitch } from "@/components/ui/spring-switch/spring-switch";
import { ThinkingStates } from "@/components/ui/thinking-states/thinking-states";
import { TiltCard } from "@/components/ui/tilt-card/tilt-card";
import { WordRotator } from "@/components/ui/word-rotator/word-rotator";

const APPS = [
  { id: "files", label: "Files", icon: <FolderOpen />, className: "border-transparent bg-gradient-to-b from-sky-400 to-blue-600 text-white", active: true },
  { id: "browser", label: "Browser", icon: <Compass />, className: "border-transparent bg-gradient-to-b from-cyan-300 to-sky-600 text-white", active: true },
  { id: "mail", label: "Mail", icon: <Mail />, className: "border-transparent bg-gradient-to-b from-blue-400 to-indigo-600 text-white" },
  { id: "messages", label: "Messages", icon: <MessageCircle />, className: "border-transparent bg-gradient-to-b from-emerald-400 to-green-600 text-white" },
  { id: "music", label: "Music", icon: <Music />, className: "border-transparent bg-gradient-to-b from-rose-400 to-red-600 text-white" },
  { id: "camera", label: "Camera", icon: <Camera />, className: "border-transparent bg-gradient-to-b from-amber-300 to-orange-500 text-white" },
  { id: "settings", label: "Settings", icon: <Settings />, className: "border-transparent bg-gradient-to-b from-zinc-300 to-zinc-500 text-white" },
];

export function DockTile() {
  return (
    <div className="@container flex h-full w-full items-end justify-center pb-6">
      <Dock items={APPS} aria-label="Applications" className="origin-bottom @max-[26rem]:scale-[0.6] @min-[26rem]:@max-[34rem]:scale-[0.8]" />
    </div>
  );
}

export function RotatorTile() {
  return (
    <p className="px-6 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
      Design systems for <WordRotator words={["startups", "agencies", "enterprise", "everyone"]} className="text-primary" />
    </p>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ChartTile() {
  return (
    <div className="w-full px-5 pt-4">
      <AreaChart
        label="Visitors by device"
        labels={MONTHS}
        height={190}
        series={[
          { id: "desktop", label: "Desktop", values: [4200, 4630, 5120, 4980, 5610, 6020, 5840, 6410, 6930, 7280, 7650, 8120] },
          { id: "mobile", label: "Mobile", values: [3100, 3480, 3920, 4410, 4880, 5530, 6120, 6680, 7310, 7920, 8540, 9260] },
        ]}
      />
    </div>
  );
}

export function TiltTile() {
  return (
    <TiltCard className="aspect-[1.586] w-full max-w-64 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 p-5 text-white shadow-xl">
      <div className="flex h-full flex-col justify-between [transform:translateZ(30px)]">
        <div className="flex items-start justify-between">
          <span className="h-6 w-9 rounded-md bg-gradient-to-br from-amber-200 to-amber-500" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-wide">alibar</span>
        </div>
        <p className="font-mono text-sm tracking-[0.16em] tabular-nums">4021 •••• 7718</p>
      </div>
    </TiltCard>
  );
}

const SETTINGS = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi, on: true },
  { id: "focus", label: "Focus", icon: Moon, on: false },
  { id: "alerts", label: "Alerts", icon: Bell, on: true },
];

export function SwitchTile() {
  return (
    <ul className="w-full max-w-60 divide-y divide-border rounded-xl border border-border bg-background shadow-xs">
      {SETTINGS.map(({ id, label, icon: Icon, on }) => (
        <li key={id} className="flex items-center gap-3 px-3 py-2.5">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          <label htmlFor={`tile-${id}`} className="flex-1 cursor-pointer text-sm font-medium text-foreground">
            {label}
          </label>
          <SpringSwitch id={`tile-${id}`} defaultChecked={on} />
        </li>
      ))}
    </ul>
  );
}

export function HoldTile() {
  return (
    <HoldToConfirmButton icon={<Trash2 aria-hidden="true" />} confirmedLabel="Deleted">
      Hold to delete
    </HoldToConfirmButton>
  );
}

const STAGES = ["Reading the question", "Searching 1,284 docs", "Writing the answer"];

export function ThinkingTile() {
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  // Loops: finish after the last stage, rest a moment, then start over.
  useEffect(() => {
    const finish = window.setTimeout(() => setDone(true), STAGES.length * 1500 + 400);
    const restart = window.setTimeout(() => {
      setDone(false);
      setRun((r) => r + 1);
    }, STAGES.length * 1500 + 2800);
    return () => {
      window.clearTimeout(finish);
      window.clearTimeout(restart);
    };
  }, [run]);
  return <ThinkingStates key={run} stages={STAGES} interval={1500} done={done} doneLabel="Answered" className="px-6" />;
}

export function OtpTile() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  return (
    <div className="flex flex-col items-center gap-3">
      <OtpInput
        length={4}
        value={code}
        status={status}
        aria-label="Verification code"
        onValueChange={(next) => {
          setCode(next);
          if (status !== "idle") setStatus("idle");
        }}
        onComplete={(next) => {
          setStatus(next === "2468" ? "success" : "error");
          if (next !== "2468") return;
          window.setTimeout(() => {
            setCode("");
            setStatus("idle");
          }, 1600);
        }}
      />
      <p className="text-xs text-muted-foreground">Try 2468</p>
    </div>
  );
}

type IslandView = "idle" | "timer" | "music";
const ISLAND_ORDER: IslandView[] = ["idle", "timer", "music"];

export function IslandTile() {
  const [view, setView] = useState<IslandView>("timer");
  useEffect(() => {
    const id = window.setTimeout(() => setView(ISLAND_ORDER[(ISLAND_ORDER.indexOf(view) + 1) % ISLAND_ORDER.length]), 2600);
    return () => window.clearTimeout(id);
  }, [view]);
  return (
    <DynamicIsland view={view} aria-label="Live activity">
      {view === "timer" ? (
        <div className="flex h-9 w-48 items-center justify-between px-3">
          <Timer className="size-4 text-amber-400" aria-hidden="true" />
          <span className="font-mono text-sm text-amber-400 tabular-nums">04:12</span>
        </div>
      ) : view === "music" ? (
        <div className="flex h-9 w-52 items-center justify-between px-2">
          <span className="size-6 rounded-md bg-gradient-to-br from-rose-400 to-violet-600" aria-hidden="true" />
          <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
            {[0.5, 1, 0.7, 0.9].map((h, i) => (
              <span key={i} className="w-0.5 rounded-full bg-rose-400" style={{ height: `${h * 100}%` }} />
            ))}
          </span>
        </div>
      ) : undefined}
    </DynamicIsland>
  );
}

export function DotGridTile() {
  return (
    <DotGrid className="flex size-full items-center justify-center">
      <p className="pointer-events-none text-center text-xl font-semibold tracking-tight text-foreground">Backgrounds that respond</p>
    </DotGrid>
  );
}

const SCRIPT: Omit<ChatMessage, "id">[] = [
  { role: "user", content: "Can you move my 3pm with Lena?" },
  { role: "assistant", content: "She’s free at 4:30 today or 10:00 tomorrow." },
  { role: "user", content: "Tomorrow at 10 works." },
  { role: "assistant", content: "Done. Invite sent for tomorrow at 10:00." },
];

export function ChatTile() {
  const [count, setCount] = useState(1);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (count >= SCRIPT.length) {
      const reset = window.setTimeout(() => setCount(1), 3200);
      return () => window.clearTimeout(reset);
    }
    const assistant = SCRIPT[count].role === "assistant";
    const t1 = window.setTimeout(() => setTyping(assistant), 700);
    const t2 = window.setTimeout(() => {
      setTyping(false);
      setCount((c) => c + 1);
    }, assistant ? 2000 : 1200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [count]);
  return (
    <div className="flex h-full w-full max-w-sm flex-col justify-end px-5 pb-5">
      <ChatBubbles messages={SCRIPT.slice(0, count).map((m, i) => ({ ...m, id: String(i) }))} typing={typing} />
    </div>
  );
}
