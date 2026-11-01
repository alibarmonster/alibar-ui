"use client";

import { useId, useRef, useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease, spring } from "@/lib/motion";

export interface TagInputProps
  extends Omit<
    ComponentProps<"input">,
    "value" | "defaultValue" | "onChange" | "size" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
  > {
  /** Controlled tags. */
  value?: string[];
  /** Initial tags when uncontrolled. @default [] */
  defaultValue?: string[];
  /** Called with the full list whenever a tag is added or removed. */
  onValueChange?: (tags: string[]) => void;
  /** Maximum number of tags; a counter appears when set. */
  maxTags?: number;
  /** Keys that turn the typed text into a tag. Single characters also split pasted text. @default ["Enter", ","] */
  separators?: string[];
  /** Return false to reject a tag. The field shakes and the text stays so it can be fixed. */
  validate?: (tag: string) => boolean;
  /** Allow the same tag more than once (case-insensitive). @default false */
  allowDuplicates?: boolean;
  /** Turn leftover text into a tag when the field loses focus. @default false */
  addOnBlur?: boolean;
  /** Classes for the outer field. */
  className?: string;
}

const SHAKE = { x: [0, -6, 6, -4, 4, 0] };

export function TagInput({
  value,
  defaultValue = [],
  onValueChange,
  maxTags,
  separators = ["Enter", ","],
  validate,
  allowDuplicates = false,
  addOnBlur = false,
  className,
  placeholder = "Add a tag…",
  disabled,
  onKeyDown,
  onBlur,
  onPaste,
  "aria-describedby": describedBy,
  ...props
}: TagInputProps) {
  const [internal, setInternal] = useState(defaultValue);
  const tags = value ?? internal;
  const [draft, setDraft] = useState("");
  const [armed, setArmed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const hintId = useId();
  const splitChars = separators.filter((s) => s.length === 1);
  const escaped = splitChars.map((ch) => ch.replace(/[\\\]^-]/g, "\\$&")).join("");
  // Single-character separators, newlines and tabs all split typed or pasted text.
  const splitPattern = new RegExp(`[\\n\\t${escaped}]+`);
  const full = maxTags !== undefined && tags.length >= maxTags;

  function commit(next: string[]) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  function shake(element: Element | null | undefined) {
    if (!reduceMotion && element) animate(element, SHAKE, { duration: 0.35 });
  }

  /** Adds candidates; returns false if the last one was rejected so its text can stay. */
  function add(candidates: string[]) {
    const next = [...tags];
    let accepted = true;
    for (const raw of candidates) {
      const tag = raw.trim();
      if (!tag) continue;
      if (maxTags !== undefined && next.length >= maxTags) {
        shake(scope.current);
        setAnnouncement(`You can add up to ${maxTags} tags`);
        accepted = false;
        break;
      }
      const existing = next.findIndex((t) => t.toLowerCase() === tag.toLowerCase());
      if (!allowDuplicates && existing !== -1) {
        shake(scope.current?.querySelector(`[data-tag-index="${existing}"]`));
        setAnnouncement(`${tag} is already added`);
        continue;
      }
      if (validate && !validate(tag)) {
        shake(scope.current);
        setAnnouncement(`${tag} isn't valid`);
        accepted = false;
        continue;
      }
      next.push(tag);
      setAnnouncement(`Added ${tag}`);
    }
    if (next.length !== tags.length) commit(next);
    return accepted;
  }

  function remove(index: number) {
    const tag = tags[index];
    commit(tags.filter((_, i) => i !== index));
    setAnnouncement(`Removed ${tag}`);
    setArmed(false);
    inputRef.current?.focus();
  }

  function handleDraft(text: string) {
    const splitter = splitChars.find((ch) => text.includes(ch));
    if (!splitter) {
      setDraft(text);
      return;
    }
    // Typing (or a mobile keyboard) produced a separator: everything before the last one becomes tags.
    const parts = text.split(splitPattern);
    const rest = parts.pop() ?? "";
    const ok = add(parts);
    setDraft(ok ? rest : parts.join(splitter) + rest);
  }

  const occurrences = new Map<string, number>();

  return (
    <div
      ref={scope}
      onClick={(event) => {
        if (event.target === event.currentTarget) inputRef.current?.focus();
      }}
      className={cn(
        "flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5 shadow-xs",
        "transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {tags.map((tag, index) => {
          const seen = occurrences.get(tag) ?? 0;
          occurrences.set(tag, seen + 1);
          const highlighted = armed && index === tags.length - 1;
          return (
            <motion.span
              key={`${tag}::${seen}`}
              data-tag-index={index}
              layout={!reduceMotion}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={
                reduceMotion
                  ? { opacity: 0, transition: { duration: 0.12 } }
                  : { opacity: 0, scale: 0.6, filter: "blur(4px)", transition: { duration: 0.16, ease: ease.out } }
              }
              transition={
                reduceMotion
                  ? { duration: 0.12 }
                  : { ...spring.bouncy, opacity: { duration: 0.15 }, filter: { duration: 0.2 }, layout: spring.snappy }
              }
              className={cn(
                "inline-flex h-7 max-w-full cursor-default items-center gap-0.5 rounded-[7px] border bg-secondary pr-0.5 pl-2.5 text-[13px] font-medium text-secondary-foreground transition-[border-color,box-shadow] duration-150",
                highlighted ? "border-ring ring-2 ring-ring/25" : "border-border",
              )}
            >
              <span className="truncate">{tag}</span>
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => remove(index)}
                className="relative inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[5px] text-muted-foreground outline-none after:absolute after:-inset-1 hover:bg-foreground/[0.07] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </motion.span>
          );
        })}
      </AnimatePresence>

      <motion.input
        ref={inputRef}
        layout={reduceMotion ? false : "position"}
        transition={spring.snappy}
        value={draft}
        disabled={disabled}
        placeholder={full ? "" : placeholder}
        aria-describedby={[hintId, describedBy].filter(Boolean).join(" ")}
        onChange={(event) => {
          setArmed(false);
          handleDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.nativeEvent.isComposing) return;
          if (event.key === "Enter" && separators.includes("Enter") && draft.trim()) {
            event.preventDefault();
            if (add([draft])) setDraft("");
          } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
            // First press highlights the last tag, the second removes it.
            event.preventDefault();
            if (armed) remove(tags.length - 1);
            else setArmed(true);
          } else if (armed && event.key !== "Shift") {
            setArmed(false);
          }
        }}
        onPaste={(event) => {
          onPaste?.(event);
          const text = event.clipboardData.getData("text");
          if (!splitPattern.test(text)) return;
          event.preventDefault();
          add(text.split(splitPattern));
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setArmed(false);
          if (addOnBlur && draft.trim() && add([draft])) setDraft("");
        }}
        className="h-7 min-w-24 flex-1 bg-transparent px-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        {...props}
      />

      {maxTags !== undefined ? (
        <span className="ml-auto shrink-0 px-1.5 font-mono text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
          {tags.length}/{maxTags}
        </span>
      ) : null}
      <span id={hintId} className="sr-only">
        Press Enter{splitChars.includes(",") ? " or comma" : ""} to add a tag. Press Backspace twice to remove the last tag.
        {maxTags !== undefined ? ` ${tags.length} of ${maxTags} tags used.` : ""}
      </span>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
