"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface AccordionSection {
  /** Stable identity; also the value reported to onValueChange. */
  id: string;
  /** Header text. */
  title: ReactNode;
  /** Panel content. */
  content: ReactNode;
  /** Icon before the title. */
  icon?: ReactNode;
  /** Can't be opened. */
  disabled?: boolean;
}

export interface BouncyAccordionProps
  extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Sections in order. */
  items: AccordionSection[];
  /** Controlled open section id, or null for none. */
  value?: string | null;
  /** Initially open section when uncontrolled. @default null */
  defaultValue?: string | null;
  /** Called with the newly open section id, or null when everything closes. */
  onValueChange?: (value: string | null) => void;
  /** Allow closing the open section so none is open. @default true */
  collapsible?: boolean;
  /** Heading level wrapping each header button. @default 3 */
  headingLevel?: 2 | 3 | 4;
}

// Height eases in on a heavy, barely-underdamped spring; the content settles with a little bounce.
const HEIGHT = { type: "spring", stiffness: 210, damping: 27, mass: 1.15 } as const;
const SETTLE = { type: "spring", stiffness: 320, damping: 17, mass: 0.9 } as const;

export function BouncyAccordion({
  items,
  value,
  defaultValue = null,
  onValueChange,
  collapsible = true,
  headingLevel = 3,
  className,
  ...props
}: BouncyAccordionProps) {
  const reduceMotion = useReducedMotion();
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const openId = value === undefined ? internal : value;
  const baseId = useId();
  const headers = useRef<(HTMLButtonElement | null)[]>([]);
  const Heading = `h${headingLevel}` as const;

  const toggle = (id: string) => {
    const next = openId === id ? (collapsible ? null : id) : id;
    if (next === openId) return;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  // Arrow keys move between headers (WAI-ARIA accordion pattern).
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
    const at = enabled.indexOf(index);
    const target = {
      ArrowDown: enabled[(at + 1) % enabled.length],
      ArrowUp: enabled[(at - 1 + enabled.length) % enabled.length],
      Home: enabled[0],
      End: enabled[enabled.length - 1],
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    headers.current[target]?.focus();
  };

  return (
    <div className={cn("divide-y divide-border rounded-xl border border-border bg-background", className)} {...props}>
      {items.map((item, index) => {
        const open = openId === item.id;
        const headerId = `${baseId}-h-${index}`;
        const panelId = `${baseId}-p-${index}`;
        return (
          <div key={item.id}>
            <Heading className="m-0">
              <button
                ref={(node) => {
                  headers.current[index] = node;
                }}
                id={headerId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggle(item.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-foreground outline-none transition-colors first:rounded-t-xl hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0"
              >
                {item.icon ? <span className="flex text-muted-foreground [&_svg]:size-[18px]">{item.icon}</span> : null}
                <span className="flex-1">{item.title}</span>
                <motion.span
                  aria-hidden="true"
                  className="flex text-muted-foreground"
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={reduceMotion ? { duration: 0 } : SETTLE}
                >
                  <ChevronDown className="size-4" />
                </motion.span>
              </button>
            </Heading>
            {/* The grid-rows trick sizes the panel to its content without measuring it. */}
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              inert={!open}
              className="grid overflow-hidden"
              initial={false}
              animate={{ gridTemplateRows: open ? "1fr" : "0fr" }}
              transition={reduceMotion ? { duration: 0 } : HEIGHT}
            >
              <div className="min-h-0">
                <motion.div
                  className="px-4 pb-4 text-sm leading-6 text-muted-foreground"
                  initial={false}
                  animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: reduceMotion ? 0 : -10 }}
                  transition={reduceMotion ? { duration: duration.quick } : { ...SETTLE, opacity: { duration: open ? duration.slow : duration.quick } }}
                >
                  {item.content}
                </motion.div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
