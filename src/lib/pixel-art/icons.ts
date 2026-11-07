/**
 * Original pixel-art icons as character maps: one string per row, one character per pixel,
 * `.` for transparent. Colors are looked up by character, so any slot can be recolored.
 */
export interface PixelArtData {
  width: number;
  height: number;
  rows: readonly string[];
  /** Color per character. */
  colors: Readonly<Record<string, string>>;
}

/** Shared retro palette for the desktop icons. */
export const PIXEL_PALETTE = {
  k: "#1d2130", // outline
  w: "#ffffff",
  l: "#e6e9f0", // light gray
  s: "#c4cad6", // silver
  g: "#8a93a6", // gray
  d: "#4d5568", // dark gray
  D: "#151b2c", // screen
  y: "#ffc94d", // folder front
  Y: "#ffe7a3", // folder highlight
  o: "#eb9b2d", // folder back
  O: "#bd7417", // folder shade
  b: "#2563eb", // accent blue
  c: "#9cc8ff", // sky
  p: "#ffd75e", // sun
  G: "#3fae6b", // green
  E: "#24774a", // dark green
  v: "#8b5cf6", // violet
  V: "#6236d4", // deep violet
  r: "#ff6b8b", // pink
} as const;

const icon = (rows: string[], colors: Record<string, string> = PIXEL_PALETTE): PixelArtData => ({
  width: rows[0]?.length ?? 0,
  height: rows.length,
  rows,
  colors,
});

export const PIXEL_ICONS = {
  folder: icon([
    "................",
    "................",
    ".kkkkk..........",
    "kOoooOk.........",
    "kOooooOkkkkkkkk.",
    "kOooooooooooooOk",
    "kkkkkkkkkkkkkkkk",
    "kYYYYYYYYYYYYYOk",
    "kyyyyyyyyyyyyyOk",
    "kyyyyyyyyyyyyyOk",
    "kyyyyyyyyyyyyyOk",
    "kyyyyyyyyyyyyyOk",
    "kyyyyyyyyyyyyyOk",
    "kyyyyyyyyyyyyyOk",
    "kOOOOOOOOOOOOOOk",
    "kkkkkkkkkkkkkkkk",
  ]),
  document: icon([
    "..kkkkkkkkk.....",
    "..kwwwwwwwkk....",
    "..kwwwwwwwklk...",
    "..kwwwwwwwkllk..",
    "..kwwwwwwwkkkkk.",
    "..kwwwwwwwwwwwk.",
    "..kwbbbbbbbwwwk.",
    "..kwwwwwwwwwwwk.",
    "..kwggggggggwwk.",
    "..kwwwwwwwwwwwk.",
    "..kwgggggggggwk.",
    "..kwwwwwwwwwwwk.",
    "..kwggggggwwwwk.",
    "..kwwwwwwwwwwwk.",
    "..klllllllllllk.",
    "..kkkkkkkkkkkkk.",
  ]),
  image: icon([
    "................",
    "kkkkkkkkkkkkkkkk",
    "kwwwwwwwwwwwwwwk",
    "kwkkkkkkkkkkkkwk",
    "kwkcccccccccckwk",
    "kwkccccccppcckwk",
    "kwkccccccppcckwk",
    "kwkcccGcccccckwk",
    "kwkccGGGcccEckwk",
    "kwkcGGGGGcEEEkwk",
    "kwkGGGGGGEEEEkwk",
    "kwkEGGGGEEEEEkwk",
    "kwkEEEEEEEEEEkwk",
    "kwkkkkkkkkkkkkwk",
    "kwwwwwwwwwwwwwwk",
    "kkkkkkkkkkkkkkkk",
  ]),
  music: icon([
    "................",
    "................",
    "....kkkkkkkkkk..",
    "....kVVVVVVVVk..",
    "....kvvvvvvvvk..",
    "....kvkkkkkkvk..",
    "....kvk....kvk..",
    "....kvk....kvk..",
    "....kvk....kvk..",
    "....kvk....kvk..",
    ".kkkkvk.kkkkvk..",
    "kwvvvvkkwvvvvk..",
    "kvvvvVkkvvvvVk..",
    ".kkkkk..kkkkk...",
    "................",
    "................",
  ]),
  terminal: icon([
    "................",
    "kkkkkkkkkkkkkkkk",
    "kssssssssssssssk",
    "ksDDDDDDDDDDDDsk",
    "ksDGDDDDDDDDDDsk",
    "ksDDGDlllllDDDsk",
    "ksDGDDDDDDDDDDsk",
    "ksDDDDDDDDDDDDsk",
    "ksDGDDDDDDDDDDsk",
    "ksDDGDccDDDDDDsk",
    "ksDGDDDDDDDDDDsk",
    "ksDDDDDDDDDDDDsk",
    "kssssssssssssssk",
    "kkkkkkkkkkkkkkkk",
    "......kggk......",
    "....kkkkkkkk....",
  ]),
  trash: icon([
    "......kkkk......",
    ".....kgggk......",
    ".kkkkkkkkkkkkkk.",
    ".klllllllllllsk.",
    ".kkkkkkkkkkkkkk.",
    "..kwssgssgssgk..",
    "..kwssgssgssgk..",
    "..kwssgssgssgk..",
    "..kwssgssgssgk..",
    "..kwssgssgssgk..",
    "..kwssgssgssgk..",
    "..kwssgssgssgk..",
    "..kwssgssgssgk..",
    "..kwssgssgssgk..",
    "...kkkkkkkkkk...",
    "................",
  ]),
} as const;

