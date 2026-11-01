import type { ComponentProps, ElementType, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BentoGridProps = ComponentProps<"div">;

/** A responsive grid for BentoTiles: one column on phones, two on tablets, three on desktops. */
export function BentoGrid({ className, ...props }: BentoGridProps) {
  return <div className={cn("grid auto-rows-[minmax(17rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)} {...props} />;
}

export interface BentoTileProps extends Omit<ComponentProps<"div">, "title"> {
  /** Tile heading. */
  title: string;
  /** Supporting line under the title. */
  description?: string;
  /** Small icon above the title. */
  icon?: ReactNode;
  /** Makes the whole tile a link to this destination. */
  href?: string;
  /** Text of the call to action that slides in on hover. @default "Learn more" */
  cta?: string;
  /** Link component for href, e.g. Next.js Link. @default "a" */
  linkComponent?: ElementType;
  /** Heading level of the title, to fit your page outline. @default 3 */
  headingLevel?: 2 | 3 | 4;
  /** Visual area at the top; animate it with group-hover:/group-focus-within: classes. */
  children?: ReactNode;
}

/**
 * A tile that lifts on hover (and when anything inside has keyboard focus).
 * It exposes Tailwind's `group`, so the visual can animate with group-hover: classes.
 */
export function BentoTile({ title, description, icon, href, cta = "Learn more", linkComponent: Link = "a", headingLevel = 3, className, children, ...props }: BentoTileProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground",
        "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 focus-within:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0",
        className,
      )}
      {...props}
    >
      {/* The lift's deeper shadow fades in as a layer, so only opacity animates. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 shadow-lg transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100"
      />
      {children ? <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div> : <div className="flex-1" />}
      <div className="relative p-5">
        {icon ? <div className="mb-3 flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-foreground [&_svg]:size-4">{icon}</div> : null}
        <Heading className="font-semibold tracking-tight text-foreground">
          {href ? (
            // The link stretches over the whole tile, so the tile is one large click target.
            <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring">
              {title}
            </Link>
          ) : (
            title
          )}
        </Heading>
        {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        {href ? (
          <span
            aria-hidden="true"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground opacity-0 transition-[opacity,translate] duration-300 -translate-x-1 group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100 max-sm:translate-x-0 max-sm:opacity-100"
          >
            {cta}
            <ArrowRight className="size-3.5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
