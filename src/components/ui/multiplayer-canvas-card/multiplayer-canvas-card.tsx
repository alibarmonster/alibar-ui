"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlowLines } from "@/components/ui/flow-line-chat-card/flow-line-chat-card";

export interface Collaborator {
  name: string;
  /** Cursor and avatar color. */
  color: string;
}

export interface MultiplayerCanvasCardProps extends Omit<ComponentProps<"article">, "title"> {
  /** Feature title under the illustration. @default "Build it together, live" */
  title?: string;
  /** One-line description under the title. */
  description?: string;
  /** Up to three people whose cursors select, type and comment. @default Maya, Jonas and Lena */
  collaborators?: Collaborator[];
}

const PEOPLE: Collaborator[] = [
  { name: "Maya", color: "#3b82f6" },
  { name: "Jonas", color: "#f97316" },
  { name: "Lena", color: "#22c55e" },
];

const LOOP = 9;
const TYPED = "Ship it on Friday?";
type P = [number, number];

/** Cubic bezier point. */
const bez = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t;
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const seg = (t: number, start: number, end: number) => Math.min(1, Math.max(0, (t - start) / (end - start)));

/** Scripted positions (in % of the canvas) for each cursor over one loop. */
function script(index: number, t: number): P {
  if (index === 0) {
    // Maya: to the shapes, drag a selection, then drift away.
    if (t < 1.2) return bez([8, 90], [10, 60], [14, 30], [16, 18], ease(seg(t, 0, 1.2)));
    if (t < 2.6) return bez([16, 18], [30, 30], [45, 50], [58, 62], ease(seg(t, 1.2, 2.6)));
    if (t < 3.6) return [58, 62];
    return bez([58, 62], [50, 80], [30, 92], [12, 88], ease(seg(t, 3.6, 5.6)));
  }
  if (index === 1) {
    // Jonas: to the text block, type, then leave.
    if (t < 1.5) return bez([94, 92], [90, 60], [80, 30], [72, 26], ease(seg(t, 0, 1.5)));
    if (t < 6) return [72 + seg(t, 1.6, 4.2) * 18, 26];
    return bez([90, 26], [96, 40], [98, 70], [94, 92], ease(seg(t, 6, 7.6)));
  }
  // Lena: to the comment pin, open it, wait, then back.
  if (t < 2) return [84, 96];
  if (t < 3.5) return bez([84, 96], [70, 92], [40, 86], [29, 74], ease(seg(t, 2, 3.5)));
  if (t < 7.6) return [29, 74];
  return bez([29, 74], [45, 86], [70, 96], [84, 96], ease(seg(t, 7.6, 8.8)));
}

/**
 * The companion feature card for a real-time collaboration product: on a small canvas, named cursors
 * follow scripted paths. One drags a selection box that highlights shapes, another types into a text
 * block, a third opens a comment thread, while flowing lines carry "data" from each cursor to an
 * avatar stack. Hovering speeds the scene up and shows the visitor's own cursor labelled "You".
 * Everything moves through refs in one loop; still under reduced motion.
 */
