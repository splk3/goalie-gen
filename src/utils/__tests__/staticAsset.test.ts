describe("staticAsset", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("appends cache-bust query for absolute asset paths", async () => {
    process.env.GATSBY_ASSET_CACHE_BUST = "build-42";
    const { buildCacheBustedAssetPath } = await import("../staticAsset");

    expect(buildCacheBustedAssetPath("/images/logo.png")).toBe("/images/logo.png?v=build-42");
    expect(buildCacheBustedAssetPath("/images/logo.png?size=small")).toBe(
      "/images/logo.png?size=small&v=build-42"
    );
  });

  it("returns unchanged value for non-absolute paths", async () => {
    const { buildCacheBustedAssetPath } = await import("../staticAsset");

    expect(buildCacheBustedAssetPath("images/logo.png")).toBe("images/logo.png");
    expect(buildCacheBustedAssetPath("")).toBe("");
  });

  it("uses defaults for invalid ttl env values", async () => {
    process.env.GATSBY_DRILL_IMAGE_CACHE_TTL_MS = "invalid";
    process.env.GATSBY_DRILL_PDF_CACHE_TTL_MS = "0";
    process.env.GATSBY_OBJECT_URL_REVOKE_DELAY_MS = "-1";

    const {
      DRILL_EXPORT_IMAGE_CACHE_TTL_MS,
      DRILL_EXPORT_PDF_CACHE_TTL_MS,
      OBJECT_URL_REVOKE_DELAY_MS,
    } = await import("../staticAsset");

    expect(DRILL_EXPORT_IMAGE_CACHE_TTL_MS).toBe(300000);
    expect(DRILL_EXPORT_PDF_CACHE_TTL_MS).toBe(120000);
    expect(OBJECT_URL_REVOKE_DELAY_MS).toBe(60000);
  });
});