export type PixelIconName = keyof typeof PIXEL_ICONS;

/** Recolorable slots of the pixel avatar. */
export interface PixelAvatarColors {
  hair: string;
  skin: string;
  skinShade: string;
  shirt: string;
  shirtShade: string;
  eyes: string;
  mouth: string;
}

export const DEFAULT_AVATAR_COLORS: PixelAvatarColors = {
  hair: "#2b2140",
  skin: "#f2c39b",
  skinShade: "#d9a077",
  shirt: "#2563eb",
  shirtShade: "#1a46b3",
  eyes: "#1d2130",
  mouth: "#c4655a",
};

const AVATAR_ROWS = [
  "................",
  ".....HHHHHH.....",
  "....HHHHHHHH....",
  "...HHHHHHHHHH...",
  "...HHSSSSSSHH...",
  "...HSSSSSSSSH...",
  "...HSeSSSSeSH...",
  "...HSSSSSSSSH...",
  "....SSSmmSSS....",
  ".....sSSSSs.....",
  "......ssss......",
  "....TTTssTTT....",
  "...TTTTTTTTTT...",
  "..TTTTtTTtTTTT..",
  ".TTTTTtTTtTTTTT.",
  ".TTTTTtTTtTTTTT.",
];

/** A 16×16 pixel bust with recolorable hair, skin and shirt. */
export function pixelAvatar(colors: Partial<PixelAvatarColors> = {}): PixelArtData {
  const c = { ...DEFAULT_AVATAR_COLORS, ...colors };
  return icon(AVATAR_ROWS, { H: c.hair, S: c.skin, s: c.skinShade, T: c.shirt, t: c.shirtShade, e: c.eyes, m: c.mouth });
}

/**
 * One SVG path per color, merging horizontal runs of pixels, so a 16×16 icon is a handful of
 * nodes rather than hundreds of rects. Characters without a color are skipped.
 */
export function pixelArtPaths(art: PixelArtData, overrides: Readonly<Record<string, string>> = {}): { color: string; d: string }[] {
  const byColor = new Map<string, string[]>();
  art.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const color = overrides[ch] ?? art.colors[ch];
      if (ch !== "." && color) {
        const list = byColor.get(color) ?? [];
        list.push(`M${x} ${y}h${end - x}v1h${x - end}z`);
        byColor.set(color, list);
      }
      x = end;
    }
  });
  return [...byColor].map(([color, parts]) => ({ color, d: parts.join("") }));
}

/** The art as a standalone SVG string (for scripts and data URIs). */
export function pixelArtSvg(art: PixelArtData, scale = 1, overrides?: Readonly<Record<string, string>>): string {
  const paths = pixelArtPaths(art, overrides)
    .map((p) => `<path fill="${p.color}" d="${p.d}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${art.width * scale}" height="${art.height * scale}" viewBox="0 0 ${art.width} ${art.height}" shape-rendering="crispEdges">${paths}</svg>`;
}
