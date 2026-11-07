"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Hash, MoreHorizontal, Reply, SmilePlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

/* ------------------------------------------------------------------ FlowLines */

export interface FlowLinesProps extends Omit<ComponentProps<"svg">, "children"> {
  /** Number of lines. @default 16 */
  lines?: number;
  /** Line color. @default "#3b82f6" */
  color?: string;
  /** How far lines bend toward the pointer, 0–1. @default 0.6 */
  bend?: number;
  /** Flow speed multiplier; read every frame. @default 1 */
  speed?: number;
}

/**
 * A field of thin lines curving like a current. Dashes flow along them (CSS) while a small loop
 * reshapes the curves over time and bends them toward the pointer over the parent element. Pauses
 * offscreen and in hidden tabs; static under reduced motion. Place it absolutely behind content.
 */
export function FlowLines({ lines = 16, color = "#3b82f6", bend = 0.6, speed = 1, className, ...props }: FlowLinesProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientId = useId();
  const live = useRef({ bend, speed });
  useEffect(() => {
    live.current = { bend, speed };
  });

  useEffect(() => {
    const svg = svgRef.current;
    const host = svg?.parentElement;
    if (!svg || !host) return;
    const paths = [...svg.querySelectorAll<SVGPathElement>("path[data-flow]")];
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let w = 1;
    let h = 1;
    let raf = 0;
    let last = 0;
    let time = 3;
    let visible = true;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, k: 0, on: false };

    const shape = () => {
      const { bend: b } = live.current;
      paths.forEach((path, i) => {
        const n = paths.length;
        const base = ((i + 0.5) / n) * h;
        const amp = h * (0.05 + ((i * 37) % 7) * 0.012);
        const phase = i * 1.3;
        let d = "";
        for (let s = 0; s <= 28; s++) {
          const x = (s / 28) * (w + 40) - 20;
          let y = base + Math.sin(x * 0.012 + phase + time * 0.35) * amp + Math.sin(x * 0.031 - time * 0.5 + i) * amp * 0.35;
          if (pointer.k > 0.01) {
            const fall = Math.exp(-((x - pointer.x) ** 2) / (2 * (w * 0.16) ** 2)) * Math.exp(-((base - pointer.y) ** 2) / (2 * (h * 0.32) ** 2));
            y += (pointer.y - y) * fall * b * pointer.k;
          }
          d += `${s ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        path.setAttribute("d", d);
      });
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      time += dt * live.current.speed;
      const e = 1 - Math.exp(-dt * 6);
      pointer.x += (pointer.tx - pointer.x) * e;
      pointer.y += (pointer.ty - pointer.y) * e;
      pointer.k += ((pointer.on ? 1 : 0) - pointer.k) * e;
      shape();
      schedule();
    };
    const schedule = () => {
      if (!raf && visible && !document.hidden && !media.matches) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      last = 0;
      schedule();
    };

    const ro = new ResizeObserver(() => {
      w = Math.max(1, svg.clientWidth);
      h = Math.max(1, svg.clientHeight);
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      shape();
    });
    ro.observe(svg);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      wake();
    });
    io.observe(svg);
    const onMove = (event: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      pointer.tx = event.clientX - rect.left;
      pointer.ty = event.clientY - rect.top;
      if (!pointer.on && pointer.k < 0.05) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.on = true;
    };
    const onLeave = () => {
      pointer.on = false;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", wake);
    media.addEventListener("change", wake);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", wake);
      media.removeEventListener("change", wake);
    };
  }, [lines]);

  return (
    <svg ref={svgRef} aria-hidden="true" preserveAspectRatio="none" className={cn("pointer-events-none absolute inset-0 size-full", className)} {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.35" stopColor={color} stopOpacity="0.85" />
          <stop offset="0.7" stopColor={color} stopOpacity="0.5" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <style>{`@keyframes flow-line-dash{to{stroke-dashoffset:-240}}`}</style>
      {Array.from({ length: lines }, (_, i) => (
        <path
          key={i}
          data-flow=""
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={i % 4 === 0 ? 1.4 : 0.8}
          strokeLinecap="round"
          strokeDasharray={i % 3 === 0 ? "60 180" : i % 3 === 1 ? "2 10" : "24 36"}
          className="motion-reduce:[animation:none]"
          style={{ animation: `flow-line-dash ${6 + (i % 5) * 1.7}s linear infinite`, animationDelay: `${-i * 0.7}s` }}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ chat card */

export interface FlowChatReaction {
  emoji: string;
  count: number;
}

export interface FlowChatMessage {
  id: string;
  author: string;
  text: string;
  /** Avatar image; without it, initials on `color`. */
  avatar?: string;
  /** Avatar color. @default a blue */
  color?: string;
  time?: string;
  reactions?: FlowChatReaction[];
  /** A system line ("Sana joined the server") instead of a message. */
  system?: boolean;
}

export interface FlowLineChatCardProps extends Omit<ComponentProps<"article">, "title"> {
  /** Feature title under the illustration. @default "Conversations that keep flowing" */
  title?: string;
  /** One-line description under the title. */
  description?: string;
  /** Messages shown one by one, in order. @default a sample design channel */
  messages?: FlowChatMessage[];
  /** Channel name and member count in the header. @default { name: "design-crit", members: 128 } */
  channel?: { name: string; members: number };
}

const SAMPLE: FlowChatMessage[] = [
  { id: "m1", author: "Maya", color: "#2563eb", time: "9:41", text: "Pushed the new onboarding flow to staging.", reactions: [{ emoji: "🚀", count: 4 }] },
  { id: "m2", author: "Jonas", color: "#0ea5e9", time: "9:42", text: "Step transitions feel really smooth now.", reactions: [{ emoji: "🔥", count: 3 }, { emoji: "👀", count: 2 }] },
  { id: "j1", author: "Sana", text: "Sana joined the server", system: true },
  { id: "m3", author: "Lena", color: "#6366f1", time: "9:44", text: "Could the progress bar be a little bouncier?" },
  { id: "m4", author: "Raka", color: "#1d4ed8", time: "9:45", text: "On it, shipping a spring preset tonight.", reactions: [{ emoji: "💙", count: 5 }] },
];

const STEP_MS = 1100;

function Count({ to, run }: { to: number; run: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Counts up once the reaction pops in (written to the DOM, no re-renders per step).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!run) {
      el.textContent = String(to);
      return;
    }
    let n = 0;
    el.textContent = "0";
    const id = window.setInterval(() => {
      n += 1;
      el.textContent = String(Math.min(n, to));
      if (n >= to) window.clearInterval(id);
    }, 110);
    return () => window.clearInterval(id);
  }, [to, run]);
  return <span ref={ref} className="tabular-nums" />;
}

/**
 * An animated feature card for a community chat product: a dark card with flowing blue lines behind
 * a mini channel whose messages arrive one by one after a typing indicator, with reactions that pop
 * in and count up and a "joined" system line. Hovering a message outlines it and shows a toolbar;
 * the lines bend toward the pointer. A title and description sit below, like a feature tile.
 */
export function FlowLineChatCard({
  title = "Conversations that keep flowing",
  description = "Channels, threads and reactions that update live for everyone in the room.",
  messages = SAMPLE,
  channel = { name: "design-crit", members: 128 },
  className,
  ...props
}: FlowLineChatCardProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(messages.length);
  const [typing, setTyping] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const run = !reduceMotion;

  // Replay: messages arrive one by one, then the channel resets and plays again (only while visible).
  useEffect(() => {
    const root = rootRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || media.matches) return;
    let timer = 0;
    let step = 0;
    let visible = false;
    const next = () => {
      if (!visible || document.hidden) return;
      if (step === 0) {
        setShown(0);
        setTyping(false);
      }
      const message = messages[step];
      if (message && !message.system) {
        setTyping(true);
        timer = window.setTimeout(() => {
          setTyping(false);
          setShown(step + 1);
          step += 1;
          timer = window.setTimeout(next, STEP_MS);
        }, STEP_MS * 0.8);
        return;
      }
      if (message) {
        setShown(step + 1);
        step += 1;
        timer = window.setTimeout(next, STEP_MS * 0.7);
        return;
      }
      // All shown: hold, then start over.
      step = 0;
      timer = window.setTimeout(next, STEP_MS * 4);
    };
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry?.isIntersecting ?? false;
      if (visible && !was) {
        window.clearTimeout(timer);
        step = 0;
        next();
      }
      if (!visible) window.clearTimeout(timer);
    });
    io.observe(root);
    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, [messages]);

  const visibleMessages = messages.slice(0, shown);
  const nextAuthor = messages[shown]?.author;

  return (
    <article ref={rootRef} className={cn("@container w-full max-w-md overflow-hidden rounded-[22px] border border-white/10 bg-[#070b14] text-white shadow-xl", className)} {...props}>
      <div className="relative h-80 overflow-hidden border-b border-white/10 bg-[radial-gradient(120%_80%_at_80%_0%,rgb(37_99_235/0.28),transparent_60%)]">
        <FlowLines lines={18} color="#3b82f6" />
        <div className="absolute inset-x-5 top-5 bottom-0 flex flex-col overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-[#0d1424]/85 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-[13px]">
            <Hash className="size-4 text-[#60a5fa]" aria-hidden="true" />
            <span className="font-medium">{channel.name}</span>
            <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-white/60">
              <Users className="size-3.5" aria-hidden="true" />
              {channel.members}
            </span>
          </div>
          <ol aria-label={`Messages in ${channel.name}`} className="flex min-h-0 flex-1 flex-col justify-end gap-1 overflow-hidden px-2 pb-3">
            <AnimatePresence initial={false}>
              {visibleMessages.map((m) =>
                m.system ? (
                  <motion.li
                    key={m.id}
                    initial={run ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: duration.base, ease: ease.out }}
                    className="px-2 py-1 text-center text-[11.5px] text-white/55"
                  >
                    <span className="text-[#60a5fa]">→</span> {m.text}
                  </motion.li>
                ) : (
                  <motion.li
                    key={m.id}
                    layout={run}
                    initial={run ? { opacity: 0, y: 14, filter: "blur(4px)" } : false}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: duration.slow, ease: ease.out }}
                    className="group relative flex gap-2.5 rounded-xl px-2 py-1.5 ring-[#3b82f6] transition-[box-shadow,background-color] hover:bg-white/5 hover:ring-1 focus-within:bg-white/5 focus-within:ring-1"
                  >
                    {m.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
                      <img src={m.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold" style={{ background: m.color ?? "#2563eb" }}>
                        {m.author[0]}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-2 text-[13px]">
                        <span className="font-semibold">{m.author}</span>
                        {m.time ? <span className="text-[11px] text-white/45">{m.time}</span> : null}
                      </p>
                      <p className="text-[13px] leading-5 text-white/85">{m.text}</p>
                      {m.reactions?.length ? (
                        <ul className="mt-1 flex gap-1" aria-label="Reactions">
                          {m.reactions.map((r, k) => (
                            <motion.li
                              key={r.emoji}
                              initial={run ? { scale: 0, opacity: 0 } : false}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ ...spring.bouncy, delay: run ? 0.35 + k * 0.12 : 0 }}
                              className="inline-flex items-center gap-1 rounded-full border border-[#3b82f6]/50 bg-[#1e3a8a]/40 px-1.5 py-px text-[11.5px]"
                            >
                              <span aria-hidden="true">{r.emoji}</span>
                              <span className="sr-only">{r.emoji}</span>
                              <Count to={r.count} run={run} />
                            </motion.li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    {/* Hover toolbar. */}
                    <div className="absolute -top-3 right-2 flex gap-0.5 rounded-lg border border-white/10 bg-[#111a2e] p-0.5 opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                      {[
                        [SmilePlus, `Add reaction to ${m.author}'s message`],
                        [Reply, `Reply to ${m.author}`],
                        [MoreHorizontal, "More actions"],
                      ].map(([Icon, label]) => {
                        const I = Icon as typeof Reply;
                        return (
                          <button key={label as string} type="button" aria-label={label as string} className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-white/70 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#60a5fa]">
                            <I className="size-3.5" aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  </motion.li>
                ),
              )}
            </AnimatePresence>
          </ol>
          <div className="h-7 px-4 pb-2 text-[11.5px] text-white/55" aria-hidden="true">
            {typing && nextAuthor ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-1 animate-bounce rounded-full bg-[#60a5fa] motion-reduce:animate-none" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </span>
                {nextAuthor} is typing…
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="space-y-1.5 p-5">
        <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
        {description ? <p className="text-[14px] leading-6 text-white/65">{description}</p> : null}
      </div>
    </article>
  );
}
