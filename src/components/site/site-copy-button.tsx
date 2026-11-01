"use client";

// The library CopyButton, rebuilt on Motion's `m` components so the site chrome doesn't load the full
// animation bundle up front (features arrive lazily through LazyMotion in MotionProvider).

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent } from "react";
import { AnimatePresence, useReducedMotion, type Variants } from "motion/react";
import * as m from "motion/react-m";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface SiteCopyButtonProps extends Omit<ComponentProps<"button">, "value" | "children" | "onCopy"> {
  /** Text written to the clipboard, or a function that reads it at copy time. */
  value: string | (() => string);
  /** Visible label. Omit it for an icon-only button. */
  label?: string;
  /** Label shown after a successful copy. @default "Copied" */
  copiedLabel?: string;
  /** Milliseconds before the button returns to its idle state. @default 2000 */
  timeout?: number;
  /** Visual style. @default "outline" */
  variant?: "outline" | "ghost" | "solid";
  /** Button size. Small buttons keep a 40px hit area. @default "md" */
  size?: "sm" | "md";
  /** Called with the copied text after a successful copy. */
  onCopied?: (value: string) => void;
}

const variantClasses = {
  outline: "border border-border bg-background text-foreground shadow-xs hover:bg-accent",
  ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
  solid: "bg-foreground text-background hover:bg-foreground/85",
} as const;

const sizeClasses = {
  sm: { base: "h-8 gap-1.5 rounded-md px-2.5 text-[13px]", icon: "size-8 rounded-md" },
  md: { base: "h-10 gap-2 rounded-md px-3.5 text-sm", icon: "size-10 rounded-md" },
} as const;

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for insecure contexts where the async Clipboard API is unavailable.
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) throw new Error("Copy command was rejected");
}

export function SiteCopyButton({
  value,
  label,
  copiedLabel = "Copied",
  timeout = 2000,
  variant = "outline",
  size = "md",
  onCopied,
  onClick,
  className,
  type = "button",
  "aria-label": ariaLabel,
  ...props
}: SiteCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const reduceMotion = useReducedMotion();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const text = typeof value === "function" ? value() : value;
    try {
      await writeClipboard(text);
    } catch {
      return;
    }
    setCopied(true);
    onCopied?.(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), timeout);
  }

  const swap: Variants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.6, filter: "blur(4px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.6, filter: "blur(4px)" },
      };
  const labelSwap: Variants = reduceMotion
    ? swap
    : {
        initial: { opacity: 0, y: 6, filter: "blur(3px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -6, filter: "blur(3px)" },
      };
  const transition = { duration: duration.quick, ease: ease.out };
  const iconOnly = !label;

  return (
    <>
      <button
        type={type}
        aria-label={ariaLabel ?? (iconOnly ? "Copy to clipboard" : undefined)}
        onClick={handleClick}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center font-medium whitespace-nowrap outline-none",
          "transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.96]",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          size === "sm" && "after:absolute after:-inset-1 after:content-['']",
          variantClasses[variant],
          iconOnly ? sizeClasses[size].icon : sizeClasses[size].base,
          className,
        )}
        {...props}
      >
        <span className="grid size-4 place-items-center *:[grid-area:1/1]" aria-hidden="true">
          <AnimatePresence initial={false}>
            {copied ? (
              <m.span
                key="check"
                variants={swap}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
                className={cn(variant !== "solid" && "text-success")}
              >
                <Check className="size-4" strokeWidth={2.25} />
              </m.span>
            ) : (
              <m.span
                key="copy"
                variants={swap}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <Copy className="size-4" strokeWidth={2} />
              </m.span>
            )}
          </AnimatePresence>
        </span>
        {label ? (
          // Both labels sit in one grid cell so the button keeps the wider width
          // and never animates its size.
          <span className="grid *:[grid-area:1/1]">
            <span className="invisible" aria-hidden="true">
              {label}
            </span>
            <span className="invisible" aria-hidden="true">
              {copiedLabel}
            </span>
            <AnimatePresence initial={false}>
              <m.span
                key={copied ? "copied" : "idle"}
                variants={labelSwap}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
                className="text-left"
              >
                {copied ? copiedLabel : label}
              </m.span>
            </AnimatePresence>
          </span>
        ) : null}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
