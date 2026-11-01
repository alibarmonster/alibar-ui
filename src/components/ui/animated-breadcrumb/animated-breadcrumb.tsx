"use client";

import { useState, type ComponentProps, type ElementType, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DropdownMenu } from "radix-ui";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { duration, ease, overlayVariants, spring } from "@/lib/motion";

export interface BreadcrumbItem {
  /** Visible text. */
  label: string;
  /** Destination; the last item is the current page and is never a link. */
  href?: string;
  /** Icon before the label. */
  icon?: ReactNode;
}

export interface AnimatedBreadcrumbProps
  extends Omit<ComponentProps<"nav">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Trail from the root to the current page. */
  items: BreadcrumbItem[];
  /** Above this many items, the middle ones collapse into a menu. @default 4 */
  maxItems?: number;
  /** Separator between items. @default <ChevronRight /> */
  separator?: ReactNode;
  /** Link component, e.g. Next.js Link. @default "a" */
  linkComponent?: ElementType;
  /** Called when an item (including one in the overflow menu) is clicked. */
  onNavigate?: (item: BreadcrumbItem, index: number, event: MouseEvent<HTMLElement>) => void;
}

type Entry = { kind: "item"; item: BreadcrumbItem; index: number } | { kind: "overflow"; items: { item: BreadcrumbItem; index: number }[] };

export function AnimatedBreadcrumb({
  items,
  maxItems = 4,
  separator,
  linkComponent: Link = "a",
  onNavigate,
  className,
  "aria-label": ariaLabel = "Breadcrumb",
  ...props
}: AnimatedBreadcrumbProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const indexed = items.map((item, index) => ({ item, index }));

  // Keep the root and the last (maxItems − 2) items; everything in between goes into the menu.
  const tail = Math.max(maxItems - 2, 1);
  const entries: Entry[] =
    items.length > maxItems
      ? [
          { kind: "item", ...indexed[0] },
          { kind: "overflow", items: indexed.slice(1, items.length - tail) },
          ...indexed.slice(items.length - tail).map((e) => ({ kind: "item" as const, ...e })),
        ]
      : indexed.map((e) => ({ kind: "item" as const, ...e }));

  const enter = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8, filter: "blur(3px)" },
    animate: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: reduceMotion ? 0 : -4, filter: "blur(0px)", transition: { duration: duration.instant } },
  };

  const sep = (
    <span aria-hidden="true" className="flex text-muted-foreground/60 [&_svg]:size-3.5">
      {separator ?? <ChevronRight />}
    </span>
  );

  return (
    <nav aria-label={ariaLabel} className={className} {...props}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        <AnimatePresence mode="popLayout" initial={false}>
          {entries.map((entry, position) => {
            const key = entry.kind === "overflow" ? "overflow" : `${entry.index}:${entry.item.label}`;
            const isLast = entry.kind === "item" && entry.index === items.length - 1;
            return (
              <motion.li
                key={key}
                layout={!reduceMotion}
                {...enter}
                transition={{ duration: duration.base, ease: ease.out, layout: spring.smooth }}
                className="flex items-center gap-1.5"
              >
                {position > 0 ? sep : null}
                {entry.kind === "overflow" ? (
                  <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenu.Trigger
                      aria-label={`Show ${entry.items.length} more`}
                      className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors after:absolute after:-inset-1.5 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent relative"
                    >
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </DropdownMenu.Trigger>
                    <AnimatePresence>
                      {menuOpen ? (
                        <DropdownMenu.Portal forceMount>
                          <DropdownMenu.Content forceMount asChild align="start" sideOffset={6} collisionPadding={8}>
                            <motion.div
                              variants={overlayVariants(reduceMotion)}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              style={{ transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)" }}
                              className="z-50 min-w-44 rounded-[10px] border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none"
                            >
                              {entry.items.map(({ item, index }) => (
                                <DropdownMenu.Item key={`${index}:${item.label}`} asChild>
                                  <Link
                                    href={item.href}
                                    onClick={(event: MouseEvent<HTMLElement>) => onNavigate?.(item, index, event)}
                                    className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm text-foreground outline-none data-[highlighted]:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground"
                                  >
                                    {item.icon}
                                    {item.label}
                                  </Link>
                                </DropdownMenu.Item>
                              ))}
                            </motion.div>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      ) : null}
                    </AnimatePresence>
                  </DropdownMenu.Root>
                ) : isLast ? (
                  <span aria-current="page" className="flex items-center gap-1.5 font-medium text-foreground [&_svg]:size-4">
                    {entry.item.icon}
                    {entry.item.label}
                  </span>
                ) : (
                  <Link
                    href={entry.item.href}
                    onClick={(event: MouseEvent<HTMLElement>) => onNavigate?.(entry.item, entry.index, event)}
                    className="flex items-center gap-1.5 rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
                  >
                    {entry.item.icon}
                    {entry.item.label}
                  </Link>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </nav>
  );
}
