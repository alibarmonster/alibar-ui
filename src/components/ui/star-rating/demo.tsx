"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StarRating } from "@/components/ui/star-rating/star-rating";

const WORDS = ["Tap a star", "Terrible", "Bad", "Okay", "Good", "Excellent"];

export function Default() {
  const [rating, setRating] = useState(0);
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-foreground">How was your experience?</p>
      <StarRating size="lg" label="Your rating" value={rating} onValueChange={setRating} />
      <span className="relative h-5 text-[13px] text-muted-foreground" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={rating}
            initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
            transition={{ duration: 0.2 }}
            className="inline-block"
          >
            {WORDS[Math.ceil(rating)]}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

export function HalfStars() {
  const [rating, setRating] = useState(3.5);
  return (
    <div className="flex items-center gap-3">
      <StarRating allowHalf value={rating} onValueChange={setRating} label="Rating" />
      <span className="w-8 font-mono text-sm text-muted-foreground tabular-nums">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ReadOnly() {
  return (
    <div className="flex items-center gap-2">
      <StarRating readOnly value={4.6} size="sm" label="Average rating" />
      <span className="text-[13px] text-muted-foreground">
        <span className="font-medium text-foreground">4.6</span> · 1,284 reviews
      </span>
    </div>
  );
}
