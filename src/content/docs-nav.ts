export interface DocsPage {
  title: string;
  href: string;
  description: string;
}

export const docsPages: DocsPage[] = [
  { title: "Introduction", href: "/docs", description: "What alibar/ui is and the principles behind it." },
  { title: "Installation", href: "/docs/installation", description: "Set up a project and add your first component." },
  { title: "Theming", href: "/docs/theming", description: "Color, radius and shadow tokens." },
  { title: "Motion", href: "/docs/motion", description: "Durations, curves, springs and reduced motion." },
];
