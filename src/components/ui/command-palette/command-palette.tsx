"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, overlayVariants, spring } from "@/lib/motion";

export interface CommandPaletteItem {
  /** Unique id. */
  id: string;
  /** Visible label; the main thing search matches. */
  label: string;
  /** Group heading the item appears under. */
  group?: string;
  /** Secondary text, e.g. a path or hint. */
  description?: string;
  /** Icon before the label. */
  icon?: ReactNode;
  /** Keys shown at the end, e.g. ["⌘", "N"]. Display only. */
  shortcut?: string[];
  /** Extra words that should match, e.g. synonyms. */
  keywords?: string[];
  /** Prevents choosing the item. */
  disabled?: boolean;
  /** Runs when the item is chosen. */
  onSelect?: () => void;
}

export interface CommandPaletteProps {
  /** Commands, in display order. */
  items: CommandPaletteItem[];
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the palette opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the palette, e.g. a search button. */
  trigger?: ReactNode;
  /** Letter that toggles the palette together with ⌘ (Mac) or Ctrl. false turns it off. @default "k" */
  hotkey?: string | false;
  /** Placeholder for the search field. @default "Type a command or search…" */
  placeholder?: string;
  /** Text shown when nothing matches. @default "No results found." */
  emptyText?: string;
  /** Close after an item is chosen. @default true */
  closeOnSelect?: boolean;
}

/** Characters of the query appear in order in the text; tighter runs score higher. */
function fuzzy(query: string, text: string) {
  let score = 0;
  let run = 0;
  let from = 0;
  for (const ch of query) {
    const at = text.indexOf(ch, from);
    if (at === -1) return 0;
    run = at === from ? run + 1 : 0;
    score += 1 + run;
    from = at + 1;
  }
  return (score / (query.length * 3)) * 20;
}

function rank(query: string, item: CommandPaletteItem) {
  const label = item.label.toLowerCase();
  if (label === query) return 100;
  if (label.startsWith(query)) return 80;
  if (label.split(/[\s/-]+/).some((w) => w.startsWith(query))) return 60;
  if (label.includes(query)) return 50;
  const loose = fuzzy(query.replace(/\s+/g, ""), label);
  if (loose > 0) return 20 + loose;
  const extra = [item.description, item.group, ...(item.keywords ?? [])].join(" ").toLowerCase();
  return extra.includes(query) ? 10 : 0;
}

