import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SearchInput } from "@/components/ui/search-input/search-input";

export function DocsSearch() {
  const [query, setQuery] = useState("");
  return <SearchInput aria-label="Search docs" value={query} onValueChange={setQuery} />;
}`,
  a11y: [
    "Uses a native type=\"search\" input, which screen readers announce as a search field. Give it a label or aria-label.",
    "The clear button is labelled \"Clear search\" and returns focus to the field. Escape clears too.",
    "The field empties immediately; the dissolving words are an aria-hidden copy, so assistive tech never reads stale text.",
    "With reduced motion enabled, clearing is instant and the spinner pulses instead of rotating.",
  ],
  notes: [
    "Pass loading while a request is in flight; the search icon morphs into a spinner in the same spot.",
    "The browser's own clear button is hidden so there is only one.",
  ],
};
