"use client";

import { studioProjects } from "@/components/site/studio-images";
import { CrumpleNotes, type CrumpleNote } from "@/components/ui/crumple-notes/crumple-notes";

const photo = studioProjects.find((p) => p.id === "salt-flats")?.src;

const notes: CrumpleNote[] = [
  { id: "polaroid", title: "Salt flats", body: "First light, no wind. Go back in spring.", image: photo, date: "Oct 2026" },
  { id: "launch", title: "Launch day", body: "Check the onboarding copy one more time. Bring snacks for the team. Don't touch prod after 4pm.", date: "Mon, 9 Nov" },
  { id: "idea", title: "Idea", body: "What if the hero was a desktop? Icons you can drag, windows you can open. Retro but in our colors.", date: "Thu, 5 Nov" },
  { id: "call", title: "Call Maya", body: "About the spring presets. Ask if the bouncy one is too much for the progress bar.", date: "Sun, 1 Nov" },
  { id: "groceries", title: "Groceries", body: "Oat milk, lemons, coffee beans (the good ones), basil, rice, eggs, something sweet.", date: "Tue, 3 Nov" },
];

export function Desk() {
  return <CrumpleNotes notes={notes} />;
}

export function KraftPaper() {
  return <CrumpleNotes paperColor="#e8d5b5" inkColor="#3b2a1a" className="bg-[#d9cfc2]" />;
}

export function Default() {
  return <CrumpleNotes />;
}
