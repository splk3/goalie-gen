import {
  extractPaletteHexColorsFromDataUrl,
  isValidHexRgbColor,
  normalizeHexRgbColor,
} from "../teamColors";
import { getPaletteSync } from "colorthief";

jest.mock("colorthief", () => ({
  getPaletteSync: jest.fn(),
}));

const mockedGetPaletteSync = jest.mocked(getPaletteSync);
const OriginalImage = global.Image;

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    setTimeout(() => {
      this.onload?.();
    }, 0);
  }
}

describe("teamColors", () => {
  beforeAll(() => {
    global.Image = MockImage as unknown as typeof Image;
  });

  afterAll(() => {
    global.Image = OriginalImage;
  });

  beforeEach(() => {
    mockedGetPaletteSync.mockReset();
  });

  it("normalizes valid hex values and rejects unsupported formats", () => {
    expect(normalizeHexRgbColor("#abc123")).toBe("#ABC123");
    expect(normalizeHexRgbColor("ABC123")).toBe("#ABC123");
    expect(normalizeHexRgbColor("#abc")).toBeNull();
    expect(normalizeHexRgbColor("rgb(1,2,3)")).toBeNull();
  });

  it("validates strict #RRGGBB format", () => {
    expect(isValidHexRgbColor("#00205B")).toBe(true);
    expect(isValidHexRgbColor("#af272f")).toBe(true);
    expect(isValidHexRgbColor("AF272F")).toBe(false);
    expect(isValidHexRgbColor("#FFF")).toBe(false);
  });

  it("extracts a normalized unique palette from colorthief", async () => {
    mockedGetPaletteSync.mockReturnValue([
      { hex: () => "#112233" },
      { hex: () => "#445566" },
      { hex: () => "#112233" },
    ] as never);

    const result = await extractPaletteHexColorsFromDataUrl("data:image/png;base64,abc");

    expect(result).toEqual(["#112233", "#445566"]);
    expect(mockedGetPaletteSync).toHaveBeenCalledTimes(1);
  });
});
