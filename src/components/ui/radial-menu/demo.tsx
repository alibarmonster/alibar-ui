"use client";

import { useState } from "react";
import { Camera, FileText, Image as ImageIcon, MapPin, Mic, Music, Pencil, Share2, Star, Video } from "lucide-react";
import { RadialMenu } from "@/components/ui/radial-menu/radial-menu";

export function Default() {
  const [chosen, setChosen] = useState<string | null>(null);
  const items = [
    { id: "camera", label: "Camera", icon: <Camera /> },
    { id: "photo", label: "Photo", icon: <ImageIcon /> },
    { id: "note", label: "Note", icon: <FileText /> },
    { id: "voice", label: "Voice memo", icon: <Mic /> },
    { id: "place", label: "Location", icon: <MapPin /> },
  ].map((item) => ({ ...item, onSelect: () => setChosen(item.label) }));

  return (
    <div className="flex h-64 w-full flex-col items-center justify-end gap-6 pb-2">
      <RadialMenu items={items} label="Create" radius={92} />
      <p className="h-5 text-[13px] text-muted-foreground">{chosen ? `Created a ${chosen.toLowerCase()}` : "Open the menu"}</p>
    </div>
  );
}

export function Corner() {
  return (
    <div className="relative h-64 w-full max-w-sm">
      <div className="absolute right-4 bottom-4">
        <RadialMenu
          label="Quick actions"
          startAngle={180}
          endAngle={270}
          radius={96}
          icon={<Pencil />}
          items={[
            { id: "draft", label: "Draft", icon: <FileText /> },
            { id: "share", label: "Share", icon: <Share2 /> },
            { id: "star", label: "Favorite", icon: <Star /> },
          ]}
        />
      </div>
    </div>
  );
}

export function FullCircle() {
  return (
    <div className="flex h-72 w-full items-center justify-center">
      <RadialMenu
        label="Media"
        startAngle={-90}
        endAngle={270}
        radius={84}
        items={[
          { id: "photo", label: "Photo", icon: <ImageIcon /> },
          { id: "video", label: "Video", icon: <Video /> },
          { id: "music", label: "Music", icon: <Music /> },
          { id: "voice", label: "Voice", icon: <Mic /> },
          { id: "camera", label: "Camera", icon: <Camera /> },
          { id: "place", label: "Place", icon: <MapPin /> },
        ]}
      />
    </div>
  );
}
