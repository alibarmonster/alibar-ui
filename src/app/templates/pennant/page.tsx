import type { Metadata } from "next";
import { PennantSite } from "./pennant-site";

export const metadata: Metadata = {
  title: "Pennant: spend control template",
  description: "A complete marketing site for a fictional spend-management company, built from alibar/ui components.",
};

export default function PennantPage() {
  return <PennantSite />;
}
