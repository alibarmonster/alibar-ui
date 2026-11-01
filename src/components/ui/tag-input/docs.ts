import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TagInput } from "@/components/ui/tag-input/tag-input";

export function SkillsField() {
  const [skills, setSkills] = useState(["React"]);
  return <TagInput aria-label="Skills" value={skills} onValueChange={setSkills} maxTags={8} />;
}`,
  a11y: [
    "Each tag has its own remove button labelled \"Remove <tag>\", reachable with Tab.",
    "Backspace in an empty field first highlights the last tag and only removes it on a second press, so tags aren't deleted by accident.",
    "A visually hidden hint explains the keys, and a status region announces added, removed, duplicate and rejected tags.",
    "Separators work from typing, mobile keyboards and paste, so pasting \"a, b, c\" adds three tags.",
    "With reduced motion enabled, tags fade in and out without scaling, and nothing shakes.",
  ],
  notes: [
    "A duplicate makes the existing tag shake instead of adding a copy. Set allowDuplicates to permit repeats.",
    "When validate rejects a tag, the text stays in the field so the user can correct it.",
  ],
};
