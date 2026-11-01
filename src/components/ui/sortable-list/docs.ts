import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { useState } from "react";
import { SortableList } from "@/components/ui/sortable-list/sortable-list";

export function Priorities() {
  const [tasks, setTasks] = useState(initialTasks);
  return (
    <SortableList
      items={tasks}
      onReorder={setTasks}
      getKey={(t) => t.id}
      getLabel={(t) => t.title}
      renderItem={(t) => <span>{t.title}</span>}
    />
  );
}`,
  a11y: [
    "Every row has a drag handle that also works from the keyboard: Space picks the item up, Up and Down move it, Space drops it, and Escape puts it back.",
    "Each step is announced (“moved to position 3 of 5”), and the handle has instructions via aria-describedby.",
    "With reduced motion enabled, rows move without animating.",
  ],
  notes: [
    "Built on Motion's Reorder, with dragging limited to the handle so text in a row stays selectable and touch scrolling still works.",
    "Rows glide into place with layout animation; the lifted row scales slightly and its shadow fades in as a layer.",
    "Controlled: you own the array and receive the new order through onReorder.",
  ],
};