export function CommandPalette({
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  hotkey = "k",
  placeholder = "Type a command or search…",
  emptyText = "No results found.",
  closeOnSelect = true,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const listId = useId();
  const groupId = useId();

  const setOpen = (next: boolean) => {
    if (!next) {
      setQuery("");
      setActive(0);
    }
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const setOpenRef = useRef(setOpen);
  useEffect(() => {
    setOpenRef.current = setOpen;
  });

  useEffect(() => {
    if (!hotkey) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() === hotkey.toLowerCase() && (event.metaKey || event.ctrlKey) && !event.altKey) {
        event.preventDefault();
        setOpenRef.current(!isOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkey, isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items
      .map((item) => ({ item, score: rank(q, item) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.item);
  }, [items, query]);

  // Grouped while browsing; a single ranked list while searching.
  const sections = useMemo(() => {
    if (query.trim()) return [{ name: "Results", items: results }];
    const map = new Map<string, CommandPaletteItem[]>();
    for (const item of results) map.set(item.group ?? "", [...(map.get(item.group ?? "") ?? []), item]);
    return [...map].map(([name, sectionItems]) => ({ name, items: sectionItems }));
  }, [query, results]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function move(from: number, dir: 1 | -1) {
    const count = results.length;
    if (!count) return;
    let index = from;
    for (let i = 0; i < count; i++) {
      index = (index + dir + count) % count;
      if (!results[index].disabled) break;
    }
    setActive(index);
  }

  function choose(item: CommandPaletteItem | undefined) {
    if (!item || item.disabled) return;
    item.onSelect?.();
    if (closeOnSelect) setOpen(false);
  }

  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(active, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(active, -1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[active]);
    }
  }

  let index = -1;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <AnimatePresence>
        {isOpen ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.quick }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-4 pt-[min(15vh,8rem)]">
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  variants={overlayVariants(reduceMotion)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="pointer-events-auto w-full max-w-[36rem] overflow-hidden rounded-[14px] border border-border bg-popover text-popover-foreground shadow-xl outline-none"
                >
                  <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                  <div className="flex h-13 items-center gap-2.5 border-b border-border px-4">
                    <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setActive(0);
                      }}
                      onKeyDown={onInputKey}
                      role="combobox"
                      aria-expanded="true"
                      aria-controls={listId}
                      aria-autocomplete="list"
                      aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
                      aria-label="Search commands"
                      placeholder={placeholder}
                      spellCheck={false}
                      className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    <kbd className="rounded-[5px] border border-border px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground">Esc</kbd>
                  </div>

                  <LayoutGroup id={groupId}>
                    <div
                      ref={listRef}
                      id={listId}
                      role="listbox"
                      aria-label="Commands"
                      className="max-h-[min(55vh,24rem)] overflow-y-auto overscroll-contain p-1.5"
                    >
                      {results.length === 0 ? (
                        <p className="px-3 py-10 text-center text-sm text-muted-foreground">{emptyText}</p>
                      ) : (
                        sections.map((section) => (
                          <div key={section.name || "ungrouped"} role="group" aria-label={section.name || undefined} className="pb-1">
                            {section.name ? (
                              <p aria-hidden="true" className="px-2.5 pt-2 pb-1.5 text-xs font-medium text-muted-foreground">
                                {section.name}
                              </p>
                            ) : null}
                            {section.items.map((item) => {
                              index += 1;
                              const itemIndex = index;
                              const isActive = itemIndex === active;
                              return (
                                <div
                                  key={item.id}
                                  id={`${listId}-${itemIndex}`}
                                  role="option"
                                  aria-selected={isActive}
                                  aria-disabled={item.disabled || undefined}
                                  data-index={itemIndex}
                                  onPointerMove={() => !isActive && !item.disabled && setActive(itemIndex)}
                                  onClick={() => choose(item)}
                                  className={cn(
                                    "relative flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2",
                                    item.disabled && "cursor-not-allowed opacity-45",
                                  )}
                                >
                                  {isActive && !item.disabled ? (
                                    <motion.span
                                      layoutId="active-row"
                                      aria-hidden="true"
                                      transition={reduceMotion ? { duration: 0 } : spring.snappy}
                                      className="absolute inset-0 rounded-[10px] bg-accent"
                                    />
                                  ) : null}
                                  {item.icon ? (
                                    <span className="relative flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground [&_svg]:size-3.5">
                                      {item.icon}
                                    </span>
                                  ) : null}
                                  <span className="relative min-w-0 flex-1">
                                    <span className="block truncate text-sm text-foreground">{item.label}</span>
                                    {item.description ? (
                                      <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                                    ) : null}
                                  </span>
                                  {item.shortcut ? (
                                    <span className="relative flex shrink-0 gap-1" aria-hidden="true">
                                      {item.shortcut.map((key) => (
                                        <kbd
                                          key={key}
                                          className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border bg-background px-1 font-sans text-[11px] text-muted-foreground"
                                        >
                                          {key}
                                        </kbd>
                                      ))}
                                    </span>
                                  ) : isActive ? (
                                    <CornerDownLeft className="relative size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  </LayoutGroup>

                  <div className="hidden items-center gap-4 border-t border-border px-4 py-2.5 text-xs text-muted-foreground sm:flex">
                    <span>↑↓ to navigate</span>
                    <span>↵ to select</span>
                    <span className="ml-auto tabular-nums">
                      {results.length} {results.length === 1 ? "result" : "results"}
                    </span>
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
