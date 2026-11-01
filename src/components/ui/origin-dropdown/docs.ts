import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import {
  OriginDropdown,
  OriginDropdownContent,
  OriginDropdownItem,
  OriginDropdownTrigger,
} from "@/components/ui/origin-dropdown/origin-dropdown";

export function RowActions() {
  return (
    <OriginDropdown>
      <OriginDropdownTrigger asChild>
        <button>Actions</button>
      </OriginDropdownTrigger>
      <OriginDropdownContent align="end">
        <OriginDropdownItem onSelect={duplicate}>Duplicate</OriginDropdownItem>
        <OriginDropdownItem destructive onSelect={remove}>Delete</OriginDropdownItem>
      </OriginDropdownContent>
    </OriginDropdown>
  );
}`,
  a11y: [
    "Built on Radix DropdownMenu: role=\"menu\" and \"menuitem\", arrow keys, typeahead, Home and End, and Escape returns focus to the trigger.",
    "Disabled items are announced and skipped, and destructive items keep their label, so meaning isn't carried by color alone.",
    "The highlight follows keyboard focus as well as the pointer.",
    "With reduced motion enabled, the menu fades without scaling, items appear together and the highlight jumps.",
  ],
  notes: [
    "The menu scales from --radix-dropdown-menu-content-transform-origin, so it grows from the trigger's edge even when Radix flips it to fit.",
    "Use onSelect on items for actions; Radix closes the menu afterwards.",
  ],
};
