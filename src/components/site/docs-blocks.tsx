import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PropsGroup } from "@/lib/docs/types";
import { cn } from "@/lib/utils";

export function SectionHeading({
  id,
  children,
  as: Tag = "h2",
  className,
}: {
  id: string;
  children: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        "group scroll-mt-24 font-semibold tracking-tight text-foreground",
        Tag === "h2" ? "mt-14 mb-4 text-xl" : "mt-8 mb-3 text-base",
        className,
      )}
    >
      <a href={`#${id}`} className="focus-ring inline-flex items-center gap-2 rounded-sm">
        {children}
        <span aria-hidden="true" className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          #
        </span>
      </a>
    </Tag>
  );
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "space-y-4 text-[15px] leading-7 text-muted-foreground",
        "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-4 [&_a:hover]:decoration-foreground",
        "[&_strong]:font-medium [&_strong]:text-foreground",
        "[&_:not(pre)>code]:rounded-[5px] [&_:not(pre)>code]:bg-surface-2 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.85em] [&_:not(pre)>code]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-10">
      {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
      <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-[2.125rem]">{title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-pretty text-muted-foreground sm:text-[17px]">{description}</p>
      {children}
    </header>
  );
}

export function PropsTable({ groups }: { groups: PropsGroup[] }) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.name}>
          {groups.length > 1 ? (
            <h3 className="mb-3 font-mono text-sm font-medium text-foreground">
              {group.name.replace(/Props$/, "")}
            </h3>
          ) : null}
          <div tabIndex={0} role="region" aria-label={`${group.name} props`} className="focus-ring overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-surface text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="w-[22%] px-4 py-2.5 font-medium">Prop</th>
                  <th scope="col" className="w-[30%] px-4 py-2.5 font-medium">Type</th>
                  <th scope="col" className="w-[14%] px-4 py-2.5 font-medium">Default</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border border-t border-border">
                {group.props.map((prop) => (
                  <tr key={prop.name} className="align-top">
                    <td className="px-4 py-3">
                      <code className="font-mono text-[13px] font-medium text-foreground">
                        {prop.name}
                        {prop.required ? (
                          <span className="text-destructive" aria-label="required">
                            *
                          </span>
                        ) : null}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-[12.5px] leading-5 break-words text-[#0e7490]">{prop.type}</code>
                    </td>
                    <td className="px-4 py-3">
                      {prop.defaultValue ? (
                        <code className="font-mono text-[12.5px] text-foreground">{prop.defaultValue}</code>
                      ) : (
                        <span className="text-muted-foreground" aria-label="none">
                          –
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 leading-6 text-muted-foreground">{prop.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {group.extendsComponent ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Also accepts every prop of Radix{" "}
              <code className="rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-foreground">
                {group.extendsComponent}
              </code>
              , including <code className="font-mono text-[12px] text-foreground">className</code> and{" "}
              <code className="font-mono text-[12px] text-foreground">disabled</code>.
            </p>
          ) : null}
          {group.extendsElement ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Also accepts every native{" "}
              <code className="rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-foreground">
                &lt;{group.extendsElement}&gt;
              </code>{" "}
              attribute, including <code className="font-mono text-[12px] text-foreground">ref</code> and{" "}
              <code className="font-mono text-[12px] text-foreground">className</code>.
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function Pager({
  prev,
  next,
}: {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
}) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="Previous and next page" className="mt-16 grid grid-cols-2 gap-3 border-t border-border pt-8">
      {prev ? (
        <Link
          href={prev.href}
          className="focus-ring group flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:bg-surface"
        >
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            Previous
          </span>
          <span className="text-sm font-medium text-foreground">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="focus-ring group flex flex-col items-end gap-1 rounded-xl border border-border p-4 text-right transition-colors hover:bg-surface"
        >
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Next
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-foreground">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}

export function Callout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="relative ml-3.5 space-y-10 border-l border-border pl-7 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <li className="relative [counter-increment:step]">
      <span
        aria-hidden="true"
        className="absolute top-0 -left-[calc(1.75rem+0.875rem+0.5px)] flex size-7 items-center justify-center rounded-full border border-border bg-background font-mono text-xs font-medium text-foreground before:content-[counter(step)]"
      />
      <h3 id={id} className="scroll-mt-24 text-[15px] font-semibold text-foreground">
        {title}
      </h3>
      <div className="mt-3 space-y-3">{children}</div>
    </li>
  );
}
