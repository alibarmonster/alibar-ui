"use client";

import { useEffect, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, motion, stagger, useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface ChatMessage {
  /** Stable identity. */
  id: string;
  /** Who sent it. */
  role: "user" | "assistant";
  /** Message content. */
  content: ReactNode;
  /** Optional timestamp shown under the last message of a group. */
  time?: string;
}

export interface ChatBubblesProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Messages, oldest first. */
  messages: ChatMessage[];
  /** Show the assistant's typing indicator after the last message. @default false */
  typing?: boolean;
  /** Name read before assistant messages. @default "Assistant" */
  assistantLabel?: string;
  /** Name read before user messages. @default "You" */
  userLabel?: string;
}

const ENTER = { type: "spring", stiffness: 420, damping: 30, mass: 0.8 } as const;

/** Bouncing dots. Started imperatively so they run even if `typing` is true on first render. */
function TypingDots({ reduceMotion }: { reduceMotion: boolean }) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  useEffect(() => {
    const controls = animate(
      "span",
      reduceMotion ? { opacity: [0.35, 1, 0.35] } : { y: [0, -4, 0], opacity: [0.45, 1, 0.45] },
      { duration: 0.9, repeat: Infinity, delay: stagger(0.15), ease: "easeInOut" },
    );
    return () => controls.stop();
  }, [animate, reduceMotion]);
  return (
    <span ref={scope} aria-hidden="true" className="flex h-10 items-center gap-1 rounded-2xl bg-muted px-4">
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="size-1.5 rounded-full bg-muted-foreground" />
      ))}
    </span>
  );
}

export function ChatBubbles({ messages, typing = false, assistantLabel = "Assistant", userLabel = "You", className, ...props }: ChatBubblesProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div role="log" aria-live="polite" aria-relevant="additions" className={className} {...props}>
      <ol className="flex flex-col gap-1">
      {/* initial={false}: messages present on first render don't animate in; new ones do. */}
      <AnimatePresence initial={false}>
        {messages.map((message, i) => {
          const user = message.role === "user";
          const startsGroup = messages[i - 1]?.role !== message.role;
          const endsGroup = messages[i + 1]?.role !== message.role;
          return (
            <motion.li
              key={message.id}
              layout={!reduceMotion}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: duration.quick } }}
              transition={reduceMotion ? { duration: duration.base } : ENTER}
              style={{ originX: user ? 1 : 0, originY: 1 }}
              className={cn("flex max-w-[85%] flex-col", user ? "items-end self-end" : "items-start self-start", startsGroup && i > 0 && "mt-2")}
            >
              <div
                className={cn(
                  "px-3.5 py-2 text-sm leading-6",
                  user ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  // Consecutive messages from one sender share tighter inner corners, like a thread.
                  "rounded-2xl",
                  user ? !startsGroup && "rounded-tr-md" : !startsGroup && "rounded-tl-md",
                  user ? !endsGroup && "rounded-br-md" : !endsGroup && "rounded-bl-md",
                )}
              >
                <span className="sr-only">{user ? userLabel : assistantLabel}: </span>
                {message.content}
              </div>
              {endsGroup && message.time ? <span className="mt-1 px-1 text-[11px] text-muted-foreground">{message.time}</span> : null}
            </motion.li>
          );
        })}
        {typing ? (
          <motion.li
            key="typing"
            layout={!reduceMotion}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.9, transition: { duration: duration.quick } }}
            transition={reduceMotion ? { duration: duration.base } : ENTER}
            style={{ originX: 0, originY: 1 }}
            className="mt-2 self-start"
          >
            <span className="sr-only">{assistantLabel} is typing</span>
            <TypingDots reduceMotion={!!reduceMotion} />
          </motion.li>
        ) : null}
      </AnimatePresence>
      </ol>
    </div>
  );
}
