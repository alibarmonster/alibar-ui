"use client";

import { FileText, Image as ImageIcon, Music, Video } from "lucide-react";
import { HtmlCanvasDemo } from "@/components/site/html-canvas-demo";
import { DisintegrateDelete, type DisintegrateItem } from "@/components/ui/disintegrate-delete/disintegrate-delete";

const files: DisintegrateItem[] = [
  { id: "brief", title: "Launch brief.pdf", subtitle: "2.4 MB · edited 2 hours ago", icon: <FileText className="size-4" /> },
  { id: "hero", title: "Hero render final_v7.png", subtitle: "8.1 MB · edited yesterday", icon: <ImageIcon className="size-4" /> },
  { id: "teaser", title: "Teaser cut.mp4", subtitle: "112 MB · edited Oct 30", icon: <Video className="size-4" /> },
  { id: "jingle", title: "Sonic logo.wav", subtitle: "3.6 MB · edited Oct 28", icon: <Music className="size-4" /> },
  { id: "notes", title: "Review notes.md", subtitle: "14 KB · edited Oct 21", icon: <FileText className="size-4" /> },
];

export function Default() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => <DisintegrateDelete items={files} label="Files" emptyMessage="All files deleted." rendering={rendering} onModeChange={onModeChange} />}
    </HtmlCanvasDemo>
  );
}

const people: DisintegrateItem[] = [
  { id: "mina", title: "Mina Okafor", subtitle: "Design lead" },
  { id: "theo", title: "Theo Marsh", subtitle: "Engineering" },
  { id: "rina", title: "Rina Halim", subtitle: "Support" },
];

export function SlowDust() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => <DisintegrateDelete items={people} label="Members" dustDuration={2} undoTimeout={8000} rendering={rendering} onModeChange={onModeChange} />}
    </HtmlCanvasDemo>
  );
}
