export type DocxImageType = "jpg" | "png" | "gif" | "bmp";

const normalizeMimeType = (mimeType: string): string => mimeType.trim().toLowerCase();

export const toDocxImageTypeFromMime = (mimeType?: string | null): DocxImageType => {
  const normalized = normalizeMimeType(mimeType ?? "");
  if (normalized === "image/jpeg" || normalized === "image/jpg") {
    return "jpg";
  }
  if (normalized === "image/gif") {
    return "gif";
  }
  if (normalized === "image/bmp" || normalized === "image/x-ms-bmp") {
    return "bmp";
  }
  return "png";
};

export const toDocxImageTypeFromDataUrl = (dataUrl: string): DocxImageType => {
  const match = dataUrl.match(/^data:(image\/[a-z0-9+.-]+);/i);
  return toDocxImageTypeFromMime(match?.[1]);
};
