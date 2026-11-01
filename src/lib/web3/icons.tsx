"use client";

import { useId, type ComponentProps } from "react";
import { hexToRgb } from "@/lib/color";
import { cn } from "@/lib/utils";

/**
 * Generated avatars for tokens, chains and accounts. No third-party logos are bundled:
 * pass `iconUrl` (tokens, chains) or `src` (accounts) to show your own artwork.
 */

const PALETTE = ["#6366F1", "#2563EB", "#0EA5E9", "#14B8A6", "#16A34A", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#64748B"];

function hashString(value: string) {
  let hash = 0x811c9dc5;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  return hash >>> 0;
}

/** Text color with enough contrast on a fill (relative luminance threshold). */
function inkFor(fill: string) {
  const [r, g, b] = hexToRgb(fill).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#09090B" : "#FFFFFF";
}

function Monogram({ text, fill, size, shape, className }: { text: string; fill: string; size: number; shape: "circle" | "squircle"; className?: string }) {
  const letters = text.slice(0, 4);
  const fontSize = letters.length <= 2 ? 13 : letters.length === 3 ? 10 : 8.5;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      {shape === "circle" ? <circle cx="16" cy="16" r="16" fill={fill} /> : <rect width="32" height="32" rx="9" fill={fill} />}
      <text
        x="16"
        y="16"
        dy="0.35em"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill={inkFor(fill)}
        style={{ fontFamily: "inherit", letterSpacing: letters.length > 2 ? "-0.02em" : undefined }}
      >
        {letters}
      </text>
    </svg>
  );
}

function ImageIcon({ src, size, rounded, className }: { src: string; size: number; rounded: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- consumers pass arbitrary logo URLs
  return <img src={src} alt="" width={size} height={size} className={cn("shrink-0 object-cover", rounded, className)} />;
}

export interface TokenIconProps {
  token: { symbol: string; iconUrl?: string; color?: string };
  /** Pixel size. @default 24 */
  size?: number;
  className?: string;
}

/** A token's logo, or a colored circle with its symbol. Decorative: pair it with visible text. */
export function TokenIcon({ token, size = 24, className }: TokenIconProps) {
  if (token.iconUrl) return <ImageIcon src={token.iconUrl} size={size} rounded="rounded-full" className={className} />;
  const fill = token.color ?? PALETTE[hashString(token.symbol) % PALETTE.length];
  return <Monogram text={token.symbol} fill={fill} size={size} shape="circle" className={className} />;
}

export interface ChainIconProps {
  chain: { name: string; shortName?: string; iconUrl?: string; color?: string };
  /** Pixel size. @default 20 */
  size?: number;
  className?: string;
}

/** A chain's logo, or a rounded square with its initial. Decorative: pair it with visible text. */
export function ChainIcon({ chain, size = 20, className }: ChainIconProps) {
  if (chain.iconUrl) return <ImageIcon src={chain.iconUrl} size={size} rounded="rounded-[28%]" className={className} />;
  const fill = chain.color ?? PALETTE[hashString(chain.name) % PALETTE.length];
  return <Monogram text={(chain.shortName ?? chain.name).charAt(0)} fill={fill} size={size} shape="squircle" className={className} />;
}

export interface WalletIconProps {
  wallet: { name: string; iconUrl?: string; color?: string };
  /** Pixel size. @default 32 */
  size?: number;
  className?: string;
}

/** A wallet's logo, or a rounded square with its initial. Decorative: pair it with visible text. */
export function WalletIcon({ wallet, size = 32, className }: WalletIconProps) {
  if (wallet.iconUrl) return <ImageIcon src={wallet.iconUrl} size={size} rounded="rounded-[28%]" className={className} />;
  const fill = wallet.color ?? PALETTE[hashString(wallet.name) % PALETTE.length];
  return <Monogram text={wallet.name.charAt(0)} fill={fill} size={size} shape="squircle" className={className} />;
}

export interface AddressAvatarProps extends Omit<ComponentProps<"svg">, "children"> {
  address: string;
  /** Pixel size. @default 24 */
  size?: number;
}

/** A deterministic gradient avatar for an address: same address, same avatar, on every device. */
export function AddressAvatar({ address, size = 24, className, ...props }: AddressAvatarProps) {
  const id = useId();
  const hex = address.toLowerCase().replace(/^0x/, "").padEnd(40, "0");
  const byte = (i: number) => Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16) || 0;
  const hue = Math.round((byte(0) / 255) * 360);
  const hue2 = (hue + 40 + Math.round((byte(1) / 255) * 120)) % 360;
  const angle = Math.round((byte(2) / 255) * 360);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0 rounded-full", className)} {...props}>
      <defs>
        <linearGradient id={`${id}g`} gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0" stopColor={`hsl(${hue} 85% 64%)`} />
          <stop offset="1" stopColor={`hsl(${hue2} 80% 52%)`} />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="32" height="32" fill={`url(#${id}g)`} />
        <circle cx={6 + (byte(3) % 20)} cy={6 + (byte(4) % 20)} r={6 + (byte(5) % 6)} fill="#fff" opacity="0.32" />
        <circle cx={6 + (byte(6) % 20)} cy={6 + (byte(7) % 20)} r={3 + (byte(8) % 5)} fill="#fff" opacity="0.22" />
      </g>
    </svg>
  );
}
