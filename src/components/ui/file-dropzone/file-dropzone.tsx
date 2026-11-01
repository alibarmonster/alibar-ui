"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type DragEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CloudUpload,
  File as FileIcon,
  FileArchive,
  FileImage,
  FileMusic,
  FileSpreadsheet,
  FileText,
  FileVideoCamera,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export interface FileDropzoneProps
  extends Omit<ComponentProps<"div">, "onDrop" | "onChange" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Accepted types, as for the input accept attribute, e.g. "image/*,.pdf". */
  accept?: string;
  /** Allow several files at once. @default true */
  multiple?: boolean;
  /** Largest accepted file, in bytes. */
  maxSize?: number;
  /** Maximum number of accepted files in the list. */
  maxFiles?: number;
  /** Uploads one file. Call report(0–100) for progress; resolve when done or throw to fail. Without it, files are accepted immediately. */
  onUpload?: (file: File, report: (progress: number) => void) => Promise<void>;
  /** Called with every successfully added file whenever that list changes. */
  onFilesChange?: (files: File[]) => void;
  /** Disables the dropzone. @default false */
  disabled?: boolean;
  /** Main prompt. @default "Drop files here or click to browse" */
  label?: string;
  /** Secondary line, e.g. allowed types and size. */
  hint?: string;
}

type Status = "uploading" | "done" | "error";

interface Item {
  id: string;
  file: File;
  status: Status;
  progress: number;
  error?: string;
  retryable?: boolean;
  preview?: string;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

function accepts(file: File, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) =>
      rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule,
    );
}

function iconFor(file: File) {
  const { type, name } = file;
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return FileVideoCamera;
  if (type.startsWith("audio/")) return FileMusic;
  if (/zip|rar|7z|tar|gzip/.test(type) || /\.(zip|rar|7z|tgz|gz)$/i.test(name)) return FileArchive;
  if (/sheet|excel|csv/.test(type) || /\.(xlsx?|csv)$/i.test(name)) return FileSpreadsheet;
  if (type.startsWith("text/") || type === "application/pdf" || /\.(pdf|docx?|md|txt)$/i.test(name)) return FileText;
  return FileIcon;
}

