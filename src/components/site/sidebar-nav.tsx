"use client";

import Link from "next/link";
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

  return (
    <nav aria-label="Documentation" className="space-y-7 pb-10 text-sm">
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

      {categories.map((category) => {
        const items = components.filter((c) => c.category === category.id);
        const ready = items.filter((c) => c.status === "ready");
        const planned = items.length - ready.length;
        return (
          <div key={category.id}>
            <p className="mb-1.5 flex items-center justify-between px-2.5 text-xs font-medium text-foreground">
              {category.name}
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
    </nav>
  );
}
