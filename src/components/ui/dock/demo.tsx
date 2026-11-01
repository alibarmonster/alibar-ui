"use client";

import { Calendar, Camera, Compass, FolderOpen, Mail, MessageCircle, Music, Settings, Terminal } from "lucide-react";
import { Dock } from "@/components/ui/dock/dock";

const APPS = [
  { id: "finder", label: "Files", icon: <FolderOpen />, className: "border-transparent bg-gradient-to-b from-sky-400 to-blue-600 text-white", active: true },
  { id: "safari", label: "Browser", icon: <Compass />, className: "border-transparent bg-gradient-to-b from-cyan-300 to-sky-600 text-white", active: true },
  { id: "mail", label: "Mail", icon: <Mail />, className: "border-transparent bg-gradient-to-b from-blue-400 to-indigo-600 text-white" },
  { id: "messages", label: "Messages", icon: <MessageCircle />, className: "border-transparent bg-gradient-to-b from-emerald-400 to-green-600 text-white", active: true },
  { id: "music", label: "Music", icon: <Music />, className: "border-transparent bg-gradient-to-b from-rose-400 to-red-600 text-white" },
  { id: "photos", label: "Camera", icon: <Camera />, className: "border-transparent bg-gradient-to-b from-amber-300 to-orange-500 text-white" },
  { id: "calendar", label: "Calendar", icon: <Calendar /> },
  { id: "terminal", label: "Terminal", icon: <Terminal />, className: "border-transparent bg-zinc-900 text-zinc-100" },
  { id: "settings", label: "Settings", icon: <Settings />, className: "border-transparent bg-gradient-to-b from-zinc-300 to-zinc-500 text-white" },
];

export function Default() {
  return (
    <div className="@container flex h-52 w-full items-end justify-center overflow-hidden pb-10">
      {/* Nine icons span 516px (about 580px magnified), so scale the dock to the space it actually has. */}
      <Dock
        items={APPS}
        aria-label="Applications"
        className="origin-bottom @max-[20rem]:scale-[0.5] @min-[20rem]:@max-[28rem]:scale-[0.55] @min-[28rem]:@max-[37.5rem]:scale-[0.75]"
      />
    </div>
  );
}

export function Minimal() {
  return (
    <div className="@container flex h-48 w-full items-end justify-center overflow-hidden pb-10">
      <Dock
        className="origin-bottom @max-[20rem]:scale-[0.8]"
        iconSize={40}
        magnification={1.5}
        items={APPS.slice(0, 6).map(({ id, label, icon }) => ({ id, label, icon }))}
        aria-label="Shortcuts"
      />
    </div>
  );
}
