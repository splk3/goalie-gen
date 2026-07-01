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
