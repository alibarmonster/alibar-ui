"use client";

import { pixelScenes, studioProjects } from "@/components/site/studio-images";
import { PaletteDitherField } from "@/components/ui/palette-dither-field/palette-dither-field";
import { RetroDesktopHero, type DesktopWindowConfig } from "@/components/ui/retro-desktop-hero/retro-desktop-hero";

const owner = {
  name: "Alibar",
  role: "Designer & developer",
  location: "Jakarta, ID",
  bio: "I make interfaces that feel physical: springy, tactile and a little playful. Currently building a component library one window at a time.",
  email: "alibar@example.com",
  available: true,
};

const windows: DesktopWindowConfig[] = [
  {
    id: "projects",
    label: "Projects",
    title: "projects.dir",
    icon: "folder",
    width: 500,
    height: 360,
    render: () => (
      <ul className="grid grid-cols-2 gap-3 p-3 @md/window:grid-cols-3">
        {studioProjects.slice(0, 6).map((p) => (
          <li key={p.id} className="text-[12px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- demo stills */}
            <img src={p.src} alt={p.alt} className="aspect-[16/10] w-full border-2 border-[#1d2130] object-cover" />
            <span className="mt-1 block truncate [font-family:var(--font-geist-pixel),monospace]">{p.title}</span>
          </li>
        ))}
      </ul>
    ),
  },
  { id: "resume", label: "Resume", title: "resume.txt", icon: "document" },
  {
    id: "photos",
    label: "Photos",
    title: "photos.img",
    icon: "image",
    width: 500,
    height: 380,
    render: () => (
      <div className="grid gap-2 p-3">
        {pixelScenes.map((scene) => (
          <figure key={scene.id} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- demo pixel art */}
            <img src={scene.src} alt={scene.alt} className="w-40 border-2 border-[#1d2130] [image-rendering:pixelated]" />
            <figcaption className="text-[12px] [font-family:var(--font-geist-pixel),monospace]">{scene.title}</figcaption>
          </figure>
        ))}
      </div>
    ),
  },
  { id: "music", label: "Music", title: "music.app", icon: "music" },
  { id: "terminal", label: "Terminal", title: "terminal", icon: "terminal" },
  { id: "trash", label: "Trash", title: "trash", icon: "trash" },
];

export function Portfolio() {
  return <RetroDesktopHero owner={owner} windows={windows} persistKey="alibar-demo-desktop" />;
}

export function DitherWallpaper() {
  return <RetroDesktopHero owner={owner} persistKey={null} background={<PaletteDitherField palette="midnight" pixelSize={5} scale={0.7} className="size-full" />} />;
}

export function Default() {
  return <RetroDesktopHero />;
}
