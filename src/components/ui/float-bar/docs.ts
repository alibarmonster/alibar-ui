import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FloatBar } from "@/components/ui/float-bar/float-bar";

<FloatBar brand={<Logo />} items={items} secondary={{ label: "Sign in", href: "/login" }} cta={{ label: "Get started", href: "/signup" }} />`,
  a11y: [
    "Dropdown triggers are buttons with `aria-expanded` and `aria-controls`; they open on click, Enter or Space, and on hover with a short delay for mice.",
    "Escape closes an open menu and returns focus to its trigger; clicking outside closes it.",
    "Panel entrances drop their movement under reduced motion.",
  ],
  notes: [
    "`accent` colors the primary button.",
    "The bar is frosted (`backdrop-blur`), so it reads well over images and gradients.",
    "Narrow containers switch to the shared mobile menu.",
  ],
};
