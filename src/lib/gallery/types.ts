import type { CSSProperties, Ref } from "react";

/** One image in a gallery. */
export interface GalleryItem {
  src: string;
  /** Describes the image for screen readers and the fallback list. */
  alt: string;
  title?: string;
  subtitle?: string;
  /** Optional link, e.g. opened by onSelect. */
  href?: string;
}

/** Imperative handle shared by every gallery. */
export interface GalleryHandle {
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
}

/**
 * Props every gallery accepts. Each gallery copies these into its own props interface (with the
 * JSDoc and defaults that fit it) so its props table stays complete.
 */
export interface GallerySharedProps {
  items: GalleryItem[];
  startIndex?: number;
  autoplay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  draggable?: boolean;
  wheel?: boolean;
  captions?: boolean;
  controls?: boolean;
  backgroundColor?: string;
  paused?: boolean;
  dpr?: number;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  onIndexChange?: (index: number) => void;
  onSelect?: (item: GalleryItem, index: number) => void;
  ref?: Ref<GalleryHandle>;
}
