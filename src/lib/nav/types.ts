import type { ReactNode } from "react";

/** A link in a menu or panel. */
export interface NavLink {
  label: string;
  href: string;
  /** A short line under the label in rich menus. */
  description?: string;
  /** An icon shown beside the label in rich menus. */
  icon?: ReactNode;
}

/** A top-level navbar entry: a plain link, or a trigger with links under it. */
export interface NavItem {
  label: string;
  /** Destination when the item is a plain link. */
  href?: string;
  /** Links shown in the item's menu; makes the item a menu trigger. */
  items?: NavLink[];
}

/** A call-to-action button. */
export interface NavAction {
  label: string;
  href: string;
}