function ProgressRing({ item }: { item: Item }) {
  const reduceMotion = useReducedMotion();
  const stroke =
    item.status === "error" ? "stroke-destructive" : item.status === "done" ? "stroke-success" : "stroke-primary";
  const pop = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.5 } };

  return (
    <span
      className="relative flex size-8 shrink-0 items-center justify-center"
      role={item.status === "uploading" ? "progressbar" : undefined}
      aria-label={item.status === "uploading" ? `Uploading ${item.file.name}` : undefined}
      aria-valuenow={item.status === "uploading" ? Math.round(item.progress) : undefined}
      aria-valuemin={item.status === "uploading" ? 0 : undefined}
      aria-valuemax={item.status === "uploading" ? 100 : undefined}
    >
      <svg viewBox="0 0 32 32" fill="none" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="16" cy="16" r="13" strokeWidth="2.5" className="stroke-border" />
        <motion.circle
          cx="16"
          cy="16"
          r="13"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={cn("transition-[stroke] duration-200", stroke)}
          initial={false}
          animate={{ pathLength: item.progress / 100, opacity: item.progress > 0 ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : spring.smooth}
        />
      </svg>
      <AnimatePresence mode="popLayout" initial={false}>
        {item.status === "uploading" ? (
          <motion.span
            key="percent"
            {...pop}
            aria-hidden="true"
            className="text-[9px] font-semibold text-muted-foreground tabular-nums"
          >
            {Math.round(item.progress)}
          </motion.span>
        ) : item.status === "done" ? (
          <motion.svg key="done" {...pop} viewBox="0 0 24 24" fill="none" className="size-3.5 text-success" aria-hidden="true">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration.base, ease: ease.out, delay: 0.1 }}
            />
          </motion.svg>
        ) : (
          <motion.span key="error" {...pop} className="text-destructive" aria-hidden="true">
            <X className="size-3.5" strokeWidth={2.75} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function FileDropzone({
  accept,
  multiple = true,
  maxSize,
  maxFiles,
  onUpload,
  onFilesChange,
  disabled = false,
  label = "Drop files here or click to browse",
  hint,
  className,
  ...props
}: FileDropzoneProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const mounted = useRef(true);
  const latestItems = useRef(items);
  const onFilesChangeRef = useRef(onFilesChange);
  const reduceMotion = useReducedMotion();
  const hintId = useId();

  useEffect(() => {
    latestItems.current = items;
    onFilesChangeRef.current = onFilesChange;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      latestItems.current.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    };
  }, []);

  // Report the accepted files only when that set changes, not on every progress tick.
  const doneKey = items
    .filter((i) => i.status === "done")
    .map((i) => i.id)
    .join("|");
  useEffect(() => {
    onFilesChangeRef.current?.(latestItems.current.filter((i) => i.status === "done").map((i) => i.file));
  }, [doneKey]);

  const patch = (id: string, update: Partial<Item>) =>
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...update } : item)));

  async function upload(item: Item) {
    if (!onUpload) return;
    patch(item.id, { status: "uploading", progress: 0, error: undefined, retryable: false });
    try {
      await onUpload(item.file, (progress) => {
        if (mounted.current) patch(item.id, { progress: Math.min(Math.max(progress, 0), 100) });
      });
      if (!mounted.current) return;
      patch(item.id, { status: "done", progress: 100 });
      setAnnouncement(`${item.file.name} uploaded`);
    } catch {
      if (!mounted.current) return;
      patch(item.id, { status: "error", error: "Upload failed", retryable: true });
      setAnnouncement(`${item.file.name} failed to upload`);
    }
  }

  function addFiles(fileList: FileList | File[] | null) {
    if (!fileList || disabled) return;
    const files = Array.from(fileList).slice(0, multiple ? undefined : 1);
    if (!files.length) return;
    const kept = multiple ? items : [];
    if (!multiple) items.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));

    let accepted = kept.filter((i) => i.status !== "error").length;
    const added = files.map((file): Item => {
      let error: string | undefined;
      if (!accepts(file, accept)) error = "File type not allowed";
      else if (maxSize !== undefined && file.size > maxSize) error = `Larger than ${formatBytes(maxSize)}`;
      else if (maxFiles !== undefined && accepted >= maxFiles) error = `Limit of ${maxFiles} files reached`;
      if (!error) accepted++;
      return {
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        status: error ? "error" : onUpload ? "uploading" : "done",
        progress: error ? 0 : onUpload ? 0 : 100,
        error,
        preview: !error && file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      };
    });

    setItems([...kept, ...added]);
    const ok = added.filter((i) => !i.error).length;
    setAnnouncement(
      `${ok} file${ok === 1 ? "" : "s"} added` + (added.length > ok ? `, ${added.length - ok} rejected` : ""),
    );
    added.filter((i) => !i.error).forEach(upload);
  }

  function remove(item: Item) {
    if (item.preview) URL.revokeObjectURL(item.preview);
    setItems((list) => list.filter((i) => i.id !== item.id));
    setAnnouncement(`${item.file.name} removed`);
  }

  const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes("Files");

  return (
    <div className={cn("w-full", className)} {...props}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-describedby={hintId}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!hasFiles(event) || disabled) return;
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        animate={{ scale: dragging && !reduceMotion ? 1.015 : 1 }}
        transition={spring.smooth}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border px-6 py-10 text-center outline-none",
          "transition-[border-color,background-color] duration-200 focus-visible:ring-3 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          dragging ? "border-solid border-primary" : "border-dashed border-input hover:bg-accent/50",
        )}
      >
        {/* A tint layer fades in while dragging instead of animating the background color. */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-primary/[0.05]"
          initial={false}
          animate={{ opacity: dragging ? 1 : 0 }}
          transition={{ duration: duration.quick }}
        />
        <motion.span
          aria-hidden="true"
          animate={dragging && !reduceMotion ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
          transition={spring.bouncy}
          className="relative flex size-12 items-center justify-center rounded-full border border-border bg-background shadow-sm"
        >
          <CloudUpload
            className={cn("size-5 transition-colors duration-200", dragging ? "text-primary" : "text-muted-foreground")}
          />
        </motion.span>
        <span className="relative grid text-sm font-medium text-foreground *:[grid-area:1/1]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={dragging ? "drop" : "idle"}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ duration: duration.quick, ease: ease.out }}
            >
              {dragging ? "Drop to upload" : label}
            </motion.span>
          </AnimatePresence>
        </span>
        <span id={hintId} className="relative text-[13px] text-muted-foreground">
          {hint ?? (multiple ? "You can add several files at once." : "One file.")}
        </span>
      </motion.button>

      <input
        ref={inputRef}
        type="file"
        hidden
        tabIndex={-1}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {items.length > 0 ? (
        <ul className="relative mt-3 space-y-2" aria-label="Files">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item) => {
              const Icon = iconFor(item.file);
              return (
                <motion.li
                  key={item.id}
                  layout={!reduceMotion}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, filter: "blur(2px)" }}
                  transition={{ duration: duration.base, ease: ease.out, layout: spring.smooth }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-2 pr-1.5 shadow-xs"
                >
                  <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground">
                    <Icon className="size-[18px]" aria-hidden="true" />
                    {item.preview ? (
                      // The icon stays underneath, so an undecodable image falls back to it.
                      // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                      <img
                        src={item.preview}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{item.file.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                      {" · "}
                      {item.status === "error" ? (
                        <span className="text-destructive">{item.error}</span>
                      ) : item.status === "done" ? (
                        "Uploaded"
                      ) : (
                        "Uploading…"
                      )}
                    </span>
                  </span>
                  <ProgressRing item={item} />
                  <span className="flex shrink-0 items-center">
                    {item.retryable ? (
                      <button
                        type="button"
                        aria-label={`Retry ${item.file.name}`}
                        onClick={() => upload(item)}
                        className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none after:absolute after:-inset-1 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => remove(item)}
                      className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none after:absolute after:-inset-1 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      ) : null}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
