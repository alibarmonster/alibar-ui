"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketAvatar } from "@/lib/markets/avatar";
import { formatPrice, formatShares, formatUsd } from "@/lib/markets/format";
import { useNow } from "@/lib/markets/use-now";

export interface ActivityTrade {
  id: string;
  trader: string;
  side: "buy" | "sell";
  /** Outcome name, e.g. "Yes". */
  outcome: string;
  /** Shares, in hundredths. */
  shares: number;
  /** Fill price, basis points. */
  price: number;
  /** Time of the trade, ms since epoch. */
  at: number;
}

export interface DiscussionComment {
  id: string;
  author: string;
  /** The author's position, shown as a badge. Shares in hundredths. */
  position?: { outcome: string; shares: number };
  text: string;
  likes: number;
  /** Relative time label, e.g. "2h". */
  ago: string;
  replies?: DiscussionComment[];
}

type Tab = "activity" | "comments";
type Filter = "all" | "yes" | "no";

export interface MarketActivityProps {
  /** Recent trades, newest first. New items at the head slide in from the top. */
  trades: ActivityTrade[];
  /** Starting comment thread (the component keeps its own copy for likes, replies and new posts). */
  comments: DiscussionComment[];
  /** Name used for new comments and replies. @default "@alibar" */
  currentUser?: string;
  /** Trades worth at least this many cents are highlighted. @default 50000 */
  largeTrade?: number;
  /** Rows kept in the activity stream. @default 10 */
  maxItems?: number;
  /** Tab shown first. @default "activity" */
  defaultTab?: Tab;
  /** Called with the text (and the parent comment id for a reply) when the viewer posts. */
  onComment?: (text: string, parentId?: string) => void;
  /** Classes for the panel. */
  className?: string;
}

const value = (t: ActivityTrade) => Math.round((t.shares * t.price) / 10000);

function ago(at: number, now: number) {
  const s = Math.round((now - at) / 1000);
  if (s < 30) return "now";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

function PositionBadge({ position }: { position: NonNullable<DiscussionComment["position"]> }) {
  const tone = position.outcome === "Yes" ? "border-success/30 bg-success/8" : position.outcome === "No" ? "border-destructive/30 bg-destructive/8" : "border-border bg-surface-2";
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full border px-1.5 text-[11px] text-foreground", tone)}>
      Holds {position.outcome} · {formatShares(position.shares).replace(/\.00$/, "")} shares
    </span>
  );
}

function LikeButton({ liked, count, onToggle }: { liked: boolean; count: number; onToggle: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <button type="button" aria-pressed={liked} aria-label={`Like, ${count} likes`} onClick={onToggle} className={cn("inline-flex h-8 min-w-10 cursor-pointer items-center gap-1 rounded-full px-2 text-[12px] tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring", liked ? "text-[color-mix(in_oklab,var(--destructive)_85%,var(--foreground))]" : "text-muted-foreground hover:text-foreground")}>
      <motion.span key={liked ? "on" : "off"} initial={reduceMotion || !liked ? false : { scale: 0.6 }} animate={{ scale: [null, 1.35, 1] }} transition={{ duration: 0.35 }} className="inline-flex">
        <Heart className={cn("size-3.5", liked && "fill-current")} aria-hidden="true" />
      </motion.span>
      {count}
    </button>
  );
}

function Composer({ placeholder, label, onSubmit, autoFocus }: { placeholder: string; label: string; onSubmit: (text: string) => void; autoFocus?: boolean }) {
  const [text, setText] = useState("");
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text.trim());
        setText("");
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={label} autoFocus={autoFocus} maxLength={280} className="h-10 min-w-0 flex-1 rounded-full border border-border bg-background px-3.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
      <button type="submit" disabled={!text.trim()} className="h-10 shrink-0 cursor-pointer rounded-full bg-foreground px-4 text-[13px] font-medium text-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
        Post
      </button>
    </form>
  );
}

