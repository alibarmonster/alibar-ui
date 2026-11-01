"use client";

import { useRef } from "react";
import { Sparkles } from "lucide-react";
import { FileDropzone } from "@/components/ui/file-dropzone/file-dropzone";

let uploads = 0;

/** Pretend upload: reports progress in bursts and fails every third file. */
function simulateUpload(file: File, report: (progress: number) => void) {
  const fail = ++uploads % 3 === 0;
  return new Promise<void>((resolve, reject) => {
    let progress = 0;
    const tick = () => {
      progress += 8 + Math.random() * 16;
      if (fail && progress > 55) return reject(new Error("Network error"));
      report(Math.min(progress, 100));
      if (progress >= 100) resolve();
      else window.setTimeout(tick, 140 + Math.random() * 180);
    };
    window.setTimeout(tick, 250);
  });
}

/** A small gradient PNG, so the sample image has a real preview. */
function samplePhoto() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 96, 96);
  gradient.addColorStop(0, "#93c5fd");
  gradient.addColorStop(1, "#2563eb");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 96, 96);
  return new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
}

/** Drops generated files onto the zone, for trying it without files at hand. */
async function dropSamples(zone: HTMLElement | null) {
  const button = zone?.querySelector("button");
  if (!button) return;
  const transfer = new DataTransfer();
  transfer.items.add(new File([new Uint8Array(2_400_000)], "brand-guidelines.pdf", { type: "application/pdf" }));
  transfer.items.add(new File([await samplePhoto()], "hero-photo.png", { type: "image/png" }));
  transfer.items.add(new File([new Uint8Array(18_000)], "launch-notes.md", { type: "text/markdown" }));
  button.dispatchEvent(new DragEvent("drop", { dataTransfer: transfer, bubbles: true, cancelable: true }));
}

export function Default() {
  const zone = useRef<HTMLDivElement>(null);
  return (
    <div className="w-full max-w-md space-y-3">
      <FileDropzone
        ref={zone}
        accept="image/*,.pdf,.md,.txt"
        maxSize={5 * 1024 * 1024}
        maxFiles={5}
        onUpload={simulateUpload}
        hint="Images, PDF or Markdown, up to 5 MB each."
      />
      <button
        type="button"
        onClick={() => dropSamples(zone.current)}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Sparkles className="size-3.5" aria-hidden="true" />
        Drop sample files
      </button>
    </div>
  );
}

export function SingleImage() {
  return (
    <div className="w-full max-w-sm">
      <FileDropzone
        accept="image/png,image/jpeg,image/webp"
        multiple={false}
        maxSize={2 * 1024 * 1024}
        onUpload={simulateUpload}
        label="Upload a profile photo"
        hint="PNG, JPG or WebP, up to 2 MB."
      />
    </div>
  );
}
