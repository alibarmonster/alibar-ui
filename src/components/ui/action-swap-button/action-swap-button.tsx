"use client";

import { useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

type Look = "solid" | "primary" | "outline" | "ghost";

export interface ActionSwapButtonProps
  extends Omit<ComponentProps<"button">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Controlled state. */
  pressed?: boolean;
  /** Initial state when uncontrolled. @default false */
  defaultPressed?: boolean;
  /** Called when the button toggles. */
  onPressedChange?: (pressed: boolean) => void;
  /** Label in the default state. Used as the accessible name when iconOnly. */
  label: ReactNode;
  /** Label once toggled. */
  pressedLabel: ReactNode;
  /** Icon in the default state. */
  icon?: ReactNode;
  /** Icon once toggled. */
  pressedIcon?: ReactNode;
  /** Look in the default state. @default "solid" */
  variant?: Look;
  /** Look once toggled. @default "outline" */
  pressedVariant?: Look;
  /** Button size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Show icons only; labels become the accessible name. @default false */
  iconOnly?: boolean;
}

const layerClasses: Record<Look, string> = {
  solid:
    "bg-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.14),0_4px_12px_-2px_rgb(0_0_0/0.12)] group-hover:bg-foreground/90",
  primary:
    "bg-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.12),0_4px_12px_-2px_color-mix(in_oklab,var(--primary)_40%,transparent)] group-hover:bg-primary/90",
  outline: "border border-border bg-background shadow-xs group-hover:bg-accent",
  ghost: "group-hover:bg-accent",
};

const textClasses: Record<Look, string> = {
  solid: "text-background",
  primary: "text-primary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
};

const sizeClasses = {
  sm: { base: "h-8 px-3 text-[13px] rounded-md", icon: "size-8 rounded-md" },
  md: { base: "h-10 px-4 text-sm rounded-md", icon: "size-10 rounded-md" },
  lg: { base: "h-12 px-6 text-[15px] rounded-lg", icon: "size-12 rounded-lg [&_svg]:size-5" },
} as const;

export function ActionSwapButton({
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  label,
  pressedLabel,
  icon,
  pressedIcon,
  variant = "solid",
  pressedVariant = "outline",
  size = "md",
  iconOnly = false,
  type = "button",
  className,
  onClick,
  "aria-label": ariaLabel,
  ...props
}: ActionSwapButtonProps) {
  const [internalPressed, setInternalPressed] = useState(defaultPressed);
  const pressed = pressedProp ?? internalPressed;
  const [toggled, setToggled] = useState(false);
  const reduceMotion = useReducedMotion();
  // Toggling on slides the new content up from below; toggling off reverses it.
  const direction = pressed ? 1 : -1;

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const next = !pressed;
    if (pressedProp === undefined) setInternalPressed(next);
    setToggled(true);
    onPressedChange?.(next);
  }

  const swap: Variants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: (dir: number) => ({ opacity: 0, y: dir * 16, filter: "blur(4px)" }),
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: (dir: number) => ({ opacity: 0, y: dir * -16, filter: "blur(4px)" }),
      };

  const currentLabel = pressed ? pressedLabel : label;
  const looks: Look[] = variant === pressedVariant ? [variant] : [variant, pressedVariant];

  const renderContent = (on: boolean) => (
    <>
      {on ? pressedIcon : icon}
      {iconOnly ? null : on ? pressedLabel : label}
    </>
  );

  return (
    <>
      <motion.button
        type={type}
        onClick={toggle}
        aria-label={ariaLabel ?? (iconOnly && typeof currentLabel === "string" ? currentLabel : undefined)}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        transition={spring.snappy}
        className={cn(
          "group relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden font-medium whitespace-nowrap outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
          iconOnly ? sizeClasses[size].icon : sizeClasses[size].base,
          size === "sm" && "after:absolute after:-inset-1 after:content-['']",
          className,
        )}
        {...props}
      >
        {/* Each look is its own layer; switching cross-fades opacity rather than animating colors. */}
        {looks.map((look, i) => (
          <motion.span
            key={look}
            aria-hidden="true"
            initial={false}
            animate={{ opacity: looks.length === 1 || (i === 1) === pressed ? 1 : 0 }}
            transition={{ duration: duration.base, ease: ease.out }}
            className={cn("absolute inset-0 -z-10 rounded-[inherit] transition-colors duration-150", layerClasses[look])}
          />
        ))}

        <span className="grid place-items-center *:[grid-area:1/1]">
          <span aria-hidden="true" className="invisible inline-flex items-center gap-2">
            {renderContent(false)}
          </span>
          <span aria-hidden="true" className="invisible inline-flex items-center gap-2">
            {renderContent(true)}
          </span>
          <AnimatePresence initial={false} custom={direction}>
            <motion.span
              key={pressed ? "pressed" : "default"}
              custom={direction}
              variants={swap}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: duration.base, ease: ease.out }}
              className={cn("inline-flex items-center gap-2", textClasses[pressed ? pressedVariant : variant])}
            >
              {renderContent(pressed)}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.button>
      <span role="status" className="sr-only">
        {toggled ? currentLabel : null}
      </span>
    </>
  );
}
