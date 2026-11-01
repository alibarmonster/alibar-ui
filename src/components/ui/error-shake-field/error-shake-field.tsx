"use client";

import { useEffect, useId, useRef, type ComponentProps } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface ErrorShakeFieldProps extends Omit<ComponentProps<"input">, "size"> {
  /** Visible label above the field. */
  label: string;
  /** Error message. Setting it (or changing shakeKey while it's set) shakes the field. */
  error?: string;
  /** Helper text shown when there is no error. */
  description?: string;
  /** Change this on every failed submit to shake again even if the message is unchanged. */
  shakeKey?: number | string;
  /** Classes for the outer wrapper. */
  className?: string;
}

// The classic "nope" curve: a quick start that decays into small, damped wiggles.
const SHAKE = { x: [0, -9, 8, -6, 5, -3, 2, 0] };
const SHAKE_EASE = [0.36, 0.07, 0.19, 0.97] as const;

export function ErrorShakeField({
  label,
  error,
  description,
  shakeKey,
  className,
  id,
  "aria-describedby": describedBy,
  ...props
}: ErrorShakeFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const mounted = useRef(false);
  const message = error ?? description;

  useEffect(() => {
    // Don't shake on first render; only in response to a new error or attempt.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!error || reduceMotion || !scope.current) return;
    animate(scope.current, SHAKE, { duration: 0.5, ease: SHAKE_EASE });
  }, [error, shakeKey, reduceMotion, animate, scope]);

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <label htmlFor={inputId} className={cn("block text-sm font-medium transition-colors", error ? "text-destructive" : "text-foreground")}>
        {label}
      </label>
      <div ref={scope} className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[message ? messageId : null, describedBy].filter(Boolean).join(" ") || undefined}
          className={cn(
            "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-xs outline-none",
            "transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-destructive pr-10 ring-3 ring-destructive/15 focus-visible:ring-destructive/25"
              : "border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20",
          )}
          {...props}
        />
        <AnimatePresence>
          {error ? (
            <motion.span
              aria-hidden="true"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.5 }}
              transition={reduceMotion ? { duration: duration.quick } : { type: "spring", stiffness: 500, damping: 22 }}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-destructive"
            >
              <CircleAlert className="size-4" />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      {/* 0fr → 1fr grid rows reveal the message without animating height directly. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          message ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div id={messageId} aria-live="polite" className="relative">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={error ? `error:${error}` : `hint:${description ?? ""}`}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: duration.instant } }}
                transition={{ duration: duration.base, ease: ease.out }}
                className={cn("text-[13px] leading-5", error ? "text-destructive" : "text-muted-foreground")}
              >
                {message}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
