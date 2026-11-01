"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Menu, Search } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { GitHubIcon } from "./icons";
import { Kbd } from "./kbd";
import { Logo } from "./logo";

// Both dialogs load the first time they're opened, keeping Radix Dialog and the search index out of every page's initial JS.
const CommandMenu = dynamic(() => import("./command-menu").then((m) => m.CommandMenu), { ssr: false });
const MobileNav = dynamic(() => import("./mobile-nav").then((m) => m.MobileNav), { ssr: false });

const links = [
  { href: "/components", label: "Components" },
  { href: "/docs", label: "Docs" },
];

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

const subscribeNoop = () => () => {};

function useIsMac() {
  return useSyncExternalStore(
    subscribeNoop,
    () => /mac|iphone|ipad/i.test(navigator.userAgent),
    () => true,
  );
}

function HeaderLinks() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav aria-label="Main" className="hidden items-center md:flex" onPointerLeave={() => setHovered(null)}>
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            onPointerEnter={() => setHovered(link.href)}
            onFocus={() => setHovered(link.href)}
            onBlur={() => setHovered(null)}
            className={cn(
              "focus-ring relative inline-flex h-8 items-center rounded-md px-3 text-sm transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {hovered === link.href ? (
              <m.span
                layoutId="header-hover"
                transition={reduceMotion ? { duration: 0 } : spring.snappy}
                className="absolute inset-0 rounded-md bg-surface-2"
              />
            ) : null}
            <span className="relative">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  // Mounted on first use and kept mounted afterwards, so closing still animates.
  const [loaded, setLoaded] = useState({ search: false, nav: false });
  const lastFocus = useRef<HTMLElement | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const isMac = useIsMac();

  const openSearch = () => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setLoaded((l) => (l.search ? l : { ...l, search: true }));
    setSearchOpen(true);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (shortcut || (event.key === "/" && !isEditable(event.target))) {
        event.preventDefault();
        if (!searchOpen) lastFocus.current = document.activeElement as HTMLElement | null;
        setLoaded((l) => (l.search ? l : { ...l, search: true }));
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-4 sm:px-6">
        <button
          ref={menuButton}
          type="button"
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={navOpen}
          onClick={() => {
            setLoaded((l) => (l.nav ? l : { ...l, nav: true }));
            setNavOpen(true);
          }}
          className="focus-ring -ml-2 inline-flex size-10 cursor-pointer items-center justify-center rounded-[10px] text-foreground transition-colors hover:bg-surface-2 md:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        {loaded.nav ? <MobileNav open={navOpen} onOpenChange={setNavOpen} returnFocusRef={menuButton} /> : null}
        <Link href="/" className="focus-ring mr-2 rounded-md" aria-label={`${siteConfig.name} home`}>
          <Logo />
        </Link>
        <Link
          href="/changelog"
          className="focus-ring mr-3 inline-flex h-6 items-center rounded-full border border-border bg-surface px-2 font-mono text-[11px] font-medium text-muted-foreground tabular-nums transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          v{siteConfig.version}
          <span className="sr-only"> changelog</span>
        </Link>
        <HeaderLinks />

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={openSearch}
            aria-haspopup="dialog"
            aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
            className="focus-ring group inline-flex size-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground sm:h-9 sm:w-60 sm:justify-start sm:border sm:border-border sm:bg-surface sm:pr-1.5 sm:pl-3 sm:hover:bg-surface-2"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="sr-only flex-1 text-left text-[13px] sm:not-sr-only">Search components…</span>
            <span className="hidden items-center gap-0.5 sm:flex" aria-hidden="true">
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="focus-ring inline-flex size-10 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground sm:size-9"
          >
            <GitHubIcon className="size-[18px]" />
          </a>
        </div>
      </div>
      {loaded.search ? <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} returnFocusRef={lastFocus} /> : null}
    </header>
  );
}
