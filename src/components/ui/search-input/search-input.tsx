"use client";

import { useRef, useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface SearchInputProps
  extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "size"> {
  /** Controlled query. */
  value?: string;
  /** Initial query when uncontrolled. @default "" */
  defaultValue?: string;
  /** Called with the query on every change. */
  onValueChange?: (value: string) => void;
  /** Called after the query is cleared with the button or Escape. */
  onClear?: () => void;
  /** Replace the search icon with a spinner. @default false */
  loading?: boolean;
  /** Field size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Classes for the outer wrapper. */
  className?: string;
}

const sizes = {
  sm: { field: "h-8 text-[13px]", input: "pr-8 pl-8", icon: "left-2.5 size-3.5", text: "left-8", clear: "right-1 size-6" },
  md: { field: "h-10 text-sm", input: "pr-10 pl-9", icon: "left-3 size-4", text: "left-9", clear: "right-1.5 size-7" },
  lg: { field: "h-12 text-base", input: "pr-12 pl-11", icon: "left-3.5 size-5", text: "left-11", clear: "right-2 size-8" },
} as const;

interface Ghost {
  id: number;
  tokens: string[];
  offset: number;
}

export function SearchInput({
  value,
  defaultValue = "",
  onValueChange,
  onClear,
  loading = false,
  size = "md",
  className,
  placeholder = "Search…",
  disabled,
  onKeyDown,
  ...props
}: SearchInputProps) {
  const [internal, setInternal] = useState(defaultValue);
  const query = value ?? internal;
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const s = sizes[size];

  function update(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  function clear() {
    if (!query) return;
    const input = inputRef.current;
    if (!reduceMotion) {
      // Snapshot the words so they can dissolve while the real field is already empty.
      setGhost({ id: Date.now(), tokens: query.split(/(\s+)/).filter(Boolean), offset: input ? -input.scrollLeft : 0 });
    }
    update("");
    onClear?.();
    input?.focus();
  }

  const icon = { initial: { opacity: 0, scale: 0.6 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.6 } };

  return (
    <div className={cn("relative flex w-full items-center text-foreground", s.field, className)}>
      <span
        aria-hidden="true"
        className={cn("pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-muted-foreground", s.icon)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {loading ? (
            <motion.svg
              key="spinner"
              viewBox="0 0 24 24"
              fill="none"
              className="size-full"
              variants={icon}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: duration.quick }}
            >
              <g className="origin-center animate-spin [transform-box:fill-box] motion-reduce:animate-pulse">
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
                <path d="M20.5 12A8.5 8.5 0 0 0 12 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            </motion.svg>
          ) : (
            <motion.span
              key="search"
              className="block size-full"
              variants={icon}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: duration.quick }}
            >
              <Search className="size-full" strokeWidth={2} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => update(event.target.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === "Escape" && query && !event.defaultPrevented) {
            event.preventDefault();
            clear();
          }
        }}
        className={cn(
          "h-full w-full rounded-md border border-input bg-background shadow-xs outline-none",
          "transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          ghost && "placeholder:text-transparent",
          s.input,
        )}
        {...props}
      />

      {/* The cleared words, dissolving one by one from the end. */}
      {ghost ? (
        <span
          key={ghost.id}
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-y-0 flex items-center whitespace-pre", s.text)}
          style={{ transform: `translateX(${ghost.offset}px)` }}
        >
          {ghost.tokens.map((token, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              animate={{ opacity: 0, y: -6, filter: "blur(6px)" }}
              transition={{ duration: duration.slow - 0.1, ease: ease.out, delay: (ghost.tokens.length - 1 - i) * 0.05 }}
              onAnimationComplete={i === 0 ? () => setGhost((g) => (g?.id === ghost.id ? null : g)) : undefined}
            >
              {token}
            </motion.span>
          ))}
        </span>
      ) : null}

      <AnimatePresence initial={false}>
        {query && !disabled ? (
          <motion.button
            type="button"
            aria-label="Clear search"
            onClick={clear}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, filter: "blur(2px)" }}
            transition={{ duration: duration.quick, ease: ease.out }}
            className={cn(
              "absolute top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none",
              "transition-colors after:absolute after:-inset-1.5 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              s.clear,
            )}
          >
            <X className="size-3.5" aria-hidden="true" />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
