import { useEffect, useRef } from "react";
import { useGalleryInput, type GalleryInput, type UseGalleryInputOptions } from "@/lib/gallery/use-gallery-input";
import { useGalleryRenderer, type GalleryFrame, type GalleryFrameState, type UseGalleryRendererOptions } from "@/lib/gallery/use-gallery-renderer";

export interface UseGalleryOptions extends Omit<UseGalleryInputOptions, "invalidate">, Pick<UseGalleryRendererOptions, "images" | "dpr" | "textureSize" | "maxTextures"> {
  /** Builds each frame from the input state, e.g. card positions from `input.position()`. */
  frame: (state: GalleryFrameState, input: GalleryInput) => GalleryFrame;
}

/** The renderer and the input hook wired together: input changes request frames, frames read input. */
export function useGallery<T extends HTMLElement = HTMLDivElement>({ images, dpr, textureSize, maxTextures, frame, ...inputOptions }: UseGalleryOptions) {
  const invalidateRef = useRef(() => {});
  const input = useGalleryInput({ ...inputOptions, invalidate: () => invalidateRef.current() });
  const renderer = useGalleryRenderer<T>({ images, dpr, textureSize, maxTextures, frame: (state) => frame(state, input) });
  const { invalidate } = renderer;
  useEffect(() => {
    invalidateRef.current = invalidate;
  }, [invalidate]);
  // `bind` is returned on its own: pass it straight to the root's ref (the compiler treats whatever
  // feeds a ref prop as a ref, so it must not be read off the input object during render).
  return { ...renderer, bind: input.bind, input };
}
