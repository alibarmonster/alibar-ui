import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AnimatedPagination } from "@/components/ui/animated-pagination/animated-pagination";

export function Results({ total }: { total: number }) {
  const [page, setPage] = useState(1);
  return <AnimatedPagination totalPages={total} page={page} onPageChange={setPage} />;
}`,
  a11y: [
    "A labelled <nav> list; each page is a button labelled \"Page 3\", and the current one has aria-current=\"page\".",
    "Previous and Next are labelled and disabled at the ends.",
    "Gaps (…) are aria-hidden, since they aren't interactive.",
    "With reduced motion enabled, numbers cross-fade instead of rolling and the indicator jumps.",
  ],
  notes: [
    "The window always has the same number of slots (siblingCount × 2 + 5), so moving through pages rolls numbers in place instead of reflowing the row.",
    "Use siblingCount={0} for tight spaces, such as below a table on mobile.",
  ],
};
