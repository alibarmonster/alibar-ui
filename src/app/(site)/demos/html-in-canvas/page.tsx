import type { Metadata } from "next";
import { HtmlInCanvasDemo } from "./html-in-canvas-demo";

export const metadata: Metadata = {
  title: "HTML in Canvas demo",
  description: "Live DOM drawn into canvas and WebGL with the experimental HTML-in-Canvas API: a support check, an adapter test and all ten components, each with a native and a fallback mode.",
};

export default function HtmlInCanvasPage() {
  return <HtmlInCanvasDemo />;
}
