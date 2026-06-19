import { getSvgIntrinsicSize, isSvgImageFile } from "../svgRasterize";

describe("svgRasterize", () => {
  describe("isSvgImageFile", () => {
    it("detects SVG by mime type", () => {
      expect(isSvgImageFile({ type: "image/svg+xml", name: "logo" } as File)).toBe(true);
      expect(isSvgImageFile({ type: "image/svg", name: "logo" } as File)).toBe(true);
    });

    it("detects SVG by extension when mime is missing or generic", () => {
      expect(isSvgImageFile({ type: "application/octet-stream", name: "crest.SVG" } as File)).toBe(
        true
      );
      expect(isSvgImageFile({ type: "", name: "crest.svg" } as File)).toBe(true);
    });

    it("returns false for non-SVG images", () => {
      expect(isSvgImageFile({ type: "image/png", name: "logo.png" } as File)).toBe(false);
    });
  });

  describe("getSvgIntrinsicSize", () => {
    it("uses width and height attributes when both are present", () => {
      const result = getSvgIntrinsicSize('<svg width="640" height="320"></svg>');
      expect(result).toEqual({ width: 640, height: 320 });
    });

    it("falls back to viewBox dimensions when width/height are missing", () => {
      const result = getSvgIntrinsicSize('<svg viewBox="0 0 1200 600"></svg>');
      expect(result).toEqual({ width: 1200, height: 600 });
    });

    it("falls back to a safe default square size when dimensions are unavailable", () => {
      const result = getSvgIntrinsicSize('<svg><rect width="10" height="10" /></svg>');
      expect(result).toEqual({ width: 1024, height: 1024 });
    });
  });
});
