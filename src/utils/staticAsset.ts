const DEFAULT_ASSET_REVISION = "1";
const DEFAULT_DRILL_EXPORT_IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_DRILL_EXPORT_PDF_CACHE_TTL_MS = 2 * 60 * 1000;
const DEFAULT_OBJECT_URL_REVOKE_DELAY_MS = 60 * 1000;

const readPositiveNumberEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const staticAssetRevision =
  process.env.GATSBY_ASSET_CACHE_BUST?.trim() ||
  process.env.GATSBY_BUILD_ID?.trim() ||
  DEFAULT_ASSET_REVISION;

export const DRILL_EXPORT_IMAGE_CACHE_TTL_MS = readPositiveNumberEnv(
  process.env.GATSBY_DRILL_IMAGE_CACHE_TTL_MS,
  DEFAULT_DRILL_EXPORT_IMAGE_CACHE_TTL_MS
);

export const DRILL_EXPORT_PDF_CACHE_TTL_MS = readPositiveNumberEnv(
  process.env.GATSBY_DRILL_PDF_CACHE_TTL_MS,
  DEFAULT_DRILL_EXPORT_PDF_CACHE_TTL_MS
);

export const OBJECT_URL_REVOKE_DELAY_MS = readPositiveNumberEnv(
  process.env.GATSBY_OBJECT_URL_REVOKE_DELAY_MS,
  DEFAULT_OBJECT_URL_REVOKE_DELAY_MS
);

export const buildCacheBustedAssetPath = (assetPath: string): string => {
  if (!assetPath || !assetPath.startsWith("/")) {
    return assetPath;
  }

  const separator = assetPath.includes("?") ? "&" : "?";
  return `${assetPath}${separator}v=${encodeURIComponent(staticAssetRevision)}`;
};
