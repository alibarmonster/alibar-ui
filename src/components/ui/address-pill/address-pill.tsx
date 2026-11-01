"use client";

import type { ComponentProps } from "react";
import { ArrowUpRight } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button/copy-button";
import { cn } from "@/lib/utils";
import { checksumAddress, truncateAddress } from "@/lib/web3/format";
import { AddressAvatar } from "@/lib/web3/icons";
import { explorerLink } from "@/lib/web3/types";

export interface AddressPillProps extends Omit<ComponentProps<"div">, "children"> {
  /** Wallet or contract address. Shown checksummed and truncated as 0x1234…abcd. */
  address: string;
  /** A display name (such as an ENS name) shown instead of the address. Copy still copies the address. */
  name?: string;
  /** Block explorer base URL, e.g. https://etherscan.io. Adds a link to the address page. */
  explorerUrl?: string;
  /** Show the copy button. @default true */
  copyable?: boolean;
  /** Show the avatar. @default true */
  showAvatar?: boolean;
  /** Avatar image URL. Without one, a gradient generated from the address is shown. */
  avatarUrl?: string;
  /** Characters kept at the start (including 0x) and at the end. @default { start: 6, end: 4 } */
  truncate?: { start?: number; end?: number };
  /** Pill size. @default "md" */
  size?: "sm" | "md";
  /** Show a skeleton while the address or name is loading. @default false */
  loading?: boolean;
  /** Called with the checksummed address after it's copied. */
  onCopied?: (address: string) => void;
}

const sizes = {
  sm: { root: "h-7 gap-0.5 pl-0.5 pr-0.5 text-xs", avatar: 22, button: "size-6 [&_svg]:size-3.5", label: "px-1.5" },
  md: { root: "h-9 gap-0.5 pl-1 pr-1 text-[13px]", avatar: 28, button: "size-7", label: "px-2" },
} as const;

export function AddressPill({
  address,
  name,
  explorerUrl,
  copyable = true,
  showAvatar = true,
  avatarUrl,
  truncate,
  size = "md",
  loading = false,
  onCopied,
  className,
  ...props
}: AddressPillProps) {
  const s = sizes[size];
  const checksummed = checksumAddress(address);
  const short = truncateAddress(checksummed, truncate);
  const href = explorerLink(explorerUrl, "address", checksummed);

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading address"
        className={cn("inline-flex items-center rounded-full border border-border bg-background", s.root, className)}
        {...props}
      >
        <span className="animate-pulse rounded-full bg-muted motion-reduce:animate-none" style={{ width: s.avatar, height: s.avatar }} />
        <span className={cn("h-3 w-24 animate-pulse rounded-full bg-muted motion-reduce:animate-none", size === "sm" ? "mx-1.5" : "mx-2")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center rounded-full border border-border bg-background text-foreground shadow-xs transition-colors hover:bg-surface",
        s.root,
        !copyable && !href && (size === "sm" ? "pr-1" : "pr-2"),
        !showAvatar && "pl-1",
        className,
      )}
      {...props}
    >
      {showAvatar ? (
        avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- consumers pass arbitrary avatar URLs
          <img src={avatarUrl} alt="" width={s.avatar} height={s.avatar} className="shrink-0 rounded-full object-cover" />
        ) : (
          <AddressAvatar address={checksummed} size={s.avatar} />
        )
      ) : null}
      <span title={checksummed} className={cn("min-w-0 truncate", s.label, name ? "font-medium" : "font-mono tabular-nums")}>
        {name ?? short}
      </span>
      {copyable ? (
        <CopyButton
          value={checksummed}
          variant="ghost"
          size="sm"
          aria-label={`Copy address ${short}`}
          onCopied={onCopied}
          className={cn("rounded-full text-muted-foreground hover:text-foreground", s.button)}
        />
      ) : null}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label="View on block explorer"
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors",
            "after:absolute after:-inset-1 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            s.button,
          )}
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
