"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface NetworkNode {
  id: string;
  label: string;
  /** Position from 0 to 1 across the width. */
  x: number;
  /** Position from 0 to 1 down the height. */
  y: number;
}

export interface NodeNetworkProps extends Omit<ComponentProps<"div">, "children"> {
  /** Nodes with relative positions. */
  nodes: NetworkNode[];
  /** Connections as [fromId, toId] pairs. */
  edges: [string, string][];
  /** Highlight color for the hovered node's links. @default "var(--primary)" */
  color?: string;
  /** How far nodes drift, in pixels. @default 6 */
  float?: number;
  /** Accessible label. @default "Network" */
  label?: string;
}

export function NodeNetwork({ nodes, edges, color = "var(--primary)", float = 6, label = "Network", className, style, ...props }: NodeNetworkProps) {
  const id = useId();
  const svg = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const neighbors = new Set(edges.flatMap(([a, b]) => (a === active ? [b] : b === active ? [a] : [])));

  // Gentle float: per-node sine offsets written straight to the SVG, edges following their nodes.
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let visible = true;
    const frame = (now: number) => {
      raf = 0;
      const t = now / 1000;
      const box = el.getBoundingClientRect();
      const pos = new Map<string, [number, number]>();
      nodes.forEach((node, i) => {
        const dx = Math.sin(t * (0.5 + (i % 5) * 0.11) + i * 1.7) * float;
        const dy = Math.cos(t * (0.4 + (i % 3) * 0.13) + i * 2.3) * float;
        const x = node.x * box.width + dx;
        const y = node.y * box.height + dy;
        pos.set(node.id, [x, y]);
        const group = el.querySelector<SVGGElement>(`[data-node="${CSS.escape(node.id)}"]`);
        if (group) group.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      edges.forEach(([a, b], i) => {
        const line = el.querySelector<SVGLineElement>(`[data-edge="${i}"]`);
        const p = pos.get(a);
        const q = pos.get(b);
        if (!line || !p || !q) return;
        line.setAttribute("x1", p[0].toFixed(1));
        line.setAttribute("y1", p[1].toFixed(1));
        line.setAttribute("x2", q[0].toFixed(1));
        line.setAttribute("y2", q[1].toFixed(1));
      });
      if (visible && !reduce.matches) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    intersection.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      intersection.disconnect();
    };
  }, [nodes, edges, float]);

  const byId = new Map(nodes.map((n) => [n.id, n]));
  return (
    <div className={cn("relative aspect-[16/10] w-full max-w-xl", className)} style={{ "--net": color, ...style } as CSSProperties} {...props}>
      <svg ref={svg} role="group" aria-label={label} className="size-full overflow-visible">
        <g aria-hidden="true">
          {edges.map(([a, b], i) => {
            const lit = active !== null && (a === active || b === active);
            const p = byId.get(a);
            const q = byId.get(b);
            return (
              <line
                key={`${a}-${b}`}
                data-edge={i}
                x1={`${(p?.x ?? 0) * 100}%`}
                y1={`${(p?.y ?? 0) * 100}%`}
                x2={`${(q?.x ?? 0) * 100}%`}
                y2={`${(q?.y ?? 0) * 100}%`}
                strokeWidth={lit ? 2 : 1}
                className={cn("transition-[stroke,opacity] duration-200", lit ? "stroke-[var(--net)]" : "stroke-border", active !== null && !lit && "opacity-40")}
              />
            );
          })}
        </g>
        {nodes.map((node) => {
          const isActive = node.id === active;
          const linked = neighbors.has(node.id);
          const connections = edges.filter(([a, b]) => a === node.id || b === node.id).map(([a, b]) => byId.get(a === node.id ? b : a)?.label);
          return (
            <g
              key={node.id}
              data-node={node.id}
              style={{ transform: `translate(${node.x * 100}%, ${node.y * 100}%)` }}
              tabIndex={0}
              role="button"
              aria-label={`${node.label}, connected to ${connections.join(", ") || "nothing"}`}
              onPointerEnter={() => setActive(node.id)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(node.id)}
              onBlur={() => setActive(null)}
              className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-ring"
              id={`${id}-${node.id}`}
            >
              <circle r={isActive ? 9 : 7} className={cn("fill-background stroke-2 transition-[r,stroke] duration-200", isActive || linked ? "stroke-[var(--net)]" : "stroke-foreground/30")} />
              <circle r={2.5} className={cn("transition-colors", isActive ? "fill-[var(--net)]" : "fill-foreground/60")} />
              <text y={22} textAnchor="middle" className={cn("fill-muted-foreground text-[11px] font-medium transition-colors select-none", (isActive || linked) && "fill-foreground")}>
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
