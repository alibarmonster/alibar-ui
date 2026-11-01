"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export type ToastStatus = "default" | "loading" | "success" | "error" | "info";

export interface ToastOptions {
  /** Main line. */
  title: ReactNode;
  /** Secondary line. */
  description?: ReactNode;
  /** Icon and announcement style. Loading toasts stay until updated. */
  status?: ToastStatus;
  /** Milliseconds before auto-dismiss; Infinity keeps it open. */
  duration?: number;
  /** One action button, e.g. Undo. */
  action?: { label: string; onClick: () => void };
}

interface ToastRecord extends ToastOptions {
  id: string;
}

export interface ToastApi {
  /** Shows a toast and returns its id. */
  toast: (options: ToastOptions | string) => string;
  /** Changes an existing toast in place, e.g. loading → success. */
  update: (id: string, options: Partial<ToastOptions>) => void;
  /** Dismisses one toast, or all of them without an id. */
  dismiss: (id?: string) => void;
  /** Shows a loading toast that turns into success or error when the promise settles. */
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: ReactNode; success: ReactNode | ((value: T) => ReactNode); error: ReactNode | ((error: unknown) => ReactNode) },
  ) => Promise<T>;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Access the toast API from anywhere inside a ToastProvider. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>.");
  return api;
}

export interface ToastProviderProps {
  /** Your app. */
  children: ReactNode;
  /** Corner the stack lives in. @default "bottom-right" */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Default milliseconds before a toast auto-dismisses. @default 4000 */
  duration?: number;
  /** Toasts visible in the collapsed stack. @default 3 */
  visibleToasts?: number;
}

const GAP = 10;
// How far each collapsed toast peeks out from behind the one in front.
const PEEK = 14;
let counter = 0;

export function ToastProvider({ children, position = "bottom-right", duration: defaultDuration = 4000, visibleToasts = 3 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id?: string) => {
    setToasts((list) => (id ? list.filter((t) => t.id !== id) : []));
  }, []);

  const toast = useCallback((options: ToastOptions | string) => {
    const id = `toast-${++counter}`;
    const record = typeof options === "string" ? { id, title: options } : { id, ...options };
    // Newest first; keep a short history so the DOM stays small.
    setToasts((list) => [record, ...list].slice(0, visibleToasts + 3));
    return id;
  }, [visibleToasts]);

  const update = useCallback((id: string, options: Partial<ToastOptions>) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, ...options } : t)));
  }, []);

  const promise = useCallback<ToastApi["promise"]>(
    (task, messages) => {
      const id = toast({ title: messages.loading, status: "loading" });
      task.then(
        (value) =>
          update(id, {
            status: "success",
            title: typeof messages.success === "function" ? messages.success(value) : messages.success,
          }),
        (error) =>
          update(id, {
            status: "error",
            title: typeof messages.error === "function" ? (messages.error as (e: unknown) => ReactNode)(error) : messages.error,
          }),
      );
      return task;
    },
    [toast, update],
  );

  const api = useMemo(() => ({ toast, update, dismiss, promise }), [toast, update, dismiss, promise]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport
        toasts={toasts}
        position={position}
        defaultDuration={defaultDuration}
        visibleToasts={visibleToasts}
        onDismiss={dismiss}
      />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  position,
  defaultDuration,
  visibleToasts,
  onDismiss,
}: {
  toasts: ToastRecord[];
  position: NonNullable<ToastProviderProps["position"]>;
  defaultDuration: number;
  visibleToasts: number;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const bottom = position.startsWith("bottom");
  const reportHeight = useCallback((id: string, height: number) => {
    setHeights((h) => (h[id] === height ? h : { ...h, [id]: height }));
  }, []);

  // Collapse again once the stack empties, so the next toast starts stacked.
  const isExpanded = expanded && toasts.length > 0;
  const frontHeight = heights[toasts[0]?.id] ?? 0;

  return (
    <section
      aria-label="Notifications"
      tabIndex={-1}
      className={cn(
        "pointer-events-none fixed z-[70] w-[min(22rem,calc(100vw-2rem))]",
        bottom ? "bottom-4" : "top-4",
        position.endsWith("right") ? "right-4" : "left-4",
      )}
    >
      <ol
        onPointerEnter={() => setExpanded(true)}
        onPointerLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setExpanded(false);
        }}
        className="relative"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast, index) => {
            const before = toasts.slice(0, index).reduce((sum, t) => sum + (heights[t.id] ?? 0) + GAP, 0);
            return (
              <ToastItem
                key={toast.id}
                toast={toast}
                index={index}
                offset={isExpanded ? before : index * PEEK}
                expanded={isExpanded}
                hidden={index >= visibleToasts}
                frontHeight={frontHeight}
                bottom={bottom}
                defaultDuration={defaultDuration}
                onHeight={reportHeight}
                onDismiss={onDismiss}
              />
            );
          })}
        </AnimatePresence>
      </ol>
    </section>
  );
}

