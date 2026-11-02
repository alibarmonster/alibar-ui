"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, Check, Download, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";
import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";
import { categoryColor } from "@/lib/usage/colors";
import { formatCredits, formatDay, formatShare } from "@/lib/usage/format";
import type { UsageCategory, UsageTeammate, UsageWorkflow } from "@/lib/usage/types";

export interface CreditBreakdownPeriod {
  /** Stable id, e.g. "30d". */
  id: string;
  /** Toggle label, e.g. "30 days". */
  label: string;
  workflows: UsageWorkflow[];
  teammates: UsageTeammate[];
}

export interface CreditPlan {
  name: string;
  /** Credits included in the plan per cycle. */
  included: number;
  /** Credits used this cycle. */
  used: number;
  /** ISO date the plan renews. */
  renewsOn?: string;
}

export interface CreditBreakdownProps {
  /** Credit categories in color order (max 6). */
  categories: UsageCategory[];
  /** Periods for the toggle, each with its own workflows and teammates. */
  periods: CreditBreakdownPeriod[];
  /** Period shown first. @default the second period, or the first */
  defaultPeriod?: string;
  /** Called when the period toggle changes. */
  onPeriodChange?: (periodId: string) => void;
  /** Plan shown in the header. */
  plan: CreditPlan;
  /** Called by the "Change plan" button; leave out to hide it. */
  onChangePlan?: () => void;
  /** Called after an export with the CSV text of the rows currently shown. @default downloads the file */
  onExport?: (csv: string, fileName: string) => void;
  /** Rows shown before "Show all". @default 5 */
  visibleRows?: number;
  /** Locale for numbers and dates. @default "en-US" */
  locale?: string;
  /** Card title. @default "Credit breakdown" */
  title?: string;
  /** Classes for the card. */
  className?: string;
}

type Tab = "workflows" | "teammates";
type SortKey = "name" | "runs" | "hours" | "credits";
type Row = { id: string; name: string; subtitle?: string; category: string; runs: number; hours: number; credits: number };
type ExportState = "idle" | "loading" | "done";

/** clip-path for the slice of a full-width bar between `from` and `to` (0–1). */
const slice = (from: number, to: number, gap = 0) =>
  `inset(0% ${(100 - Math.min(1, to) * 100 + (to < 1 ? gap : 0)).toFixed(3)}% 0% ${(Math.max(0, from) * 100).toFixed(3)}% round 999px)`;

