"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { BarChart3, BookOpen, Bot, Boxes, Cable, LifeBuoy, Lock, Newspaper, Plug, Sparkles, Workflow } from "lucide-react";
import type { NavAction, NavItem, NavLink } from "@/lib/nav/types";

/** Demo-only data and a scrolling sample page for the navbar previews. Fictional brand "Kite". */

export function KiteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "size-5"} aria-hidden="true">
      <path d="M12 2l8 9-8 11-8-11z" fill="currentColor" opacity="0.35" />
      <path d="M12 2l8 9h-16z" fill="currentColor" />
    </svg>
  );
}

/** `inherit` takes the text color from the navbar, for navbars that recolor when a menu opens. */
export function KiteBrand({ dark = false, inherit = false }: { dark?: boolean; inherit?: boolean }) {
  return (
    <a href="#" onClick={(e) => e.preventDefault()} className={`flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring ${inherit ? "" : dark ? "text-white" : "text-[#0b0b0c]"}`}>
      <KiteMark className={inherit || dark ? "size-5" : "size-5 text-[#2563eb]"} />
      Kite
    </a>
  );
}

export const productLinks: NavLink[] = [
  { label: "Agent notebooks", href: "#", description: "Explore data with an assistant beside you.", icon: <Bot /> },
  { label: "Dashboards", href: "#", description: "Share live views with your whole team.", icon: <BarChart3 /> },
  { label: "Workflows", href: "#", description: "Automate the busywork between tools.", icon: <Workflow /> },
  { label: "Integrations", href: "#", description: "Connect the stack you already use.", icon: <Plug /> },
];

export const capabilityLinks: NavLink[] = [
  { label: "Data apps", href: "#", description: "Turn analyses into tools anyone can use.", icon: <Boxes /> },
  { label: "Embedded analytics", href: "#", description: "Ship charts inside your own product.", icon: <Cable /> },
  { label: "Governance", href: "#", description: "Permissions, audit and SSO built in.", icon: <Lock /> },
];

export const resourceLinks: NavLink[] = [
  { label: "Docs", href: "#", description: "Guides and API reference.", icon: <BookOpen /> },
  { label: "Blog", href: "#", description: "Product news and stories.", icon: <Newspaper /> },
  { label: "Changelog", href: "#", description: "Every release, every week.", icon: <Sparkles /> },
  { label: "Support", href: "#", description: "We reply within a day.", icon: <LifeBuoy /> },
];

export const navItems: NavItem[] = [
  { label: "Product", items: productLinks },
  { label: "Resources", items: resourceLinks },
  { label: "Customers", href: "#" },
  { label: "Pricing", href: "#" },
];

export const navActions: NavAction[] = [
  { label: "Sign in", href: "#" },
  { label: "Get started", href: "#" },
];

/** A scrolling sample page; the navbar sits at its top and can read its scroll. `image` puts a photo behind the hero (implies dark). */
/** Stippled noise in clumps, like a dithered photo, to show off frosted navbars. */
const STIPPLE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='1' seed='4'/><feColorMatrix values='0 0 0 0 0.12  0 0 0 0 0.12  0 0 0 0 0.12  0 0 0 -3 1.35'/></filter><rect width='240' height='240' filter='url(#n)'/></svg>",
)}")`;

export function NavbarStage({ children, dark = false, height = 460, image, texture = false }: { children: (scroll: RefObject<HTMLDivElement | null>) => ReactNode; dark?: boolean; height?: number; image?: string; texture?: boolean }) {
  const scroll = useRef<HTMLDivElement>(null);
  dark = dark || !!image;
  return (
    <div ref={scroll} className="relative w-full overflow-y-auto rounded-xl border border-border" style={{ height }} onClick={(e) => (e.target as HTMLElement).closest("a[href='#']") && e.preventDefault()}>
      <div className={dark ? "relative min-h-[1400px] bg-[linear-gradient(180deg,#0b1a33,#13294b_45%,#0b0f17)] text-white" : texture ? "relative min-h-[1400px] bg-white text-[#0b0b0c]" : "min-h-[1400px] bg-[radial-gradient(70%_50%_at_50%_0%,#dbeafe,#ffffff_70%)] text-[#0b0b0c]"}>
        {texture ? <div aria-hidden="true" className="absolute inset-0 [mask-image:radial-gradient(40%_30%_at_25%_8%,#000,transparent),radial-gradient(35%_40%_at_80%_30%,#000,transparent),radial-gradient(50%_25%_at_50%_70%,#000,transparent)]" style={{ backgroundImage: STIPPLE }} /> : null}
        {image ? <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[640px] bg-cover bg-center [mask-image:linear-gradient(#000_70%,transparent)]" style={{ backgroundImage: `url(${image})` }} /> : null}
        {children(scroll)}
        <div className="relative mx-auto max-w-2xl px-6 pt-20 text-center">
          <p className="text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-tight">Analytics your whole team can fly.</p>
          <p className={dark ? "mt-3 text-white/70" : "mt-3 text-[#52525b]"}>Scroll this panel to see how the navbar behaves.</p>
        </div>
        <div className="relative mx-auto mt-16 grid max-w-3xl gap-4 px-6 sm:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className={dark ? "h-32 rounded-xl bg-white/5" : "h-32 rounded-xl bg-[#f4f4f5]"} />
          ))}
        </div>
      </div>
    </div>
  );
}
