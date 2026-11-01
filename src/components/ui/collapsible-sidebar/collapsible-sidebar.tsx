"use client";

import { useId, useState, type ComponentProps, type ElementType, type FocusEvent, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export interface SidebarItem {
  /** Unique id. */
  id: string;
  /** Label; hidden when collapsed but always the accessible name. */
  label: string;
  /** Icon shown in both states. */
  icon: ReactNode;
  /** Destination. Without it the item renders as a button. */
  href?: string;
  /** Small count or tag after the label, hidden when collapsed. */
  badge?: ReactNode;
}

export interface SidebarSection {
  /** Heading above the items; a divider stands in for it when collapsed. */
  title?: string;
  /** Items in the section. */
  items: SidebarItem[];
}

export interface CollapsibleSidebarProps
  extends Omit<ComponentProps<"aside">, "children" | "onSelect" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Navigation sections. */
  sections: SidebarSection[];
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Initial collapsed state when uncontrolled. @default false */
  defaultCollapsed?: boolean;
  /** Called when the sidebar collapses or expands. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Id of the current item. */
  activeId?: string;
  /** Called when an item is chosen. */
  onSelect?: (id: string, event: MouseEvent<HTMLElement>) => void;
  /** Brand shown at the top: an icon that stays, and a name that fades. */
  brand?: { icon: ReactNode; name: string };
  /** Link component for items with href, e.g. Next.js Link. @default "a" */
  linkComponent?: ElementType;
}

const LAYOUT = { type: "spring", stiffness: 380, damping: 38 } as const;

export function CollapsibleSidebar({
  sections,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  activeId,
  onSelect,
  brand,
  linkComponent: Link = "a",
  className,
  "aria-label": ariaLabel = "Sidebar",
  ...props
}: CollapsibleSidebarProps) {
  const [internal, setInternal] = useState(defaultCollapsed);
  const isCollapsed = collapsed ?? internal;
  const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const navId = useId();
  const groupId = useId();
  const layout = reduceMotion ? { duration: 0 } : LAYOUT;

  // The nav scrolls, so it can't let a tooltip overflow; collapsed labels render in a portal instead.
  const showTip = (labelText: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setTip({ label: labelText, x: rect.right + 12, y: rect.top + rect.height / 2 });
  };

  const toggle = () => {
    setTip(null);
    if (collapsed === undefined) setInternal(!isCollapsed);
    onCollapsedChange?.(!isCollapsed);
  };

  // Labels vanish quickly before the sidebar narrows, and fade back in once it has widened.
  const label = {
    initial: { opacity: 0, x: reduceMotion ? 0 : -4 },
    animate: { opacity: 1, x: 0, transition: { duration: duration.quick, ease: ease.out, delay: reduceMotion ? 0 : 0.08 } },
    exit: { opacity: 0, transition: { duration: duration.instant } },
  };

  return (
    <motion.aside
      layout
      transition={layout}
      data-collapsed={isCollapsed || undefined}
      className={cn(
        "group/sidebar flex h-full shrink-0 flex-col border-r border-border bg-background",
        isCollapsed ? "w-[3.75rem]" : "w-60",
        className,
      )}
      {...props}
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-3.5">
        {brand ? (
          <>
            <motion.span layout="position" transition={layout} className="flex size-8 shrink-0 items-center justify-center" aria-hidden="true">
              {brand.icon}
            </motion.span>
            <AnimatePresence initial={false}>
              {!isCollapsed ? (
                <motion.span key="brand" {...label} className="truncate text-sm font-semibold text-foreground">
                  {brand.name}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </>
        ) : null}
      </div>

      <nav id={navId} aria-label={ariaLabel} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2.5 pb-2">
        <LayoutGroup id={groupId}>
          {sections.map((section, sectionIndex) => (
            <div key={section.title ?? sectionIndex} className="mt-3 first:mt-1">
              {section.title ? (
                <div className="relative mb-1 flex h-6 items-center px-2">
                  <AnimatePresence initial={false} mode="popLayout">
                    {isCollapsed ? (
                      <motion.span key="divider" {...label} aria-hidden="true" className="block h-px w-full bg-border" />
                    ) : (
                      <motion.p key="title" {...label} className="text-xs font-medium whitespace-nowrap text-muted-foreground">
                        {section.title}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.id === activeId;
                  const Tag = item.href ? Link : "button";
                  return (
                    <li key={item.id} className="group/item relative">
                      <Tag
                        href={item.href}
                        type={item.href ? undefined : "button"}
                        aria-current={active ? "page" : undefined}
                        aria-label={isCollapsed ? item.label : undefined}
                        onClick={(event: MouseEvent<HTMLElement>) => onSelect?.(item.id, event)}
                        onPointerEnter={(event: MouseEvent<HTMLElement>) => isCollapsed && showTip(item.label, event.currentTarget)}
                        onPointerLeave={() => setTip(null)}
                        onFocus={(event: FocusEvent<HTMLElement>) =>
                          isCollapsed && event.currentTarget.matches(":focus-visible") && showTip(item.label, event.currentTarget)
                        }
                        onBlur={() => setTip(null)}
                        className={cn(
                          "relative flex h-9 w-full cursor-pointer items-center gap-3 rounded-md px-2.5 text-sm whitespace-nowrap outline-none",
                          "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-[18px] [&_svg]:shrink-0",
                          active ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                        )}
                      >
                        {active ? (
                          <motion.span
                            layoutId="active-item"
                            aria-hidden="true"
                            transition={reduceMotion ? { duration: 0 } : spring.snappy}
                            className="absolute inset-0 rounded-md bg-accent"
                          />
                        ) : null}
                        <motion.span layout="position" transition={layout} className="relative flex" aria-hidden="true">
                          {item.icon}
                        </motion.span>
                        <AnimatePresence initial={false}>
                          {!isCollapsed ? (
                            <motion.span key="label" {...label} className="relative flex min-w-0 flex-1 items-center gap-2">
                              <span className="truncate">{item.label}</span>
                              {item.badge !== undefined ? (
                                <span className="ml-auto rounded-full bg-muted px-1.5 text-[11px] font-medium text-foreground/65 tabular-nums">
                                  {item.badge}
                                </span>
                              ) : null}
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                      </Tag>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </LayoutGroup>
      </nav>

      {tip && isCollapsed
        ? createPortal(
            <span
              aria-hidden="true"
              className="pointer-events-none fixed z-[60] -translate-y-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background shadow-md"
              style={{ left: tip.x, top: tip.y }}
            >
              {tip.label}
            </span>,
            document.body,
          )
        : null}

      <div className="shrink-0 border-t border-border p-2.5">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!isCollapsed}
          aria-controls={navId}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-9 w-full cursor-pointer items-center gap-3 rounded-md px-2.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-[18px] [&_svg]:shrink-0"
        >
          <motion.span layout="position" transition={layout} className="flex" aria-hidden="true">
            {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </motion.span>
          <AnimatePresence initial={false}>
            {!isCollapsed ? (
              <motion.span key="toggle" {...label} aria-hidden="true">
                Collapse
              </motion.span>
            ) : null}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
