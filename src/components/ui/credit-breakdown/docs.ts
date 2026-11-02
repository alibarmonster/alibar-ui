import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CreditBreakdown } from "@/components/ui/credit-breakdown/credit-breakdown";

<CreditBreakdown
  categories={[{ id: "chat", name: "Chat & reasoning" }, { id: "agents", name: "Agent runs" }]}
  periods={[
    { id: "7d", label: "7 days", workflows: weekWorkflows, teammates: weekTeammates },
    { id: "30d", label: "30 days", workflows, teammates },
  ]}
  plan={{ name: "Team Pro", included: 500000, used: 427200, renewsOn: "2026-11-19" }}
  onChangePlan={() => openPlans()}
/>`,
  a11y: [
    "The category legend is a group of toggle buttons that filter the table, so the meter's colors always have names and the filter works from the keyboard; the meter itself is a pointer shortcut.",
    "Workflows and Teammates are tabs with arrow-key support. The table uses table, row, columnheader and cell roles, and sortable headers are buttons with aria-sort.",
    "Hidden rows behind \"Show all\" are inert until expanded. Export changes its accessible name through Exporting and Exported, and the result is announced politely.",
  ],
  notes: [
    "Credits are integers. Category totals, KPIs and shares are derived from the selected period's workflows; switching periods rolls every number.",
    "Export builds a CSV of the rows currently shown (after search and filter) in the browser and downloads it. Pass `onExport` to handle the CSV yourself.",
    "Credits per task is the period's credits divided by its runs, rounded to a whole credit.",
  ],
};
