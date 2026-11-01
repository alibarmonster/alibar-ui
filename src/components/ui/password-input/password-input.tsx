"use client";

import { useId, useState, type ChangeEvent, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease, stagger } from "@/lib/motion";

export interface PasswordRequirement {
  /** Shown in the checklist, e.g. "At least 8 characters". */
  label: string;
  /** Returns true when the password meets the rule. */
  test: (password: string) => boolean;
}

export const defaultRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "Upper and lower case", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "A number", test: (v) => /\d/.test(v) },
  { label: "A symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export interface PasswordInputProps extends Omit<ComponentProps<"input">, "type" | "size"> {
  /** Show the four-segment strength meter. @default true */
  showStrength?: boolean;
  /** Show the checklist of requirements under the field. @default false */
  showRequirements?: boolean;
  /** Rules behind the strength score and the checklist. @default length, mixed case, number, symbol */
  requirements?: PasswordRequirement[];
  /** Field size. @default "md" */
  size?: "md" | "lg";
  /** Classes for the outer wrapper. */
  className?: string;
}

const LEVELS = [
  { label: "Too weak", bar: "bg-destructive" },
  { label: "Weak", bar: "bg-destructive" },
  { label: "Fair", bar: "bg-warning" },
  { label: "Good", bar: "bg-primary" },
  { label: "Strong", bar: "bg-success" },
] as const;

const SEGMENTS = 4;
const EYE = "M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0";

/** Eye whose slash draws on; a mask cuts a gap so it reads on any background. */
function EyeToggleIcon({ slashed }: { slashed: boolean }) {
  const reduceMotion = useReducedMotion();
  const maskId = `eye-${useId().replace(/[^\w-]/g, "")}`;
  const transition = reduceMotion ? { duration: 0 } : { duration: duration.base, ease: ease.out };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <motion.path
          d="M3 3l18 18"
          stroke="black"
          strokeWidth={5.5}
          initial={false}
          animate={{ pathLength: slashed ? 1 : 0, opacity: slashed ? 1 : 0 }}
          transition={transition}
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path d={EYE} />
        <circle cx="12" cy="12" r="3" />
      </g>
      <motion.path
        d="M3 3l18 18"
        initial={false}
        animate={{ pathLength: slashed ? 1 : 0, opacity: slashed ? 1 : 0 }}
        transition={transition}
      />
    </svg>
  );
}

export function PasswordInput({
  showStrength = true,
  showRequirements = false,
  requirements = defaultRequirements,
  size = "md",
  className,
  id,
  value,
  defaultValue,
  onChange,
  disabled,
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [internal, setInternal] = useState(String(defaultValue ?? ""));
  const password = value !== undefined ? String(value) : internal;
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  const met = requirements.map((rule) => rule.test(password));
  const score = met.filter(Boolean).length;
  const filled = password ? Math.round((score / Math.max(requirements.length, 1)) * SEGMENTS) : 0;
  const level = LEVELS[filled];

  const swap = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 6, filter: "blur(3px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -6, filter: "blur(3px)" },
      };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setInternal(event.target.value);
            onChange?.(event);
          }}
          className={cn(
            "w-full rounded-md border border-input bg-background pl-3 text-foreground shadow-xs outline-none",
            "transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            size === "lg" ? "h-12 pr-12 text-base" : "h-10 pr-11 text-sm",
          )}
          {...props}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label="Show password"
          aria-pressed={visible}
          aria-controls={inputId}
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "absolute top-1/2 right-1 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none",
            "transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            "after:absolute after:-inset-1 disabled:pointer-events-none [&_svg]:size-4",
            size === "lg" ? "size-10" : "size-8",
          )}
        >
          <EyeToggleIcon slashed={visible} />
        </button>
      </div>

      {showStrength ? (
        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-hidden="true">
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className={cn("block h-full origin-left rounded-full", level.bar)}
                  initial={false}
                  animate={{ scaleX: i < filled ? 1 : 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: duration.base, ease: ease.out, delay: (i < filled ? i : SEGMENTS - i) * stagger.tight }
                  }
                />
              </span>
            ))}
          </div>
          <span aria-hidden="true" className="relative w-16 text-right text-xs font-medium text-foreground">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={password ? level.label : "empty"}
                variants={swap}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: duration.quick, ease: ease.out }}
                className="inline-block"
              >
                {password ? level.label : " "}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="sr-only" aria-live="polite">
            {password ? `Password strength: ${level.label}` : ""}
          </span>
        </div>
      ) : null}

      {showRequirements ? (
        <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {requirements.map((rule, i) => (
            <li
              key={rule.label}
              className={cn(
                "flex items-center gap-2 text-[13px] transition-colors duration-200",
                met[i] ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "relative flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
                  met[i] ? "border-success bg-success text-white" : "border-border",
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" className="size-2.5">
                  <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ pathLength: met[i] ? 1 : 0, opacity: met[i] ? 1 : 0 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: duration.base, ease: ease.out }}
                  />
                </svg>
              </span>
              <span className="sr-only">{met[i] ? "Done:" : "Missing:"}</span>
              {rule.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
