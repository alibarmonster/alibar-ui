"use client";

import { useId, useSyncExternalStore, type ComponentProps, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type Theme = "light" | "dark";

export interface ThemeToggleProps
  extends Omit<ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Controlled theme. Leave it undefined to toggle the "dark" class on <html>. */
  theme?: Theme;
  /** Called with the next theme, inside the view transition so the reveal captures it. */
  onThemeChange?: (theme: Theme) => void;
  /** Reveal the new theme with a circle that grows from the button (View Transition API). @default true */
  reveal?: boolean;
  /** Reveal duration in milliseconds. @default 650 */
  duration?: number;
  /** Button size. @default "md" */
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "size-8 [&_svg]:size-4 after:-inset-1",
  md: "size-10 [&_svg]:size-[18px]",
  lg: "size-12 [&_svg]:size-5",
} as const;

// Turns off the default cross-fade only while our reveal runs.
const REVEAL_CSS =
  "html[data-theme-reveal]::view-transition-old(root),html[data-theme-reveal]::view-transition-new(root){animation:none;mix-blend-mode:normal}";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const readDomTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

function SunMoon({ dark }: { dark: boolean }) {
  const reduceMotion = useReducedMotion();
  const maskId = `moon-${useId().replace(/[^\w-]/g, "")}`;
  const t = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 240, damping: 20 };
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      initial={false}
      animate={{ rotate: dark ? 45 : 90 }}
      transition={t}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        {/* The "bite" slides over the disc to turn the sun into a moon. */}
        <motion.circle cx="18" cy="6" r="7.5" fill="black" stroke="none" initial={false} animate={{ x: dark ? 0 : 12, y: dark ? 0 : -12 }} transition={t} />
      </mask>
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        fill="currentColor"
        stroke="none"
        mask={`url(#${maskId})`}
        initial={false}
        animate={{ scale: dark ? 1 : 0.5 }}
        transition={t}
      />
      <motion.g initial={false} animate={{ opacity: dark ? 0 : 1, scale: dark ? 0.4 : 1 }} transition={t}>
        <path d="M12 1.5v2M12 20.5v2M4.6 4.6 6 6M18 18l1.4 1.4M1.5 12h2M20.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </motion.g>
    </motion.svg>
  );
}

export function ThemeToggle({
  theme,
  onThemeChange,
  reveal = true,
  duration = 650,
  size = "md",
  className,
  onClick,
  type = "button",
  "aria-label": ariaLabel,
  ...props
}: ThemeToggleProps) {
  const domTheme = useSyncExternalStore(subscribe, readDomTheme, () => "light" as const);
  const current = theme ?? domTheme;
  const next: Theme = current === "dark" ? "light" : "dark";
  const reduceMotion = useReducedMotion();

  function apply() {
    if (theme === undefined) {
      const root = document.documentElement;
      root.classList.toggle("dark", next === "dark");
      root.style.colorScheme = next;
    }
    onThemeChange?.(next);
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (!reveal || reduceMotion || !("startViewTransition" in document)) {
      apply();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement;

    root.dataset.themeReveal = "";
    // flushSync so React commits the new theme inside the transition's snapshot callback.
    const transition = document.startViewTransition(() => flushSync(apply));
    transition.ready
      .then(() =>
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
        ),
      )
      .catch(() => {});
    transition.finished.finally(() => delete root.dataset.themeReveal);
  }

  return (
    <>
      <style href="alibar-theme-toggle" precedence="default">
        {REVEAL_CSS}
      </style>
      <button
        type={type}
        onClick={handleClick}
        aria-label={ariaLabel ?? `Switch to ${next} theme`}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none",
          "transition-[background-color,color,transform] duration-150 after:absolute after:content-[''] hover:bg-accent hover:text-foreground active:scale-90",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          sizes[size],
          className,
        )}
        {...props}
      >
        <SunMoon dark={current === "dark"} />
      </button>
    </>
  );
}
