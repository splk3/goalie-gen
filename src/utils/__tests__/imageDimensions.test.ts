import { getFittedImageDimensions } from "../imageDimensions";

describe("getFittedImageDimensions", () => {
  let originalImage: typeof global.Image;

  beforeEach(() => {
    // Mock the global Image object
    originalImage = global.Image;
    global.Image = class {
      width = 0;
      height = 0;
      src = "";
      onload: (() => void) | null = null;
      onerror: ((e: Error) => void) | null = null;

      constructor() {
        setTimeout(() => {
          if (this.src === "error") {
            if (this.onerror) this.onerror(new Error("Failed to load"));
          } else {
            if (this.onload) this.onload();
          }
        }, 0);
      }
    } as unknown as typeof global.Image;
  });

  afterEach(() => {
    global.Image = originalImage;
    jest.clearAllMocks();
  });

  it("calculates dimensions for landscape image correctly", async () => {
    const originalImageClass = global.Image;
    global.Image = class extends originalImageClass {
      width = 800;
      height = 400;
    } as unknown as typeof global.Image;

    const result = await getFittedImageDimensions("landscape.png", 400);
    expect(result).toEqual({ width: 400, height: 200 });
  });

  it("calculates dimensions for portrait image correctly", async () => {
    const originalImageClass = global.Image;
    global.Image = class extends originalImageClass {
      width = 400;
      height = 800;
    } as unknown as typeof global.Image;

    const result = await getFittedImageDimensions("portrait.png", 400);
    expect(result).toEqual({ width: 200, height: 400 });
  });

  it("calculates dimensions for square image correctly", async () => {
    const originalImageClass = global.Image;
    global.Image = class extends originalImageClass {
      width = 500;
      height = 500;
    } as unknown as typeof global.Image;

    const result = await getFittedImageDimensions("square.png", 400);
    // ratio is 1, so the else branch applies (ratio <= 1)
    expect(result).toEqual({ width: 400, height: 400 });
  });

  it("handles image load failure gracefully and returns maxDimension fallback", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await getFittedImageDimensions("error", 400);

    expect(result).toEqual({ width: 400, height: 400 });
    expect(consoleSpy).toHaveBeenCalledWith("Failed to parse image dimensions", expect.any(Error));

    consoleSpy.mockRestore();
  });
});
