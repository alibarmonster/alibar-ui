"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { categories, components } from "@/content/components";
import { docsPages } from "@/content/docs-nav";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

function NavLink({
  href,
  active,
  onNavigate,
  children,
  badge,
}: {
  href: string;
  active: boolean;
  onNavigate?: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring relative flex h-8 items-center gap-2 rounded-md px-2.5 text-[13.5px] transition-colors",
        active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {active ? (
        <m.span
          layoutId="sidebar-active"
          transition={reduceMotion ? { duration: 0 } : spring.snappy}
          className="absolute inset-0 rounded-md bg-surface-2"
        />
      ) : null}
      <span className="relative truncate">{children}</span>
      {badge}
    </Link>
  );
}

export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-[18px] shrink-0 items-center rounded-full bg-primary/10 px-1.5 text-[10.5px] font-medium text-[color-mix(in_oklab,var(--primary)_78%,var(--foreground))]",
        className,
      )}
    >
      New
    </span>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const ready = components.filter((c) => c.status === "ready");
  const needle = query.trim().toLowerCase();
  const matches = needle ? ready.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(needle)) : [];

  return (
    <nav aria-label="Documentation" className="space-y-7 pb-10 text-sm">
      <div className="space-y-2">
        <Link
          href="/components"
          onClick={onNavigate}
          className="focus-ring flex h-9 items-center gap-2 rounded-lg bg-surface-2 px-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--surface-2)_80%,var(--foreground)_6%)]"
        >
          <LayoutGrid className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Browse all components
        </Link>
        <label className="relative block">
          <span className="sr-only">Filter components</span>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${ready.length} components…`}
            className="h-9 w-full rounded-lg border border-border bg-background pr-2.5 pl-8 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      {needle ? (
        <div>
          <p className="mb-1.5 px-2.5 text-xs font-medium text-foreground" aria-live="polite">
            {matches.length} {matches.length === 1 ? "match" : "matches"}
          </p>
          <ul className="space-y-px">
            {matches.map((item) => {
              const href = `/components/${item.slug}`;
              return (
                <li key={item.slug}>
                  <NavLink href={href} active={pathname === href} onNavigate={onNavigate} badge={item.isNew ? <NewBadge className="ml-auto" /> : null}>
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className={cn("space-y-7", needle && "hidden")}>
      <div>
        <p className="mb-1.5 px-2.5 text-xs font-medium text-foreground">Getting started</p>
        <ul className="space-y-px">
          {docsPages.map((page) => (
            <li key={page.href}>
              <NavLink href={page.href} active={pathname === page.href} onNavigate={onNavigate}>
                {page.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {categories.map((category, index) => {
        const items = components.filter((c) => c.category === category.id);
        const ready = items.filter((c) => c.status === "ready");
        const planned = items.length - ready.length;
        const startsGroup = category.group !== undefined && category.group !== categories[index - 1]?.group;
        return (
          <div key={category.id}>
            {startsGroup ? (
              <p className="mb-3 px-2.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {category.group}
              </p>
            ) : null}
            <p className="mb-1.5 flex items-center justify-between px-2.5 text-xs font-medium text-foreground">
              {category.group ? (category.navName ?? category.name) : category.name}
              <span className="font-mono text-[11px] font-normal text-muted-foreground tabular-nums">
                {ready.length}/{items.length}
              </span>
            </p>
            <ul className="space-y-px">
              {ready.map((item) => {
                const href = `/components/${item.slug}`;
                return (
                  <li key={item.slug}>
                    <NavLink
                      href={href}
                      active={pathname === href}
                      onNavigate={onNavigate}
                      badge={item.isNew ? <NewBadge className="ml-auto" /> : null}
                    >
                      {item.name}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
            {planned > 0 ? (
              <p className="px-2.5 py-1.5 text-[13px] text-muted-foreground">
                {ready.length ? `${planned} more coming soon` : `${planned} coming soon`}
              </p>
            ) : null}
          </div>
        );
      })}
      </div>
    </nav>
  );
}
