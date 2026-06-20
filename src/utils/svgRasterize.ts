const SVG_LONG_EDGE_TARGET_PX = 2048;
const SVG_DEFAULT_SIZE_PX = 1024;

function parseSvgLength(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractSvgTagAttribute(svgMarkup: string, attributeName: string): string | null {
  const svgTagMatch = svgMarkup.match(/<svg\b[^>]*>/i);
  if (!svgTagMatch) {
    return null;
  }
  const attributeRegex = new RegExp(`${attributeName}\\s*=\\s*"([^"]+)"`, "i");
  const attributeMatch = svgTagMatch[0].match(attributeRegex);
  return attributeMatch?.[1] ?? null;
}

function ensureSvgXmlns(svgMarkup: string): string {
  const svgTagMatch = svgMarkup.match(/<svg\b[^>]*>/i);
  if (!svgTagMatch || /\bxmlns\s*=/.test(svgTagMatch[0])) {
    return svgMarkup;
  }
  return svgMarkup.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
}

async function loadImageFromObjectUrl(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load SVG for rasterization"));
    image.src = objectUrl;
  });
}

export function getSvgIntrinsicSize(svgMarkup: string): { width: number; height: number } {
  const width = parseSvgLength(extractSvgTagAttribute(svgMarkup, "width"));
  const height = parseSvgLength(extractSvgTagAttribute(svgMarkup, "height"));
  if (width && height) {
    return { width, height };
  }

  const viewBox = extractSvgTagAttribute(svgMarkup, "viewBox");
  if (viewBox) {
    const values = viewBox
      .trim()
      .split(/\s+/)
      .map((part) => Number.parseFloat(part))
      .filter((value) => Number.isFinite(value));
    if (values.length === 4 && values[2] > 0 && values[3] > 0) {
      return { width: values[2], height: values[3] };
    }
  }

  return { width: SVG_DEFAULT_SIZE_PX, height: SVG_DEFAULT_SIZE_PX };
}

export function isSvgImageFile(file: Pick<File, "type" | "name">): boolean {
  const mimeType = file.type.trim().toLowerCase();
  if (mimeType === "image/svg+xml" || mimeType === "image/svg") {
    return true;
  }
  return file.name.trim().toLowerCase().endsWith(".svg");
}

export async function rasterizeSvgMarkupToPngDataUrl(
  svgMarkup: string,
  targetLongEdge = SVG_LONG_EDGE_TARGET_PX
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("SVG rasterization is only available in a browser environment");
  }

  const normalizedSvgMarkup = ensureSvgXmlns(svgMarkup);
  const { width: sourceWidth, height: sourceHeight } = getSvgIntrinsicSize(normalizedSvgMarkup);
  const longEdge = Math.max(sourceWidth, sourceHeight);
  const scale = targetLongEdge / longEdge;
  const outputWidth = Math.max(1, Math.round(sourceWidth * scale));
  const outputHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to initialize canvas context for SVG rasterization");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const svgBlob = new Blob([normalizedSvgMarkup], { type: "image/svg+xml" });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    context.drawImage(image, 0, 0, outputWidth, outputHeight);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function rasterizeSvgFileToPngDataUrl(
  file: File,
  targetLongEdge = SVG_LONG_EDGE_TARGET_PX
): Promise<string> {
  const svgMarkup = await file.text();
  return rasterizeSvgMarkupToPngDataUrl(svgMarkup, targetLongEdge);
}
