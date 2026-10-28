import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "alibar/components — WebGL & Tactile UI Primitives",
  description:
    "Zero-bloat WebGL shaders, spring-driven tactile controls, and interactive React 19 primitives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-[#c8ff4d] selection:text-black">
        {children}
      </body>
    </html>
  );
}
