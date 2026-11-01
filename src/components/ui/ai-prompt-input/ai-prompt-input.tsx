"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type DragEvent, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { ArrowUp, FileText, Paperclip, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface PromptAttachment {
  /** Stable identity. */
  id: string;
  /** File name shown on the chip. */
  name: string;
  /** Size in bytes. */
  size?: number;
  /** The file itself, when it came from the picker or a drop. */
  file?: File;
}

export interface AIPromptInputProps
  extends Omit<ComponentProps<"form">, "children" | "onSubmit" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Controlled text. */
  value?: string;
  /** Initial text when uncontrolled. @default "" */
  defaultValue?: string;
  /** Called as the text changes. */
  onValueChange?: (value: string) => void;
  /** Called on Enter or the send button with the text and attachments; the input then clears. */
  onSubmit?: (value: string, attachments: PromptAttachment[]) => void;
  /** Placeholder text. @default "Ask anything…" */
  placeholder?: string;
  /** A response is streaming: the border orbits and the send button becomes stop. @default false */
  loading?: boolean;
  /** Called when stop is pressed while loading. */
  onStop?: () => void;
  /** Allow attaching files (button and drag-and-drop). @default true */
  allowAttachments?: boolean;
  /** File types for the picker, e.g. "image/*,.pdf". */
  accept?: string;
  /** Rows the textarea grows to before it scrolls. @default 8 */
  maxRows?: number;
  /** Extra controls on the left of the toolbar, e.g. a model picker. */
  toolbar?: ReactNode;
}

const formatSize = (bytes?: number) =>
  bytes === undefined ? "" : bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

export function AIPromptInput({
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  placeholder = "Ask anything…",
  loading = false,
  onStop,
  allowAttachments = true,
  accept,
  maxRows = 8,
  toolbar,
  className,
  "aria-label": ariaLabel = "Message",
  ...props
}: AIPromptInputProps) {
  const reduceMotion = useReducedMotion();
  const [internal, setInternal] = useState(defaultValue);
  const text = value ?? internal;
  const [attachments, setAttachments] = useState<PromptAttachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const fieldId = useId();
  const canSend = !loading && (text.trim().length > 0 || attachments.length > 0);
  const [orbit, animateOrbit] = useAnimate<HTMLSpanElement>();

  // The orbit loop is started imperatively, so it also runs when the input first renders already loading.
  useEffect(() => {
    if (!loading || reduceMotion || !orbit.current) return;
    const controls = animateOrbit(orbit.current, { rotate: [0, 360] }, { duration: 2.2, repeat: Infinity, ease: "linear" });
    return () => controls.stop();
  }, [loading, reduceMotion, animateOrbit, orbit]);

  const setText = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  // Grow with the content up to maxRows, then scroll.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const line = parseFloat(getComputedStyle(el).lineHeight) || 24;
    el.style.height = `${Math.min(el.scrollHeight, line * maxRows)}px`;
  }, [text, maxRows]);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    // Copy now: the FileList is live and empties when the input is reset right after.
    const added = Array.from(files, (file) => ({ id: `${file.name}-${counter.current++}`, name: file.name, size: file.size, file }));
    setAttachments((list) => [...list, ...added]);
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSend) return;
    onSubmit?.(text.trim(), attachments);
    setText("");
    setAttachments([]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a line; never send mid-composition (IME).
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const onDrop = (event: DragEvent<HTMLFormElement>) => {
    if (!allowAttachments) return;
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <form
      onSubmit={submit}
      onDragOver={(event) => {
        if (!allowAttachments || !event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => !event.currentTarget.contains(event.relatedTarget as Node) && setDragging(false)}
      onDrop={onDrop}
      className={cn("group/prompt relative isolate overflow-hidden rounded-[18px] p-px", className)}
      {...props}
    >
      {/* Border: a hairline at rest, accent on focus, and a conic sweep that orbits while loading. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10 rounded-[inherit] transition-colors duration-200",
          dragging ? "bg-primary" : "bg-border group-focus-within/prompt:bg-primary/45",
        )}
      />
      <motion.span
        ref={orbit}
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -z-10 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "conic-gradient(from 0deg, transparent 0deg, var(--primary) 70deg, transparent 140deg)" }}
        initial={false}
        animate={{ opacity: loading ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <div className="rounded-[17px] bg-background">
        <AnimatePresence initial={false}>
          {attachments.length ? (
            <motion.ul
              aria-label="Attachments"
              className="flex flex-wrap gap-2 px-3 pt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence initial={false}>
                {attachments.map((attachment) => (
                  <motion.li
                    key={attachment.id}
                    layout={!reduceMotion}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.9, transition: { duration: duration.quick } }}
                    transition={{ duration: duration.base, ease: ease.out }}
                    className="flex max-w-56 items-center gap-2 rounded-lg border border-border bg-surface py-1.5 pr-1 pl-2 text-xs"
                  >
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0 truncate text-foreground">{attachment.name}</span>
                    {attachment.size !== undefined ? <span className="shrink-0 text-muted-foreground">{formatSize(attachment.size)}</span> : null}
                    <button
                      type="button"
                      onClick={() => setAttachments((list) => list.filter((a) => a.id !== attachment.id))}
                      aria-label={`Remove ${attachment.name}`}
                      className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          ) : null}
        </AnimatePresence>
        <label htmlFor={fieldId} className="sr-only">
          {ariaLabel}
        </label>
        <textarea
          ref={textareaRef}
          id={fieldId}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-2 px-2.5 pb-2.5">
          {allowAttachments ? (
            <>
              <input ref={fileRef} type="file" multiple accept={accept} className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} tabIndex={-1} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Attach files"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Paperclip className="size-4" aria-hidden="true" />
              </button>
            </>
          ) : null}
          {toolbar}
          <div className="flex-1" />
          {loading ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground text-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Square className="size-3 fill-current" aria-hidden="true" />
            </button>
          ) : (
            <motion.button
              type="submit"
              aria-label="Send message"
              disabled={!canSend}
              animate={{ scale: canSend || reduceMotion ? 1 : 0.92 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground text-background outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </motion.button>
          )}
        </div>
      </div>
    </form>
  );
}
