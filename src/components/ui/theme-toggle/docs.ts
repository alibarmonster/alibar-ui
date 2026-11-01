import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ThemeToggle } from "@/components/ui/theme-toggle/theme-toggle";

// Uncontrolled: toggles the "dark" class on <html>, the shadcn convention.
export function Header() {
  return <ThemeToggle />;
}

// Controlled, e.g. with next-themes:
// const { resolvedTheme, setTheme } = useTheme();
// <ThemeToggle theme={resolvedTheme as "light" | "dark"} onThemeChange={setTheme} />`,
  a11y: [
    "A native button labelled \"Switch to dark theme\" or \"Switch to light theme\", so its action is always clear.",
    "The reveal never blocks input; the new theme applies immediately and the circle only animates the snapshot.",
    "With reduced motion enabled, or where the View Transition API is unavailable, the theme switches instantly and the icon morph snaps.",
  ],
  notes: [
    "The circular wipe uses document.startViewTransition and animates clip-path on ::view-transition-new(root) from the button's center.",
    "The CSS that disables the default cross-fade ships with the component (a deduplicated <style>) and only applies while the reveal runs.",
    "onThemeChange runs inside flushSync so React commits the new theme before the browser takes its snapshot.",
  ],
};
