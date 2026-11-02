/**
 * One stable color per usage category, in this order (max 6). Colors are always paired with a
 * label or legend, never used alone. `--chart-6` falls back to violet for themes without it.
 */
export const CATEGORY_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6, #7c3aed)"] as const;

/** Color for the category at `index` in the category list. Indexes past 5 share the last color. */
export const categoryColor = (index: number) => CATEGORY_COLORS[Math.max(0, Math.min(CATEGORY_COLORS.length - 1, index))];
