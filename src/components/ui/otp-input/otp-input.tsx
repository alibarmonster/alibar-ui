"use client";

import { Fragment, useEffect, useId, useState, type ChangeEvent, type ComponentProps, type SyntheticEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export interface OtpInputProps
  extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "maxLength" | "size" | "type"> {
  /** Number of characters in the code. @default 6 */
  length?: number;
  /** Controlled code. */
  value?: string;
  /** Initial code when uncontrolled. @default "" */
  defaultValue?: string;
  /** Called with the code on every change. */
  onValueChange?: (value: string) => void;
  /** Called once every slot is filled. */
  onComplete?: (value: string) => void;
  /** Result of verifying the code. "error" shakes the slots; "success" draws a check. @default "idle" */
  status?: "idle" | "error" | "success";
  /** Insert a divider after every N slots, e.g. 3 for 123–456. */
  groupSize?: number;
  /** Accept letters as well as digits. Letters are uppercased. @default false */
  alphanumeric?: boolean;
  /** Show dots instead of the characters, for PINs. @default false */
  mask?: boolean;
  /** Classes for the outer wrapper. */
  className?: string;
}

const statusClasses = {
  idle: "border-input",
  error: "border-destructive",
  success: "border-success",
} as const;

/** Blinking caret. Started imperatively so it blinks even in a slot that is active on first render. */
function Caret({ reduceMotion }: { reduceMotion: boolean }) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  useEffect(() => {
    if (reduceMotion || !scope.current) return;
    const controls = animate(scope.current, { opacity: [1, 1, 0, 0] }, { duration: 1.1, repeat: Infinity, times: [0, 0.5, 0.5, 1] });
    return () => controls.stop();
  }, [animate, reduceMotion, scope]);
  return <motion.span ref={scope} className="relative h-6 w-px bg-foreground" exit={{ opacity: 0 }} transition={{ duration: 0.1 }} />;
}

export function OtpInput({
  length = 6,
  value,
  defaultValue = "",
  onValueChange,
  onComplete,
  status = "idle",
  groupSize,
  alphanumeric = false,
  mask = false,
  className,
  disabled,
  onFocus,
  onBlur,
  onSelect,
  "aria-label": ariaLabel,
  ...props
}: OtpInputProps) {
  const [internal, setInternal] = useState(defaultValue);
  const code = (value ?? internal).slice(0, length);
  const [focused, setFocused] = useState(false);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const ringId = useId();

  useEffect(() => {
    if (status === "error" && !reduceMotion && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, -3, 0] }, { duration: 0.45, ease: ease.out });
    }
  }, [status, reduceMotion, animate, scope]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const pattern = alphanumeric ? /[^a-z0-9]/gi : /\D/g;
    const next = event.currentTarget.value.replace(pattern, "").toUpperCase().slice(0, length);
    if (next === code) return;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    if (next.length === length && code.length < length) onComplete?.(next);
  }

  // Keep the caret at the end, so typing always fills the next slot. Select-all is allowed.
  function pinCaret(event: SyntheticEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const end = input.value.length;
    const selectAll = input.selectionStart === 0 && input.selectionEnd === end && end > 0;
    if (!selectAll && (input.selectionStart !== end || input.selectionEnd !== end)) input.setSelectionRange(end, end);
  }

  const activeIndex = Math.min(code.length, length - 1);
  const charMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 10, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.6, filter: "blur(2px)" },
      };

  return (
    <div ref={scope} className={cn("relative inline-flex items-center", disabled && "opacity-50", className)}>
      <LayoutGroup id={ringId}>
        <div className="flex items-center gap-2" aria-hidden="true">
          {Array.from({ length }, (_, i) => {
            const char = code[i];
            const active = focused && i === activeIndex;
            return (
              <Fragment key={i}>
                {groupSize && i > 0 && i % groupSize === 0 ? (
                  <span className="mx-0.5 h-0.5 w-3 rounded-full bg-border" />
                ) : null}
                <motion.div
                  animate={status === "success" && !reduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35, delay: i * 0.04, ease: ease.out }}
                  className={cn(
                    "relative flex h-11 w-9 items-center justify-center rounded-md border bg-background text-lg font-medium text-foreground shadow-xs transition-colors duration-200 sm:h-14 sm:w-12 sm:text-xl",
                    statusClasses[status],
                  )}
                >
                  {active && status === "idle" ? (
                    <motion.div
                      layoutId="ring"
                      transition={reduceMotion ? { duration: 0 } : spring.snappy}
                      className="absolute -inset-px rounded-md border-2 border-ring ring-3 ring-ring/20"
                    />
                  ) : null}
                  <AnimatePresence mode="popLayout" initial={false}>
                    {char ? (
                      <motion.span
                        key={`${i}:${char}`}
                        variants={charMotion}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: duration.quick, ease: ease.out }}
                        className="relative"
                      >
                        {mask ? <span className="block size-2.5 rounded-full bg-foreground" /> : char}
                      </motion.span>
                    ) : active ? (
                      <Caret key="caret" reduceMotion={!!reduceMotion} />
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </Fragment>
            );
          })}
        </div>
      </LayoutGroup>

      {/* One real input covers the slots: native typing, paste, autofill and SMS codes all work. */}
      <input
        type="text"
        inputMode={alphanumeric ? "text" : "numeric"}
        autoComplete="one-time-code"
        autoCapitalize={alphanumeric ? "characters" : "off"}
        spellCheck={false}
        // No maxLength: it would truncate pasted codes like "123-456" before the dash is filtered out.
        value={code}
        disabled={disabled}
        aria-label={ariaLabel ?? (props["aria-labelledby"] ? undefined : `${length}-digit code`)}
        aria-invalid={status === "error" || undefined}
        onChange={handleChange}
        onSelect={(event) => {
          onSelect?.(event);
          pinCaret(event);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          setFocused(true);
          pinCaret(event);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setFocused(false);
        }}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-not-allowed"
        {...props}
      />

      <AnimatePresence>
        {status === "success" ? (
          <motion.span
            aria-hidden="true"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: duration.quick } : { ...spring.bouncy, delay: length * 0.04 }}
            className="absolute top-1/2 -right-9 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-success text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: duration.base, ease: ease.out, delay: length * 0.04 + 0.12 }}
              />
            </svg>
          </motion.span>
        ) : null}
      </AnimatePresence>
      <span role="status" className="sr-only">
        {status === "success" ? "Code verified" : status === "error" ? "Incorrect code" : ""}
      </span>
    </div>
  );
}
