"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search, X } from "lucide-react";
import { BouncyAccordion } from "@/components/ui/bouncy-accordion/bouncy-accordion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface FaqItem {
  question: string;
  /** Answer content; plain strings are also searched. */
  answer: ReactNode;
}

export interface FaqSectionProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Questions and answers. */
  items: FaqItem[];
  /** Section title. @default "Frequently asked questions" */
  title?: string;
  /** Supporting line under the title. */
  description?: string;
  /** Search field placeholder. @default "Search questions…" */
  searchPlaceholder?: string;
}

export function FaqSection({
  items,
  title = "Frequently asked questions",
  description,
  searchPlaceholder = "Search questions…",
  className,
  ...props
}: FaqSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = items.filter(
    (item) => !q || item.question.toLowerCase().includes(q) || (typeof item.answer === "string" && item.answer.toLowerCase().includes(q)),
  );

  return (
    <section className={cn("w-full max-w-2xl", className)} aria-labelledby={`${id}-title`} {...props}>
      <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description ? <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{description}</p> : null}
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search questions"
          aria-controls={`${id}-list`}
          className="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-10 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {q ? `${results.length} question${results.length === 1 ? "" : "s"} found` : ""}
      </p>
      <motion.div id={`${id}-list`} layout={reduceMotion ? false : "size"} transition={spring.smooth} className="mt-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {results.length ? (
            <motion.div
              key={results.map((r) => r.question).join("|")}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <BouncyAccordion
                headingLevel={3}
                items={results.map((item) => ({ id: item.question, title: item.question, content: item.answer }))}
              />
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
            >
              No questions match &ldquo;{query.trim()}&rdquo;.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
