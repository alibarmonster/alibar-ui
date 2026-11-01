import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Twelve invented, monochrome brands for demos (logo clouds, integrations, orbits).
 * They're original marks with made-up names, so demos never ship real company logos;
 * components take your own logos through props.
 */

type MarkProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export interface PlaceholderBrand {
  name: string;
  /** Icon-only mark, for app tiles and orbit icons. */
  Mark: (props: MarkProps) => ReactNode;
  /** Classes that give the wordmark its own typographic voice. */
  wordmark: string;
  /** Text as set in the wordmark (casing differs per brand). */
  label: string;
}

export const placeholderBrands: PlaceholderBrand[] = [
  {
    name: "Lumivo",
    label: "lumivo",
    wordmark: "font-semibold tracking-tight",
    Mark: (props) => (
      <Svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="14.5" cy="9.5" r="2.5" fill="currentColor" stroke="none" />
      </Svg>
    ),
  },
  {
    name: "Corvane",
    label: "CORVANE",
    wordmark: "text-[0.78em] font-bold tracking-[0.2em]",
    Mark: (props) => (
      <Svg {...props}>
        <path d="m5 6 7 5 7-5" />
        <path d="m5 12 7 5 7-5" opacity="0.55" />
      </Svg>
    ),
  },
  {
    name: "Pylonix",
    label: "Pylonix",
    wordmark: "font-medium tracking-tight",
    Mark: (props) => (
      <Svg {...props}>
        <path d="M12 3 21 20H3Z" />
        <path d="M8 14h8" />
      </Svg>
    ),
  },
  {
    name: "Driftwell",
    label: "driftwell",
    wordmark: "font-medium tracking-[-0.03em]",
    Mark: (props) => (
      <Svg {...props}>
        <path d="M3 9c3-3 6 3 9 0s6 3 9 0" />
        <path d="M3 15c3-3 6 3 9 0s6 3 9 0" />
      </Svg>
    ),
  },
  {
    name: "Mosaiq",
    label: "Mosaiq",
    wordmark: "font-semibold",
    Mark: (props) => (
      <Svg {...props} stroke="none" fill="currentColor">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="4" opacity="0.55" />
        <rect x="3" y="13" width="8" height="8" rx="4" opacity="0.55" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </Svg>
    ),
  },
  {
    name: "Tessaly",
    label: "TESSALY",
    wordmark: "text-[0.82em] font-semibold tracking-[0.24em]",
    Mark: (props) => (
      <Svg {...props}>
        <path d="M12 2.5 20.5 7.25v9.5L12 21.5l-8.5-4.75v-9.5Z" />
        <path d="M12 12v9.5M12 12l8.5-4.75M12 12 3.5 7.25" opacity="0.55" />
      </Svg>
    ),
  },
  {
    name: "Quorvex",
    label: "quorvex",
    wordmark: "font-bold tracking-[-0.05em]",
    Mark: (props) => (
      <Svg {...props}>
        <path d="M19 12a7 7 0 1 1-2.05-4.95" />
        <circle cx="19.5" cy="5.5" r="1.5" fill="currentColor" stroke="none" />
      </Svg>
    ),
  },
  {
    name: "Brightloom",
    label: "Brightloom",
    wordmark: "font-medium tracking-tight",
    Mark: (props) => (
      <Svg {...props} stroke="none" fill="currentColor">
        <path d="M12 2c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" />
        <path d="M18.5 15c.3 2.1 1.1 2.9 3.2 3.2-2.1.3-2.9 1.1-3.2 3.2-.3-2.1-1.1-2.9-3.2-3.2 2.1-.3 2.9-1.1 3.2-3.2Z" opacity="0.55" />
      </Svg>
    ),
  },
  {
    name: "Halvane",
    label: "HALVANE",
    wordmark: "text-[0.8em] font-bold tracking-[0.14em]",
    Mark: (props) => (
      <Svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
      </Svg>
    ),
  },
  {
    name: "Nimbra",
    label: "nimbra",
    wordmark: "font-semibold tracking-tight",
    Mark: (props) => (
      <Svg {...props}>
        <path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 .5 9Z" />
      </Svg>
    ),
  },
  {
    name: "Fernwick",
    label: "Fernwick",
    wordmark: "font-serif font-semibold tracking-tight",
    Mark: (props) => (
      <Svg {...props}>
        <path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14Z" />
        <path d="M5 19 13 11" />
      </Svg>
    ),
  },
  {
    name: "Orbiq",
    label: "orbiq",
    wordmark: "font-bold tracking-tight",
    Mark: (props) => (
      <Svg {...props}>
        <circle cx="12" cy="12" r="5" />
        <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)" opacity="0.55" />
      </Svg>
    ),
  },
];

export const getPlaceholderBrand = (name: string) => placeholderBrands.find((brand) => brand.name === name) ?? placeholderBrands[0];

/** Mark plus wordmark, sized by font-size (1em tall mark). */
export function PlaceholderLogo({ brand, className, markOnly = false }: { brand: PlaceholderBrand; className?: string; markOnly?: boolean }) {
  const { Mark } = brand;
  return (
    <span className={cn("inline-flex items-center gap-[0.4em] leading-none whitespace-nowrap", className)}>
      <Mark className="size-[1.15em] shrink-0" />
      {markOnly ? <span className="sr-only">{brand.name}</span> : <span className={brand.wordmark}>{brand.label}</span>}
    </span>
  );
}

/** Ready-made `{ name, logo }` items for logo components. */
export const placeholderLogos = placeholderBrands.map((brand) => ({
  name: brand.name,
  logo: <PlaceholderLogo brand={brand} />,
}));
