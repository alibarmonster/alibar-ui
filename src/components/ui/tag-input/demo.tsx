"use client";

import { TagInput } from "@/components/ui/tag-input/tag-input";

export function Default() {
  return (
    <div className="w-full max-w-md space-y-2">
      <label htmlFor="skills" className="text-sm font-medium text-foreground">
        Skills
      </label>
      <TagInput id="skills" defaultValue={["React", "TypeScript", "Motion"]} placeholder="Add a skill…" />
    </div>
  );
}

export function Limited() {
  return (
    <div className="w-full max-w-md space-y-2">
      <label htmlFor="topics" className="text-sm font-medium text-foreground">
        Topics
      </label>
      <TagInput id="topics" maxTags={5} defaultValue={["design", "motion", "a11y"]} placeholder="Add a topic…" />
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Emails() {
  return (
    <div className="w-full max-w-md space-y-2">
      <label htmlFor="invite" className="text-sm font-medium text-foreground">
        Invite teammates
      </label>
      <TagInput
        id="invite"
        separators={["Enter", ",", " "]}
        validate={(tag) => EMAIL.test(tag)}
        addOnBlur
        defaultValue={["alibar@example.com"]}
        placeholder="name@company.com"
        inputMode="email"
      />
      <p className="text-[13px] text-muted-foreground">Space, comma or Enter adds an address. Invalid ones shake.</p>
    </div>
  );
}