/**
 * A market's social layer: a live trade stream (new trades slide in, large ones highlighted) and a
 * discussion thread with position badges, likes, one level of replies, Top/Newest sort and holder filters.
 */
export function MarketActivity({ trades, comments: initialComments, currentUser = "@alibar", largeTrade = 50000, maxItems = 10, defaultTab = "activity", onComment, className }: MarketActivityProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const now = useNow();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [comments, setComments] = useState(initialComments);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [sort, setSort] = useState<"top" | "newest">("top");
  const [filter, setFilter] = useState<Filter>("all");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const posted = useRef(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36 };

  const like = (cid: string) =>
    setLiked((current) => {
      const next = new Set(current);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  const likes = (c: DiscussionComment) => c.likes + (liked.has(c.id) ? 1 : 0);

  const post = (text: string, parentId?: string) => {
    posted.current += 1;
    const comment: DiscussionComment = { id: `${id}-new-${posted.current}`, author: currentUser, text, likes: 0, ago: "now" };
    setComments((current) => (parentId ? current.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), comment] } : c)) : [comment, ...current]));
    setReplyTo(null);
    setSort((s) => (parentId ? s : "newest"));
    setAnnounce(parentId ? "Reply posted" : "Comment posted");
    onComment?.(text, parentId);
  };

  const visible = comments
    .map((c, order) => ({ c, order }))
    .filter(({ c }) => filter === "all" || c.position?.outcome.toLowerCase() === filter)
    .sort((a, b) => (sort === "top" ? likes(b.c) - likes(a.c) || a.order - b.order : a.order - b.order))
    .map(({ c }) => c);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "activity", label: "Activity", count: trades.length },
    { id: "comments", label: "Comments", count: comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0) },
  ];

  return (
    <section aria-label="Market activity and discussion" className={cn("w-full rounded-2xl border border-border bg-background", className)}>
      <LayoutGroup id={`${id}-tabs`}>
        <div
          role="tablist"
          aria-label="Activity and comments"
          className="flex gap-1 border-b border-border px-3 pt-2"
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            const next = tab === "activity" ? 1 : 0;
            setTab(tabs[next].id);
            tabRefs.current[next]?.focus();
          }}
        >
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(node) => {
                tabRefs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`${id}-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={cn("relative h-10 cursor-pointer px-2.5 text-[13px] font-medium outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring", tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {t.label}
              <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 py-px text-[11px] text-[color-mix(in_oklab,var(--muted-foreground)_75%,var(--foreground))] tabular-nums">{t.count}</span>
              {tab === t.id ? <motion.span layoutId="tab-line" transition={spring} className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-foreground" /> : null}
            </button>
          ))}
        </div>
      </LayoutGroup>

      {tab === "activity" ? (
        <div role="tabpanel" id={`${id}-panel-activity`} aria-labelledby={`${id}-tab-activity`} className="px-3 py-2">
          <ul aria-label="Recent trades" aria-live="polite" aria-relevant="additions" className="overflow-hidden">
            <AnimatePresence initial={false}>
              {trades.slice(0, maxItems).map((t) => {
                const big = value(t) >= largeTrade;
                return (
                  <motion.li
                    key={t.id}
                    layout={reduceMotion ? false : "position"}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={spring}
                    className={cn("flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px]", big && "bg-[color-mix(in_oklab,var(--warning)_9%,transparent)]")}
                  >
                    <MarketAvatar name={t.trader} className="size-7" />
                    <p className="min-w-0 flex-1 leading-5 text-muted-foreground">
                      <span className="font-medium text-foreground">{t.trader}</span>{" "}
                      <span className={cn("font-medium", t.side === "buy" ? "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]")}>{t.side === "buy" ? "bought" : "sold"}</span> {formatShares(t.shares).replace(/\.00$/, "")} <span className="font-medium text-foreground">{t.outcome}</span> at {formatPrice(t.price)}
                      {big ? <span className="ml-1.5 rounded-full border border-warning/40 px-1.5 text-[10px] font-medium text-[color-mix(in_oklab,var(--warning)_70%,var(--foreground))] uppercase">Large</span> : null}
                    </p>
                    <span className="shrink-0 text-right text-[12px] tabular-nums">
                      <span className="block font-medium text-foreground">{formatUsd(value(t))}</span>
                      <span className="block text-muted-foreground">{now ? ago(t.at, now) : " "}</span>
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {trades.length === 0 ? <p className="py-8 text-center text-[13px] text-muted-foreground">No trades yet.</p> : null}
        </div>
      ) : (
        <div role="tabpanel" id={`${id}-panel-comments`} aria-labelledby={`${id}-tab-comments`} className="px-3 py-3">
          <Composer placeholder="Share your take…" label="Add a comment" onSubmit={(text) => post(text)} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <LayoutGroup id={`${id}-filter`}>
              <div role="radiogroup" aria-label="Show comments from" className="flex gap-1">
                {(["all", "yes", "no"] as const).map((f) => (
                  <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => setFilter(f)} className={cn("relative h-8 cursor-pointer rounded-full px-2.5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring", filter === f ? "text-background" : "text-muted-foreground hover:text-foreground")}>
                    {filter === f ? <motion.span layoutId="filter-pill" transition={spring} className="absolute inset-0 rounded-full bg-foreground" /> : null}
                    <span className="relative">{f === "all" ? "All" : f === "yes" ? "Yes holders" : "No holders"}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value as "top" | "newest")} className="h-8 cursor-pointer rounded-md border border-border bg-background px-1.5 text-[12px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="top">Top</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
          <ul className="mt-2">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((c) => (
                <motion.li key={c.id} layout={reduceMotion ? false : "position"} initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }} transition={spring} className="border-b border-border py-3 last:border-0">
                  <CommentBody comment={c} likes={likes(c)} liked={liked.has(c.id)} onLike={() => like(c.id)} onReply={() => setReplyTo((r) => (r === c.id ? null : c.id))} replying={replyTo === c.id} />
                  {(c.replies?.length ?? 0) > 0 || replyTo === c.id ? (
                    <ul className="mt-2 ml-4 space-y-3 border-l border-border pl-3">
                      {c.replies?.map((r) => (
                        <li key={r.id}>
                          <CommentBody comment={r} likes={likes(r)} liked={liked.has(r.id)} onLike={() => like(r.id)} small />
                        </li>
                      ))}
                      {replyTo === c.id ? (
                        <li>
                          <Composer placeholder={`Reply to ${c.author}…`} label={`Reply to ${c.author}`} onSubmit={(text) => post(text, c.id)} autoFocus />
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {visible.length === 0 ? <p className="py-8 text-center text-[13px] text-muted-foreground">No comments from {filter === "yes" ? "Yes" : "No"} holders yet.</p> : null}
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}

function CommentBody({ comment, likes, liked, onLike, onReply, replying, small }: { comment: DiscussionComment; likes: number; liked: boolean; onLike: () => void; onReply?: () => void; replying?: boolean; small?: boolean }) {
  return (
    <div className="flex gap-2.5">
      <MarketAvatar name={comment.author} className={small ? "size-6" : "size-8"} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
          <span className="font-medium text-foreground">{comment.author}</span>
          {comment.position ? <PositionBadge position={comment.position} /> : null}
          <span className="text-muted-foreground">{comment.ago}</span>
        </p>
        <p className="mt-1 text-[13px] leading-5 text-foreground">{comment.text}</p>
        <div className="mt-0.5 -ml-2 flex items-center">
          <LikeButton liked={liked} count={likes} onToggle={onLike} />
          {onReply ? (
            <button type="button" aria-expanded={replying} onClick={onReply} className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-2 text-[12px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              <MessageCircle className="size-3.5" aria-hidden="true" />
              Reply
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
