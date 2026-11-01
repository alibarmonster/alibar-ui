"use client";

import { createContext, useContext, useId, useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants, spring } from "@/lib/motion";

interface DropdownState {
  open: boolean;
  active: string | null;
  setActive: (id: string | null) => void;
}

const DropdownContext = createContext<DropdownState>({ open: false, active: null, setActive: () => {} });

export interface OriginDropdownProps extends Omit<ComponentProps<typeof DropdownMenu.Root>, "open" | "defaultOpen" | "onOpenChange"> {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
}

export function OriginDropdown({ open, defaultOpen = false, onOpenChange, children, ...props }: OriginDropdownProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const [active, setActive] = useState<string | null>(null);
  const isOpen = open ?? internal;

  return (
    <DropdownMenu.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (open === undefined) setInternal(next);
        if (!next) setActive(null);
        onOpenChange?.(next);
      }}
      {...props}
    >
      <DropdownContext.Provider value={{ open: isOpen, active, setActive }}>{children}</DropdownContext.Provider>
    </DropdownMenu.Root>
  );
}

/** Wraps your button; pass asChild to use your own element. */
export const OriginDropdownTrigger = DropdownMenu.Trigger;

export interface OriginDropdownContentProps
  extends Omit<ComponentProps<typeof DropdownMenu.Content>, "forceMount" | "asChild"> {
  /** Alignment against the trigger. @default "start" */
  align?: "start" | "center" | "end";
  /** Gap between the trigger and the menu, in px. @default 6 */
  sideOffset?: number;
}

export function OriginDropdownContent({
  align = "start",
  sideOffset = 6,
  className,
  children,
  ...props
}: OriginDropdownContentProps) {
  const { open } = useContext(DropdownContext);
  const reduceMotion = useReducedMotion();
  const groupId = useId();

  return (
    <AnimatePresence>
      {open ? (
        <DropdownMenu.Portal forceMount>
          <DropdownMenu.Content forceMount asChild align={align} sideOffset={sideOffset} collisionPadding={8} {...props}>
            <motion.div
              variants={overlayVariants(reduceMotion)}
              initial="hidden"
              animate="visible"
              exit="exit"
              // Radix computes the trigger-relative origin, so the menu grows out of whatever opened it.
              style={{ transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)" }}
              className={cn(
                "z-50 min-w-52 overflow-hidden rounded-[10px] border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none",
                className,
              )}
            >
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.025, delayChildren: 0.03 } } }}
              >
                <LayoutGroup id={groupId}>{children}</LayoutGroup>
              </motion.div>
            </motion.div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      ) : null}
    </AnimatePresence>
  );
}

const itemEnter = {
  hidden: { opacity: 0, y: -3 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.quick, ease: ease.out } },
};

export interface OriginDropdownItemProps
  extends Omit<ComponentProps<typeof DropdownMenu.Item>, "asChild" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Icon before the label. */
  icon?: ReactNode;
  /** Keyboard shortcut hint at the end, e.g. "⌘K". */
  shortcut?: string;
  /** Style the item as destructive. @default false */
  destructive?: boolean;
}

export function OriginDropdownItem({
  icon,
  shortcut,
  destructive = false,
  className,
  children,
  onFocus,
  onBlur,
  ...props
}: OriginDropdownItemProps) {
  const { active, setActive } = useContext(DropdownContext);
  const reduceMotion = useReducedMotion();
  const id = useId();

  return (
    <DropdownMenu.Item
      asChild
      // Radix focuses items on hover and arrow keys; focus drives the gliding highlight.
      onFocus={(event) => {
        onFocus?.(event);
        setActive(id);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (active === id) setActive(null);
      }}
      {...props}
    >
      <motion.div
        variants={itemEnter}
        className={cn(
          "relative flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
          destructive ? "text-destructive" : "text-foreground",
          className,
        )}
      >
        {active === id ? (
          <motion.span
            layoutId="highlight"
            aria-hidden="true"
            transition={reduceMotion ? { duration: 0 } : spring.snappy}
            className={cn("absolute inset-0 rounded-md", destructive ? "bg-destructive/10" : "bg-accent")}
          />
        ) : null}
        {icon ? <span className={cn("relative flex", destructive ? "" : "text-muted-foreground")}>{icon}</span> : null}
        <span className="relative flex-1 truncate">{children}</span>
        {shortcut ? (
          <kbd className="relative font-sans text-xs tracking-widest text-muted-foreground">{shortcut}</kbd>
        ) : null}
      </motion.div>
    </DropdownMenu.Item>
  );
}

export function OriginDropdownSeparator({ className, ...props }: ComponentProps<typeof DropdownMenu.Separator>) {
  return <DropdownMenu.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function OriginDropdownLabel({ className, ...props }: ComponentProps<typeof DropdownMenu.Label>) {
  return <DropdownMenu.Label className={cn("px-2.5 pt-1.5 pb-1 text-xs font-medium text-muted-foreground", className)} {...props} />;
}
