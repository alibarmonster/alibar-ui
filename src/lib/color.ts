export type Vec3 = [r: number, g: number, b: number];

/**
 * Parses #rgb, #rrggbb or #rrggbbaa (alpha is ignored) into 0–255 channels.
 * Anything else falls back to black, so a typo never crashes a shader.
 */
export function hexToRgb(hex: string): Vec3 {
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3 || value.length === 4) value = [...value.slice(0, 3)].map((c) => c + c).join("");
  if (!/^[\da-f]{6}([\da-f]{2})?$/i.test(value)) return [0, 0, 0];
  const n = Number.parseInt(value.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Hex color as a normalized vec3 (each channel 0–1) for shader uniforms. */
export function hexToVec3(hex: string): Vec3 {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
}
