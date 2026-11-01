import type { Metadata } from "next";
import { StripTest } from "./strip-test";

export const metadata: Metadata = {
  title: "Gallery engine test",
  description: "A flat strip of textured cards that proves the shared gallery renderer, input and accessibility layer.",
};

export default function GalleryStripPage() {
  return <StripTest />;
}
