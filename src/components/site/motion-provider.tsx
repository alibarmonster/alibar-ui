"use client";

import { LazyMotion, MotionConfig } from "motion/react";

const loadFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

/**
 * Site chrome uses Motion's lightweight `m` components; their animation features load lazily, after the first
 * paint. Library components (in demos) still use `motion.*`, which is allowed because this isn't strict mode.
 * MotionConfig is the site-wide safety net: transform animations drop when the OS asks for reduced motion.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
