"use client";

import { useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Popover } from "radix-ui";
import { ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants, spring } from "@/lib/motion";

export interface SelectOption {
  /** Value reported when the option is chosen. */
  value: string;
  /** Visible label; also what the filter matches. */
  label: string;
  /** Secondary text under the label. */
  description?: string;
  /** Icon shown before the label. */
  icon?: ReactNode;
  /** Prevents choosing the option. */
  disabled?: boolean;
}

export interface AnimatedSelectProps
  extends Omit<ComponentProps<"button">, "value" | "defaultValue" | "onChange" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** The options, in order. */
  options: SelectOption[];
  /** Controlled selected value. */
  value?: string;
  /** Initially selected value when uncontrolled. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void;
  /** Trigger text when nothing is selected. @default "Select…" */
  placeholder?: string;
  /** Show a filter field at the top of the list. @default false */
  searchable?: boolean;
  /** Text shown when the filter matches nothing. @default "No results." */
  emptyText?: string;
  /** Submits the selected value under this name. */
  name?: string;
}

export function AnimatedSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  searchable = false,
  emptyText = "No results.",
  name,
  disabled,
  className,
  ...props
}: AnimatedSelectProps) {
  const [internal, setInternal] = useState(defaultValue);
  const selectedValue = value ?? internal;
  const selected = options.find((o) => o.value === selectedValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: "", timer: 0 });
  const reduceMotion = useReducedMotion();
  const listId = useId();
  const groupId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : options;
  }, [options, query]);

  function openChange(next: boolean) {
    setOpen(next);
    if (next) {
      setQuery("");
      setActive(Math.max(0, options.findIndex((o) => o.value === selectedValue)));
    }
  }

  function choose(option: SelectOption | undefined) {
    if (!option || option.disabled) return;
    if (value === undefined) setInternal(option.value);
    onValueChange?.(option.value);
    setOpen(false);
  }

  /** Moves the highlight, skipping disabled options in direction `dir`. */
  function move(to: number, dir: 1 | -1) {
    if (!filtered.length) return;
    const count = filtered.length;
    let index = (to + count) % count;
    for (let i = 0; i < count && filtered[index]?.disabled; i++) index = (index + dir + count) % count;
    setActive(index);
    document.getElementById(`${listId}-${index}`)?.scrollIntoView({ block: "nearest" });
  }

  function onListKey(event: KeyboardEvent<HTMLElement>) {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(active + 1, 1),
      ArrowUp: () => move(active - 1, -1),
      Home: () => move(0, 1),
      End: () => move(filtered.length - 1, -1),
      Enter: () => choose(filtered[active]),
    };
    if (!searchable) keys[" "] = () => choose(filtered[active]);
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
      return;
    }
    // Typeahead when there is no filter field: jump to the first label starting with the typed text.
    if (!searchable && event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      window.clearTimeout(typeahead.current.timer);
      typeahead.current.text += event.key.toLowerCase();
      typeahead.current.timer = window.setTimeout(() => {
        typeahead.current.text = "";
      }, 500);
      const match = filtered.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typeahead.current.text));
      if (match !== -1) move(match, 1);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={openChange}>
      {/* Select-only combobox pattern: screen readers announce the label and the current value. */}
      <Popover.Trigger
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        className={cn(
          "inline-flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm shadow-xs outline-none",
          "transition-[border-color,box-shadow] duration-150 hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20",
          "data-[state=open]:border-ring data-[state=open]:ring-3 data-[state=open]:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          "[&_svg]:size-4 [&_svg]:shrink-0",
          className,
        )}
        {...props}
      >
        <span className="relative grid min-w-0 flex-1 *:[grid-area:1/1]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={selected?.value ?? "placeholder"}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ duration: duration.quick, ease: ease.out }}
              className={cn("flex min-w-0 items-center gap-2", selected ? "text-foreground" : "text-muted-foreground")}
            >
              {selected?.icon}
              <span className="truncate">{selected?.label ?? placeholder}</span>
            </motion.span>
          </AnimatePresence>
        </span>
        <ChevronsUpDown className="text-muted-foreground" aria-hidden="true" />
      </Popover.Trigger>
      {name ? <input type="hidden" name={name} value={selectedValue ?? ""} /> : null}

      <AnimatePresence>
        {open ? (
          <Popover.Portal forceMount>
            <Popover.Content
              forceMount
              asChild
              align="start"
              sideOffset={6}
              collisionPadding={12}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                (searchable ? searchRef.current : listRef.current)?.focus();
              }}
              onKeyDown={searchable ? undefined : onListKey}
            >
              <motion.div
                variants={overlayVariants(reduceMotion)}
                initial="hidden"
                animate="visible"
                exit="exit"
                // Scale out of the trigger, whichever side Radix places the list on.
                style={{ transformOrigin: "var(--radix-popover-content-transform-origin)" }}
                className="z-50 w-[var(--radix-popover-trigger-width)] min-w-48 overflow-hidden rounded-[10px] border border-border bg-popover text-popover-foreground shadow-lg outline-none"
              >
                {searchable ? (
                  <div className="flex items-center gap-2 border-b border-border px-3">
                    <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setActive(0);
                      }}
                      onKeyDown={onListKey}
                      role="combobox"
                      aria-expanded="true"
                      aria-controls={listId}
                      aria-activedescendant={filtered.length ? `${listId}-${active}` : undefined}
                      aria-label="Filter options"
                      placeholder="Search…"
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                ) : null}
                <LayoutGroup id={groupId}>
                  <div
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    tabIndex={searchable ? undefined : -1}
                    aria-activedescendant={!searchable && filtered.length ? `${listId}-${active}` : undefined}
                    aria-label={props["aria-label"] ?? "Options"}
                    className="max-h-72 overflow-y-auto overscroll-contain p-1 outline-none"
                  >
                    {filtered.length === 0 ? (
                      <p className="px-2.5 py-6 text-center text-[13px] text-muted-foreground">{emptyText}</p>
                    ) : (
                      filtered.map((option, index) => {
                        const highlighted = index === active;
                        const isSelected = option.value === selectedValue;
                        return (
                          <div
                            key={option.value}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={isSelected}
                            aria-disabled={option.disabled || undefined}
                            onPointerMove={() => !highlighted && !option.disabled && setActive(index)}
                            onClick={() => choose(option)}
                            className={cn(
                              "relative flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm [&_svg]:size-4 [&_svg]:shrink-0",
                              option.disabled && "cursor-not-allowed opacity-45",
                            )}
                          >
                            {highlighted && !option.disabled ? (
                              <motion.span
                                layoutId="active-row"
                                aria-hidden="true"
                                transition={reduceMotion ? { duration: 0 } : spring.snappy}
                                className="absolute inset-0 rounded-md bg-accent"
                              />
                            ) : null}
                            {option.icon ? <span className="relative flex text-muted-foreground">{option.icon}</span> : null}
                            <span className="relative min-w-0 flex-1">
                              <span className="block truncate text-foreground">{option.label}</span>
                              {option.description ? (
                                <span className="block truncate text-xs text-muted-foreground">{option.description}</span>
                              ) : null}
                            </span>
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="relative size-4 text-foreground">
                              <motion.path
                                d="M5 12.5l4.5 4.5L19 7.5"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: isSelected ? 1 : 0 }}
                                animate={{ pathLength: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }}
                                transition={{ duration: reduceMotion ? 0 : duration.base, ease: ease.out }}
                              />
                            </svg>
                          </div>
                        );
                      })
                    )}
                  </div>
                </LayoutGroup>
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        ) : null}
      </AnimatePresence>
    </Popover.Root>
  );
}