function StatusIcon({ status }: { status: ToastStatus }) {
  const reduceMotion = useReducedMotion();
  if (status === "default") return null;
  const color = { loading: "text-muted-foreground", success: "text-success", error: "text-destructive", info: "text-primary" }[status];
  return (
    <span className={cn("relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center", color)} aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.svg
          key={status}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[18px]"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.5 }}
          transition={reduceMotion ? { duration: duration.quick } : spring.snappy}
        >
          {status === "loading" ? (
            <g className="origin-center animate-spin [transform-box:fill-box] motion-reduce:animate-pulse">
              <circle cx="12" cy="12" r="9" strokeOpacity={0.25} />
              <path d="M21 12a9 9 0 0 0-9-9" />
            </g>
          ) : (
            <>
              <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity={0.14} />
              <motion.path
                d={status === "success" ? "M7.5 12.5l3 3L16.5 9" : status === "error" ? "M9 9l6 6M15 9l-6 6" : "M12 11v5M12 8h.01"}
                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: duration.base, ease: ease.out, delay: 0.08 }}
              />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
    </span>
  );
}

function ToastItem({
  toast,
  index,
  offset,
  expanded,
  hidden,
  frontHeight,
  bottom,
  defaultDuration,
  onHeight,
  onDismiss,
}: {
  toast: ToastRecord;
  index: number;
  offset: number;
  expanded: boolean;
  hidden: boolean;
  frontHeight: number;
  bottom: boolean;
  defaultDuration: number;
  onHeight: (id: string, height: number) => void;
  onDismiss: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [swipe, setSwipe] = useState(0);
  const status = toast.status ?? "default";
  const life = status === "loading" ? Infinity : (toast.duration ?? defaultDuration);
  const collapsedBehind = !expanded && index > 0;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => onHeight(toast.id, el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [toast.id, onHeight]);

  // Auto-dismiss; the clock pauses while the stack is expanded and restarts on updates.
  const remaining = useRef(life);
  useEffect(() => {
    remaining.current = life;
  }, [life, toast.title]);
  useEffect(() => {
    if (expanded || !Number.isFinite(remaining.current)) return;
    const started = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [expanded, life, toast.title, toast.id, onDismiss]);

  const direction = bottom ? -1 : 1;
  const scale = expanded ? 1 : 1 - index * 0.05;

  return (
    <motion.li
      drag={index === 0 || expanded ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={(_: unknown, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 450) {
          setSwipe(Math.sign(info.offset.x || info.velocity.x));
          onDismiss(toast.id);
        }
      }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: direction * -24, scale: 0.96 }}
      animate={{
        opacity: hidden ? 0 : 1,
        y: reduceMotion ? 0 : direction * offset,
        scale: reduceMotion ? 1 : scale,
      }}
      exit={
        swipe
          ? { opacity: 0, x: `${swipe * 110}%`, transition: { duration: duration.base, ease: ease.out } }
          : { opacity: 0, scale: reduceMotion ? 1 : 0.94, transition: { duration: duration.quick } }
      }
      transition={reduceMotion ? { duration: duration.quick } : { type: "spring", stiffness: 380, damping: 32 }}
      style={{ zIndex: 100 - index }}
      className={cn(
        "pointer-events-auto absolute inset-x-0 touch-pan-y",
        bottom ? "bottom-0 origin-bottom" : "top-0 origin-top",
        hidden && "pointer-events-none",
      )}
      aria-hidden={hidden || undefined}
    >
      <div
        ref={contentRef}
        role={status === "error" ? "alert" : "status"}
        aria-live={status === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        // Behind the front toast, every card takes its height so the stack reads as a tidy deck.
        style={collapsedBehind && frontHeight ? { height: frontHeight } : undefined}
        className="relative flex w-full items-start gap-3 overflow-hidden rounded-[14px] border border-border bg-popover p-3.5 pr-10 text-popover-foreground shadow-lg"
      >
        <motion.div
          className="flex min-w-0 flex-1 items-start gap-3"
          animate={{ opacity: collapsedBehind ? 0 : 1 }}
          transition={{ duration: duration.quick }}
        >
          <StatusIcon status={status} />
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={status}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, transition: { duration: duration.instant } }}
                transition={{ duration: duration.quick, ease: ease.out }}
              >
                <p className="text-sm font-medium text-foreground">{toast.title}</p>
                {toast.description ? <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{toast.description}</p> : null}
              </motion.div>
            </AnimatePresence>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="mt-2 inline-flex h-7 cursor-pointer items-center rounded-md bg-foreground px-2.5 text-xs font-medium text-background outline-none hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring"
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        </motion.div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(toast.id)}
          className="absolute top-2.5 right-2.5 inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors after:absolute after:-inset-2 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </motion.li>
  );
}
