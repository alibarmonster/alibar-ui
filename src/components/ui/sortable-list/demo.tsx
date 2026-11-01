"use client";

import { useState } from "react";
import { SortableList } from "@/components/ui/sortable-list/sortable-list";

type Task = { id: string; title: string; tag: string };

const TASKS: Task[] = [
  { id: "a", title: "Write the launch post", tag: "Marketing" },
  { id: "b", title: "Fix checkout rounding bug", tag: "Bug" },
  { id: "c", title: "Record onboarding video", tag: "Design" },
  { id: "d", title: "Migrate billing webhooks", tag: "Backend" },
  { id: "e", title: "Review accessibility audit", tag: "Quality" },
];

export function Default() {
  const [tasks, setTasks] = useState(TASKS);
  return (
    <div className="w-full max-w-md">
      <p className="mb-3 text-sm font-medium text-foreground">Priorities this week</p>
      <SortableList
        aria-label="Priorities"
        items={tasks}
        onReorder={setTasks}
        getKey={(t) => t.id}
        getLabel={(t) => t.title}
        renderItem={(t) => (
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm text-foreground">{t.title}</span>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/65">{t.tag}</span>
          </div>
        )}
      />
      <p className="mt-3 text-xs text-muted-foreground">Drag a handle, or focus it and press Space, then the arrow keys.</p>
    </div>
  );
}
