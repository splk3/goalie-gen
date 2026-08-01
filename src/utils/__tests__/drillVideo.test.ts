import { isValidDrillVideoUrl } from "../drillVideo";

describe("isValidDrillVideoUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=abc-123_X",
    "https://youtube.com/watch?v=abc123&t=10",
    "https://youtu.be/abc-123_X?si=value",
    "https://vimeo.com/123456789",
    "https://www.vimeo.com/123456789?share=copy",
  ])("accepts supported HTTPS video URL %s", (url) => {
    expect(isValidDrillVideoUrl(url)).toBe(true);
  });

  it.each([
    "http://www.youtube.com/watch?v=abc123",
    "https://www.youtube.com/watch?t=10&v=abc123",
    "https://www.youtube.com/embed/abc123",
    "https://youtu.be/",
    "https://vimeo.com/not-numeric",
    "https://player.vimeo.com/video/123456789",
    "https://example.com/video",
    "",
    123,
  ])("rejects unsupported video URL %s", (url) => {
    expect(isValidDrillVideoUrl(url)).toBe(false);
  });
});
