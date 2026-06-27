export const DEFAULT_PRIMARY_TEAM_COLOR = "#00205B";
export const DEFAULT_SECONDARY_TEAM_COLOR = "#AF272F";

const HEX_RGB_PATTERN = /^#([0-9A-F]{6})$/;
const RAW_HEX_RGB_PATTERN = /^#?([0-9A-F]{6})$/;

export function normalizeHexRgbColor(input: string): string | null {
  const trimmed = input.trim().toUpperCase();
  const match = RAW_HEX_RGB_PATTERN.exec(trimmed);
  if (!match) {
    return null;
  }
  return `#${match[1]}`;
}

export function isValidHexRgbColor(input: string): boolean {
  return HEX_RGB_PATTERN.test(input.trim().toUpperCase());
}

/** HSV representation with h in [0,360], s in [0,100], v in [0,100]. */
export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

/** Convert a #RRGGBB hex string to HSV. */
export function hexToHsv(hex: string): HsvColor {
  const normalized = normalizeHexRgbColor(hex);
  const h = normalized ?? "#000000";
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      hue = 60 * ((b - r) / delta + 2);
    } else {
      hue = 60 * ((r - g) / delta + 4);
    }
  }
  if (hue < 0) hue += 360;

  const saturation = max === 0 ? 0 : (delta / max) * 100;
  const value = max * 100;

  return {
    h: Math.round(hue),
    s: Math.round(saturation),
    v: Math.round(value),
  };
}

/** Convert HSV (h in [0,360], s in [0,100], v in [0,100]) to uppercase #RRGGBB. */
export function hsvToHex(hsv: HsvColor): string {
  const s = hsv.s / 100;
  const v = hsv.v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((hsv.h / 60) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;
  const hh = hsv.h % 360;
  if (hh < 60) {
    r = c;
    g = x;
  } else if (hh < 120) {
    r = x;
    g = c;
  } else if (hh < 180) {
    g = c;
    b = x;
  } else if (hh < 240) {
    g = x;
    b = c;
  } else if (hh < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image for color extraction"));
    image.src = dataUrl;
  });
}

export async function extractPaletteHexColorsFromDataUrl(
  dataUrl: string,
  colorCount = 6
): Promise<string[]> {
  if (!dataUrl || typeof window === "undefined") {
    return [];
  }

  try {
    const image = await loadImageFromDataUrl(dataUrl);
    const { getPalette } = await import("colorthief");
    const palette = (await getPalette(image, { colorCount, quality: 1 })) ?? [];
    const normalizedPalette = palette
      .map((color) => normalizeHexRgbColor(color.hex()))
      .filter((color): color is string => Boolean(color));
    return [...new Set(normalizedPalette)];
  } catch (error) {
    console.error("Failed to extract colors from logo image", error);
    return [];
  }
}
