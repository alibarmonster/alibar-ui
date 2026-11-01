"use client";

import { Circle, Diamond, Hexagon, Hourglass, Octagon, Pentagon, Square, Triangle } from "lucide-react";
import { DraggableMarquee } from "@/components/ui/draggable-marquee/draggable-marquee";

const QUOTES = [
  { quote: "Cut our UI review time in half.", name: "Maya Chen", role: "Design lead, Northwind" },
  { quote: "The motion feels expensive but costs nothing.", name: "Omar Haddad", role: "Staff engineer, Halcyon" },
  { quote: "Copy, paste, ship. That's the whole pitch.", name: "Lena Fischer", role: "Founder, Fieldnote" },
  { quote: "Accessible by default is rarer than it should be.", name: "Kenji Sato", role: "iOS lead, Kestrel" },
  { quote: "Our landing page finally feels alive.", name: "Ana Ruiz", role: "Marketing, Lumen" },
];

export function Default() {
  return (
    <DraggableMarquee aria-label="Testimonials" className="w-full max-w-3xl py-2" speed={36} showControls>
      {QUOTES.map((q) => (
        <figure key={q.name} className="w-64 rounded-xl border border-border bg-card p-4 shadow-xs">
          <blockquote className="text-sm leading-6 text-foreground">“{q.quote}”</blockquote>
          <figcaption className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{q.name}</span> · {q.role}
          </figcaption>
        </figure>
      ))}
    </DraggableMarquee>
  );
}

const LOGOS = [
  { name: "Northwind", Icon: Triangle },
  { name: "Halcyon", Icon: Circle },
  { name: "Fieldnote", Icon: Square },
  { name: "Kestrel", Icon: Diamond },
  { name: "Lumen", Icon: Hexagon },
  { name: "Orbital", Icon: Octagon },
  { name: "Vertex", Icon: Pentagon },
  { name: "Tempo", Icon: Hourglass },
];

function Wordmark({ name, Icon }: (typeof LOGOS)[number]) {
  return (
    <span className="flex items-center gap-2 px-2 text-lg font-semibold tracking-tight text-muted-foreground">
      <Icon className="size-5" strokeWidth={2.4} aria-hidden="true" />
      {name}
    </span>
  );
}

export function TwoRows() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <DraggableMarquee aria-label="Customers" speed={30}>
        {LOGOS.map((logo) => (
          <Wordmark key={logo.name} {...logo} />
        ))}
      </DraggableMarquee>
      <DraggableMarquee aria-label="More customers" speed={30} direction="right" gap={24}>
        {[...LOGOS].reverse().map((logo) => (
          <Wordmark key={logo.name} {...logo} />
        ))}
      </DraggableMarquee>
    </div>
  );
}
