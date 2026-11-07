"use client";

import { studioPeople } from "@/components/site/studio-images";
import { ClotheslineCards, type ClotheslinePerson } from "@/components/ui/clothesline-cards/clothesline-cards";

const people: ClotheslinePerson[] = studioPeople.map((p) => ({
  id: p.id,
  name: p.name,
  role: p.role,
  portrait: p.portrait,
  bio: p.bio,
  skills: p.skills,
  links: [
    { label: "Selected work", href: "#" },
    { label: "Say hello", href: "#" },
  ],
}));

export function Studio() {
  return (
    <ClotheslineCards
      people={people.slice(0, 6)}
      eyebrow="People / 2026"
      title="Fourteen people,"
      accentTitle="one long line."
      description="We hang our work out to dry before it ships. Pull a card to give it a swing, or flip it to read the back."
      total={14}
    />
  );
}

export function FullLine() {
  return <ClotheslineCards people={people} eyebrow="Everyone" title="The whole crew," accentTitle="clipped in." total={people.length} />;
}

export function Default() {
  return <ClotheslineCards />;
}