const csvCell = (value: string | number) => (/[",\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value));

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Where the credits went: a plan header, a segmented credit meter by category (hover to link rows,
 * click to filter), KPI tiles that roll when the period changes, and a searchable, sortable table of
 * workflows or teammates with a "Show all" expand and a CSV export.
 */
export function CreditBreakdown({
  categories,
  periods,
  defaultPeriod,
  onPeriodChange,
  plan,
  onChangePlan,
  onExport,
  visibleRows = 5,
  locale = "en-US",
  title = "Credit breakdown",
  className,
}: CreditBreakdownProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [periodId, setPeriodId] = useState(defaultPeriod ?? periods[1]?.id ?? periods[0]?.id);
  const [tab, setTab] = useState<Tab>("workflows");
  const [hovered, setHovered] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "credits", desc: true });
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState<ExportState>("idle");

  const period = periods.find((p) => p.id === periodId) ?? periods[0];
  const cats = categories.slice(0, 6);
  const workflows = period?.workflows ?? [];
  const total = workflows.reduce((sum, w) => sum + w.credits, 0);
  const byCategory = cats.map((c, index) => ({ category: c, index, credits: workflows.filter((w) => w.category === c.id).reduce((sum, w) => sum + w.credits, 0) }));
  const segments = byCategory.map((entry, i) => {
    const before = byCategory.slice(0, i).reduce((sum, e) => sum + e.credits, 0);
    return { ...entry, from: total ? before / total : 0, to: total ? (before + entry.credits) / total : 0 };
  });

  const runs = workflows.reduce((sum, w) => sum + w.runs, 0);
  const hours = workflows.reduce((sum, w) => sum + w.hours, 0);
  const active = workflows.filter((w) => w.runs > 0).length;
  const perTask = runs ? Math.round(total / runs) : 0;

  const source: Row[] = tab === "workflows" ? workflows : (period?.teammates ?? []).map((t) => ({ ...t, subtitle: t.role }));
  const sourceTotal = source.reduce((sum, r) => sum + r.credits, 0);
  const needle = query.trim().toLowerCase();
  const rows = source
    .filter((r) => !filter || r.category === filter)
    .filter((r) => !needle || `${r.name} ${r.subtitle ?? ""}`.toLowerCase().includes(needle))
    .sort((a, b) => {
      const order = sort.key === "name" ? a.name.localeCompare(b.name) : a[sort.key] - b[sort.key];
      return sort.desc ? -order : order;
    });
  const head = rows.slice(0, visibleRows);
  const rest = rows.slice(visibleRows);

  useEffect(() => {
    if (exporting === "idle") return;
    const timer = window.setTimeout(() => setExporting(exporting === "loading" ? "done" : "idle"), exporting === "loading" ? 700 : 1800);
    return () => window.clearTimeout(timer);
  }, [exporting]);

  const pickPeriod = (next: string) => {
    if (next === periodId) return;
    setPeriodId(next);
    onPeriodChange?.(next);
  };

  const sortBy = (key: SortKey) => setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "name" }));

  const exportCsv = () => {
    if (exporting !== "idle") return;
    const categoryName = (cid: string) => cats.find((c) => c.id === cid)?.name ?? cid;
    const header = ["Name", tab === "workflows" ? "Trigger" : "Role", "Category", "Runs", "Hours", "Credits", "Share"];
    const lines = [header, ...rows.map((r) => [r.name, r.subtitle ?? "", categoryName(r.category), r.runs, r.hours, r.credits, formatShare(sourceTotal ? r.credits / sourceTotal : 0, 1)])];
    const csv = lines.map((line) => line.map(csvCell).join(",")).join("\n");
    const fileName = `credits-${period?.id ?? "period"}-${tab}.csv`;
    setExporting("loading");
    if (onExport) {
      onExport(csv, fileName);
      return;
    }
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const hoveredSegment = segments.find((s) => s.category.id === hovered);
  const roll = { locale, animateOnMount: false } as const;
  const pill = (selected: boolean) =>
    cn(
      "relative h-8 cursor-pointer rounded-full px-3 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
      selected ? "text-foreground" : "text-[color-mix(in_oklab,var(--muted-foreground)_75%,var(--foreground))]",
    );
  const pillBg = (layoutId: string) => <motion.span layoutId={layoutId} transition={reduceMotion ? { duration: 0 } : spring.snappy} className="absolute inset-0 rounded-full bg-background shadow-sm" />;

    // Columns follow the card's width (container queries), not the viewport.
  const columns =
    "grid grid-cols-[minmax(0,1fr)_5.5rem_3.5rem] items-center gap-3 @lg:grid-cols-[minmax(0,1fr)_4rem_3.5rem_5.5rem_3.5rem] @3xl:grid-cols-[minmax(0,1fr)_8rem_4rem_3.5rem_5.5rem_3.5rem]";

  const renderRow = (r: Row) => {
    const ci = cats.findIndex((c) => c.id === r.category);
    const linked = hovered !== null && hovered === r.category;
    const dimmed = hovered !== null && hovered !== r.category;
    return (
      <motion.div
        key={`${tab}-${r.id}`}
        role="row"
        layout={reduceMotion ? false : "position"}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: dimmed ? 0.45 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: duration.base, ease: ease.out }}
        className={cn(columns, "rounded-lg px-2 py-2.5 transition-colors", linked && "bg-surface-2")}
      >
        <div role="cell" className="flex min-w-0 items-center gap-2.5">
          {tab === "teammates" ? (
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-foreground">
              {initials(r.name)}
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
              {/* The category column is hidden on narrow cards, so the color and name move here. */}
              <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px] @3xl:hidden" style={{ background: categoryColor(Math.max(0, ci)) }} />
              <span className="truncate">{r.name}</span>
              <span className="sr-only @3xl:hidden">, {cats[ci]?.name ?? r.category}</span>
            </p>
            {r.subtitle ? <p className="truncate text-[11px] text-muted-foreground">{r.subtitle}</p> : null}
          </div>
        </div>
        <div role="cell" className="hidden min-w-0 items-center gap-1.5 text-[12px] text-muted-foreground @3xl:flex">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ background: categoryColor(Math.max(0, ci)) }} />
          <span className="truncate">{cats[ci]?.name ?? r.category}</span>
        </div>
        <div role="cell" className="hidden text-right font-mono text-[12px] text-muted-foreground tabular-nums @lg:block">
          {formatCredits(r.runs, locale)}
        </div>
        <div role="cell" className="hidden text-right font-mono text-[12px] text-muted-foreground tabular-nums @lg:block">
          {formatCredits(r.hours, locale)}h
        </div>
        <div role="cell" className="text-right font-mono text-[13px] text-foreground tabular-nums">
          {formatCredits(r.credits, locale)}
        </div>
        <div role="cell" className="text-right font-mono text-[12px] text-muted-foreground tabular-nums">
          {formatShare(sourceTotal ? r.credits / sourceTotal : 0)}
        </div>
      </motion.div>
    );
  };

  const sortHeader = (key: SortKey, label: string, className?: string) => (
    <div role="columnheader" aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"} className={className}>
      <button type="button" onClick={() => sortBy(key)} className="inline-flex cursor-pointer items-center gap-0.5 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        {label}
        {sort.key === key ? sort.desc ? <ArrowDown className="size-3" aria-hidden="true" /> : <ArrowUp className="size-3" aria-hidden="true" /> : null}
      </button>
    </div>
  );

  return (
    <section aria-labelledby={`${id}-title`} className={cn("@container w-full max-w-3xl rounded-2xl border border-border bg-background p-5", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`${id}-title`} className="text-sm font-semibold text-foreground">
          {title}
        </h3>
        <LayoutGroup id={`${id}-period`}>
          <div role="group" aria-label="Period" className="flex gap-0.5 rounded-full bg-surface-2 p-0.5">
            {periods.map((p) => (
              <button key={p.id} type="button" aria-pressed={p.id === period?.id} onClick={() => pickPeriod(p.id)} className={pill(p.id === period?.id)}>
                {p.id === period?.id ? pillBg("credit-breakdown-period") : null}
                <span className="relative">{p.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </header>

      {/* Plan */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-surface p-4">
        <div className="min-w-0">
          <p className="text-[12px] text-muted-foreground">
            {plan.name}
            {plan.renewsOn ? ` · Renews ${formatDay(plan.renewsOn, false, locale)}` : ""}
          </p>
          <p className="mt-1 text-[15px] text-foreground">
            <span className="font-mono font-semibold">
              <RollingDigits value={plan.used} {...roll} />
            </span>{" "}
            <span className="text-muted-foreground">of {formatCredits(plan.included, locale)} credits used</span>
          </p>
        </div>
        {onChangePlan ? (
          <button type="button" onClick={onChangePlan} className="h-9 cursor-pointer rounded-full border border-border bg-background px-4 text-[13px] font-medium text-foreground outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring">
            Change plan
          </button>
        ) : null}
      </div>

      {/* Category meter */}
      <div className="relative mt-5">
        <div aria-hidden="true" className="relative h-3 w-full rounded-full bg-surface-2" onMouseLeave={() => setHovered(null)}>
          {segments.map((s) => (
            <motion.span
              key={s.category.id}
              className="absolute inset-0 cursor-pointer transition-opacity duration-200"
              style={{ background: categoryColor(s.index), opacity: (hovered ? hovered !== s.category.id : filter !== null && filter !== s.category.id) ? 0.3 : 1 }}
              initial={reduceMotion ? false : { clipPath: slice(s.from, s.from) }}
              animate={{ clipPath: slice(s.from, s.to, 0.5) }}
              transition={reduceMotion ? { duration: 0 } : { ...spring.smooth, delay: s.index * 0.05 }}
              onMouseEnter={() => setHovered(s.category.id)}
              onClick={() => setFilter((f) => (f === s.category.id ? null : s.category.id))}
            />
          ))}
        </div>
        <AnimatePresence>
          {hoveredSegment ? (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-full left-0 mb-2 w-full"
              initial={{ opacity: 0, x: `${(((hoveredSegment.from + hoveredSegment.to) / 2) * 100).toFixed(2)}%` }}
              animate={{ opacity: 1, x: `${(((hoveredSegment.from + hoveredSegment.to) / 2) * 100).toFixed(2)}%` }}
              exit={{ opacity: 0, transition: { duration: duration.instant } }}
              transition={reduceMotion ? { duration: 0 } : { x: spring.snappy, opacity: { duration: duration.quick } }}
            >
              <div className="w-max rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] text-background shadow-lg" style={{ translate: (hoveredSegment.from + hoveredSegment.to) / 2 > 0.7 ? "-100% 0" : (hoveredSegment.from + hoveredSegment.to) / 2 < 0.3 ? "0 0" : "-50% 0" }}>
                <span className="font-medium">{hoveredSegment.category.name}</span> · <span className="font-mono tabular-nums">{formatCredits(hoveredSegment.credits, locale)}</span> · {formatShare(total ? hoveredSegment.credits / total : 0)}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {/* The legend is the keyboard way to filter, and names every color. */}
        <div role="group" aria-label="Filter by category" className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {segments.map((s) => (
            <button
              key={s.category.id}
              type="button"
              aria-pressed={filter === s.category.id}
              onClick={() => setFilter((f) => (f === s.category.id ? null : s.category.id))}
              onMouseEnter={() => setHovered(s.category.id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter && filter !== s.category.id ? "text-muted-foreground" : "text-foreground",
              )}
            >
              <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ background: categoryColor(s.index) }} />
              {s.category.name}
              <span className="font-mono text-muted-foreground tabular-nums">{formatShare(total ? s.credits / total : 0)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-2 @lg:grid-cols-4">
        {[
          { label: "Tasks completed", value: runs },
          { label: "Active workflows", value: active },
          { label: "Hours returned", value: hours },
          { label: "Credits per task", value: perTask },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border p-3">
            <p className="text-[12px] text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 font-mono text-lg font-semibold text-foreground">
              <RollingDigits value={kpi.value} {...roll} />
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <LayoutGroup id={`${id}-tabs`}>
            <div role="tablist" aria-label="Breakdown" className="flex gap-0.5 rounded-full bg-surface-2 p-0.5">
              {(["workflows", "teammates"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${t}`}
                  aria-controls={`${id}-panel`}
                  aria-selected={tab === t}
                  tabIndex={tab === t ? 0 : -1}
                  onClick={() => setTab(t)}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                    e.preventDefault();
                    const next = t === "workflows" ? "teammates" : "workflows";
                    setTab(next);
                    document.getElementById(`${id}-tab-${next}`)?.focus();
                  }}
                  className={cn(pill(tab === t), "capitalize")}
                >
                  {tab === t ? pillBg("credit-breakdown-tab") : null}
                  <span className="relative">{t}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <div className="flex items-center gap-2">
            <label className="relative">
              <span className="sr-only">Search {tab}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-9 w-36 rounded-full border border-border bg-background pr-3 pl-8 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
              />
            </label>
            <button
              type="button"
              onClick={exportCsv}
              aria-label={exporting === "loading" ? "Exporting" : exporting === "done" ? "Exported" : "Export CSV"}
              className="relative inline-flex h-9 min-w-[6.5rem] cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-full bg-foreground px-3.5 text-[13px] font-medium text-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={exporting}
                  className="inline-flex items-center gap-1.5"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(2px)" }}
                  transition={{ duration: duration.quick, ease: ease.out }}
                >
                  {exporting === "loading" ? (
                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
                  ) : exporting === "done" ? (
                    <Check aria-hidden="true" className="size-3.5" />
                  ) : (
                    <Download aria-hidden="true" className="size-3.5" />
                  )}
                  {exporting === "loading" ? "Exporting" : exporting === "done" ? "Exported" : "Export"}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {filter ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3"
            >
              <button
                type="button"
                onClick={() => setFilter(null)}
                className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full bg-surface-2 pr-2 pl-2.5 text-[12px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ background: categoryColor(Math.max(0, cats.findIndex((c) => c.id === filter))) }} />
                {cats.find((c) => c.id === filter)?.name}
                <X aria-hidden="true" className="size-3.5" />
                <span className="sr-only">, clear the filter</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} className="mt-3">
          <div role="table" aria-label={tab === "workflows" ? "Workflows" : "Teammates"} aria-rowcount={rows.length + 1}>
            <div role="rowgroup">
              <div role="row" className={cn(columns, "border-b border-border px-2 pb-2 text-[11px] font-medium text-muted-foreground")}>
                {sortHeader("name", tab === "workflows" ? "Workflow" : "Teammate")}
                <div role="columnheader" className="hidden @3xl:block">
                  Category
                </div>
                {sortHeader("runs", "Runs", "hidden justify-self-end @lg:block")}
                {sortHeader("hours", "Hours", "hidden justify-self-end @lg:block")}
                {sortHeader("credits", "Credits", "justify-self-end")}
                <div role="columnheader" className="text-right">
                  Share
                </div>
              </div>
            </div>
            <div role="rowgroup" className="pt-1">
              <AnimatePresence initial={false} mode="popLayout">
                {head.map(renderRow)}
              </AnimatePresence>
              {/* Extra rows open with the grid-rows trick, so the height change never jumps. */}
              <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="min-h-0 overflow-hidden" inert={!expanded}>
                  <AnimatePresence initial={false} mode="popLayout">
                    {rest.map(renderRow)}
                  </AnimatePresence>
                </div>
              </div>
              {rows.length === 0 ? (
                <div role="row" className="px-2 py-8 text-center text-[13px] text-muted-foreground">
                  <span role="cell">No {tab} match{query ? ` "${query}"` : " this filter"}.</span>
                </div>
              ) : null}
            </div>
          </div>
          {rest.length ? (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 h-8 w-full cursor-pointer rounded-lg text-[12px] font-medium text-muted-foreground outline-none transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {expanded ? "Show less" : `Show all ${rows.length}`}
            </button>
          ) : null}
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {exporting === "done" ? `Exported ${rows.length} rows as CSV` : filter ? `Showing ${cats.find((c) => c.id === filter)?.name}` : ""}
      </p>
    </section>
  );
}
