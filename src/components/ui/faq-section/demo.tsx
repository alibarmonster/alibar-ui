"use client";

import { FaqSection, type FaqItem } from "@/components/ui/faq-section/faq-section";

const ITEMS: FaqItem[] = [
  { question: "Do I need to install a package?", answer: "No. Each component is copied into your project with the shadcn CLI or by hand, so you own the code." },
  { question: "Which frameworks are supported?", answer: "Any React 19 project with Tailwind CSS v4. The docs site uses Next.js, but nothing depends on it." },
  { question: "Are the components accessible?", answer: "Yes: keyboard support, focus rings, ARIA roles and reduced-motion fallbacks are built into every component." },
  { question: "Can I use them commercially?", answer: "Yes. alibar/ui is MIT licensed, so you can use it in commercial products." },
  { question: "How do the web3 components handle amounts?", answer: "Every amount is a bigint with its token decimals, formatted as text, so nothing is ever rounded through floating point." },
  { question: "Do shaders work without WebGL?", answer: "Yes. Without WebGL2, or with reduced motion on, shaders show a static frame or a matching CSS gradient." },
];

export function Default() {
  return <FaqSection items={ITEMS} description="Try searching for “web3”, “license” or “keyboard”." />;
}
