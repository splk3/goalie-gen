import {
  extractPaletteHexColorsFromDataUrl,
  hexToHsv,
  hsvToHex,
  isValidHexRgbColor,
  normalizeHexRgbColor,
} from "../teamColors";
import { getPalette } from "colorthief";

jest.mock("colorthief", () => ({
  getPalette: jest.fn(),
}));

const mockedGetPalette = jest.mocked(getPalette);
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
    mockedGetPalette.mockReset();
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
    mockedGetPalette.mockResolvedValue([
      { hex: () => "#112233" },
      { hex: () => "#445566" },
      { hex: () => "#112233" },
    ] as never);

    const result = await extractPaletteHexColorsFromDataUrl("data:image/png;base64,abc");

    expect(result).toEqual(["#112233", "#445566"]);
    expect(mockedGetPalette).toHaveBeenCalledTimes(1);
    expect(mockedGetPalette).toHaveBeenCalledWith(expect.any(Object), {
      colorCount: 6,
      quality: 1,
    });
  });

  it("converts hex to HSV for primary colors", () => {
    expect(hexToHsv("#FF0000")).toEqual({ h: 0, s: 100, v: 100 });
    expect(hexToHsv("#00FF00")).toEqual({ h: 120, s: 100, v: 100 });
    expect(hexToHsv("#0000FF")).toEqual({ h: 240, s: 100, v: 100 });
  });

  it("converts hex to HSV for black and white", () => {
    expect(hexToHsv("#000000")).toEqual({ h: 0, s: 0, v: 0 });
    expect(hexToHsv("#FFFFFF")).toEqual({ h: 0, s: 0, v: 100 });
  });

  it("converts hex to HSV for gray", () => {
    const gray = hexToHsv("#808080");
    expect(gray.s).toBe(0);
    expect(gray.v).toBe(50);
  });

  it("converts HSV to hex for primary colors", () => {
    expect(hsvToHex({ h: 0, s: 100, v: 100 })).toBe("#FF0000");
    expect(hsvToHex({ h: 120, s: 100, v: 100 })).toBe("#00FF00");
    expect(hsvToHex({ h: 240, s: 100, v: 100 })).toBe("#0000FF");
  });

  it("converts HSV to hex for black and white", () => {
    expect(hsvToHex({ h: 0, s: 0, v: 0 })).toBe("#000000");
    expect(hsvToHex({ h: 0, s: 0, v: 100 })).toBe("#FFFFFF");
  });

  it("round-trips the default team colors through HSV within ±1 per channel", () => {
    /** Assert that each RGB channel of the round-tripped hex is within ±1 of the original. */
    const expectCloseHex = (input: string) => {
      const result = hsvToHex(hexToHsv(input));
      for (let i = 1; i < 7; i += 2) {
        const expected = parseInt(input.slice(i, i + 2), 16);
        const actual = parseInt(result.slice(i, i + 2), 16);
        expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
      }
    };
    // DEFAULT_PRIMARY_TEAM_COLOR = #00205B
    expectCloseHex("#00205B");
    // DEFAULT_SECONDARY_TEAM_COLOR = #AF272F
    expectCloseHex("#AF272F");
  });
});
