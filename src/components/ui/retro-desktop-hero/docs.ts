import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RetroDesktopHero } from "@/components/ui/retro-desktop-hero/retro-desktop-hero";

<RetroDesktopHero
  owner={{ name: "Alibar", role: "Designer & developer", location: "Jakarta, ID", bio: "…", email: "hi@example.com", available: true }}
  windows={[
    { id: "projects", label: "Projects", title: "projects.dir", icon: "folder", render: () => <MyProjects /> },
    { id: "resume", label: "Resume", icon: "document" },
    { id: "terminal", label: "Terminal", icon: "terminal" },
    { id: "trash", label: "Trash", icon: "trash" },
  ]}
/>`,
  a11y: [
    "Desktop icons are buttons with a roving tab stop: arrow keys move between icons in the grid, Space selects, Enter (or a double click) opens.",
    "Each window is a labelled dialog that takes focus when it opens; Escape closes the focused one and focus returns to its icon. Minimize, maximize and close are labelled buttons, and minimized windows are inert.",
    "The taskbar is a navigation landmark with a profile button and one pressed-state button per open window. Under reduced motion windows fade instead of scaling from icons and toward the taskbar, and the availability dot stops pulsing.",
  ],
  notes: [
    "Icons snap to an 88×92 px grid when dropped (onto a free cell; dropping on another icon slides it back) and their positions are saved to localStorage under `persistKey` (wrapped in try/catch; pass null to keep them in memory). Positions are read after hydration, so server and client markup match.",
    "Windows open with a scale from their icon, drag by the title bar, come to the front on click, minimize toward their taskbar button, maximize with the button or a double click on the title bar (a layout animation), and close.",
    "Built-in content per icon: a project grid (folder), a résumé (document), a dithered pixel photo (image), a music player with fake progress (music), the CRT Terminal in flat fallback mode with whoami-style commands (terminal) and an empty trash. Pass `render` on any window for your own content.",
    "The wallpaper defaults to Pixel Landscape (alpine). Below 640px the icons become a grid, one tap opens a window and windows open as full-screen sheets without dragging. Pixel labels use `--font-geist-pixel` (Geist Pixel) and fall back to monospace.",
  ],
};