export function MultiplayerCanvasCard({
  title = "Build it together, live",
  description = "Cursors, selections and comments sync in real time, so the whole team works on one canvas.",
  collaborators = PEOPLE,
  className,
  ...props
}: MultiplayerCanvasCardProps) {
  const people = collaborators.slice(0, 3);
  const peopleKey = people.map((p) => p.name).join("|");
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const linkRefs = useRef<(SVGPathElement | null)[]>([]);
  const selectRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const youRef = useRef<HTMLDivElement>(null);
  const avatarsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = 0;
    let time = 0;
    let speed = 1;
    let target = 1;
    let visible = true;

    const paint = (t: number) => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      // Links live in the outer frame so they can reach the avatar stack above the canvas.
      const ox = stage.offsetLeft;
      const oy = stage.offsetTop;
      const stack = avatarsRef.current;
      const hub: P = stack ? [stack.offsetLeft + stack.offsetWidth * 0.3, stack.offsetTop + stack.offsetHeight] : [ox + w - 40, oy - 10];
      people.forEach((_, i) => {
        const [px, py] = script(i, t);
        const x = (px / 100) * w;
        const y = (py / 100) * h;
        const el = cursorRefs.current[i];
        if (el) el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        const lx = ox + x;
        const ly = oy + y;
        const link = linkRefs.current[i];
        if (link) link.setAttribute("d", `M${lx.toFixed(1)} ${ly.toFixed(1)} Q ${((lx + hub[0]) / 2).toFixed(1)} ${(Math.min(ly, hub[1]) - 30).toFixed(1)} ${hub[0].toFixed(1)} ${hub[1].toFixed(1)}`);
      });
      // Selection box from where Maya pressed to where she is.
      const sel = selectRef.current;
      if (sel) {
        const on = t > 1.2 && t < 4.2;
        const end = script(0, Math.min(t, 2.6));
        const x0 = Math.min(16, end[0]);
        const y0 = Math.min(18, end[1]);
        sel.style.opacity = on ? (t > 3.6 ? String(1 - seg(t, 3.6, 4.2)) : "1") : "0";
        sel.style.left = `${x0}%`;
        sel.style.top = `${y0}%`;
        sel.style.width = `${Math.abs(end[0] - 16)}%`;
        sel.style.height = `${Math.abs(end[1] - 18)}%`;
        shapesRef.current?.toggleAttribute("data-selected", t > 2.4 && t < 4.2);
      }
      // Typing.
      const typed = typedRef.current;
      if (typed) typed.textContent = TYPED.slice(0, Math.round(seg(t, 1.6, 4.2) * TYPED.length) * (t < 8.6 ? 1 : 0));
      caretRef.current?.toggleAttribute("data-on", t > 1.5 && t < 6.2);
      // Comment thread.
      threadRef.current?.toggleAttribute("data-open", t > 3.6 && t < 7.6);
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      speed += (target - speed) * Math.min(1, dt * 4);
      time = (time + dt * speed) % LOOP;
      paint(time);
      schedule();
    };
    const schedule = () => {
      if (!raf && visible && !document.hidden && !media.matches) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      last = 0;
      if (media.matches) paint(3.9);
      schedule();
    };

    // The visitor's own cursor, and a slightly faster scene while hovered.
    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const you = youRef.current;
      if (!you) return;
      you.style.opacity = "1";
      you.style.transform = `translate3d(${event.clientX - rect.left}px, ${event.clientY - rect.top}px, 0)`;
      target = 1.35;
    };
    const onLeave = () => {
      if (youRef.current) youRef.current.style.opacity = "0";
      target = 1;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      wake();
    });
    io.observe(stage);
    const ro = new ResizeObserver(() => paint(media.matches ? 3.9 : time));
    ro.observe(stage);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", wake);
    media.addEventListener("change", wake);
    wake();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", wake);
      media.removeEventListener("change", wake);
    };
    // Re-run only when the set of collaborators changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleKey]);

  const summary = `${people.map((p) => p.name).join(", ")} editing a canvas together: selecting shapes, typing a note and leaving a comment.`;

  return (
    <article className={cn("@container w-full max-w-md overflow-hidden rounded-[22px] border border-white/10 bg-[#070b14] text-white shadow-xl", className)} {...props}>
      <div className="relative h-80 overflow-hidden border-b border-white/10 bg-[radial-gradient(120%_80%_at_20%_0%,rgb(37_99_235/0.24),transparent_60%)]">
        <FlowLines lines={12} color="#3b82f6" bend={0.4} className="opacity-60" />
        {/* Avatar stack. */}
        <div ref={avatarsRef} className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-[#0d1424]/90 py-1 pr-3 pl-1 text-[12px]">
          <span className="flex -space-x-1.5" aria-hidden="true">
            {people.map((p) => (
              <span key={p.name} className="flex size-6 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-[#0d1424]" style={{ background: p.color }}>
                {p.name[0]}
              </span>
            ))}
          </span>
          {people.length} editing
        </div>

        {/* Data lines from each cursor to the avatar stack. */}
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible">
          <style>{`@keyframes mp-flow{to{stroke-dashoffset:-40}}`}</style>
          {people.map((p, i) => (
            <path
              key={p.name}
              ref={(el) => {
                linkRefs.current[i] = el;
              }}
              fill="none"
              stroke={p.color}
              strokeOpacity="0.6"
              strokeWidth="1.2"
              strokeDasharray="3 7"
              className="motion-reduce:[animation:none]"
              style={{ animation: "mp-flow 1.2s linear infinite" }}
            />
          ))}
        </svg>
        <div ref={stageRef} role="img" aria-label={summary} className="absolute inset-x-5 top-14 bottom-5 cursor-none overflow-hidden rounded-2xl border border-white/10 bg-[#0d1424]/80 [background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1.5px)] [background-size:16px_16px]">
          <div aria-hidden="true" className="absolute inset-0">
            {/* Shapes that get selected. */}
            <div ref={shapesRef} className="group/shapes absolute top-[22%] left-[20%] h-[34%] w-[34%]">
              <span className="absolute top-0 left-0 size-[46%] rounded-lg bg-[#2563eb]/80 ring-2 ring-transparent transition-shadow group-data-[selected]/shapes:ring-[#60a5fa]" />
              <span className="absolute right-0 bottom-0 size-[44%] rounded-full bg-[#f59e0b]/80 ring-2 ring-transparent transition-shadow group-data-[selected]/shapes:ring-[#60a5fa]" />
              <span className="absolute bottom-[8%] left-[8%] h-[30%] w-[36%] rotate-[-6deg] rounded-sm bg-[#fde68a] ring-2 ring-transparent transition-shadow group-data-[selected]/shapes:ring-[#60a5fa]" />
            </div>
            <div ref={selectRef} className="absolute rounded-sm border border-[#60a5fa] bg-[#3b82f6]/15 opacity-0" style={{ left: "16%", top: "18%" }} />

            {/* Text block. */}
            <div className="absolute top-[20%] right-[6%] w-[34%] rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 text-[11.5px] leading-4 text-white/85">
              <span className="block text-[10px] tracking-wide text-white/45 uppercase">Note</span>
              <span ref={typedRef} />
              <span ref={caretRef} className="ml-px inline-block h-3 w-px translate-y-0.5 bg-white opacity-0 data-[on]:animate-pulse data-[on]:opacity-100" />
            </div>

            {/* Comment pin and thread. */}
            <div className="absolute top-[64%] left-[24%]">
              <span className="flex size-6 items-center justify-center rounded-full rounded-bl-none bg-[#22c55e] text-[10px] font-semibold text-[#052e16] shadow">2</span>
              <div
                ref={threadRef}
                className="absolute bottom-7 left-0 w-44 origin-bottom-left scale-90 rounded-xl border border-white/10 bg-[#111a2e] p-2 text-[11px] opacity-0 shadow-xl transition-[opacity,transform] duration-300 data-[open]:scale-100 data-[open]:opacity-100 motion-reduce:transition-none"
              >
                <p>
                  <span className="font-semibold" style={{ color: people[2]?.color }}>
                    {people[2]?.name ?? "Lena"}
                  </span>{" "}
                  Can the circle sit a bit lower?
                </p>
                <p className="mt-1 text-white/70">
                  <span className="font-semibold" style={{ color: people[0]?.color }}>
                    {people[0]?.name ?? "Maya"}
                  </span>{" "}
                  Done, nudged it 8px.
                </p>
              </div>
            </div>

            {/* Named cursors. */}
            {people.map((p, i) => (
              <div
                key={p.name}
                ref={(el) => {
                  cursorRefs.current[i] = el;
                }}
                className="absolute top-0 left-0 z-10"
              >
                <MousePointer2 className="size-4 -translate-x-0.5 -translate-y-0.5" style={{ color: p.color, fill: p.color }} />
                <span className="ml-3 inline-block rounded-md px-1.5 py-px text-[10.5px] font-medium text-white shadow" style={{ background: p.color }}>
                  {p.name}
                </span>
              </div>
            ))}
            <div ref={youRef} className="absolute top-0 left-0 z-20 opacity-0 transition-opacity">
              <MousePointer2 className="size-4 -translate-x-0.5 -translate-y-0.5 fill-white text-white" />
              <span className="ml-3 inline-block rounded-md bg-white px-1.5 py-px text-[10.5px] font-medium text-[#0d1424] shadow">You</span>
            </div>
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
