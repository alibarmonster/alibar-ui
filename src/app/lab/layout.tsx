import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WebGL lab",
  description: "Experimental WebGL2 shaders and ASCII simulations.",
  // An archive of experiments, not part of the library: keep it out of search results.
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <div className="[color-scheme:dark]">{children}</div>;
}
