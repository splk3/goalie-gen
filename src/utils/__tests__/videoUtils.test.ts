import {
  getYouTubeVideoId,
  getVimeoVideoId,
  getEmbedUrl,
  getVideoThumbnail,
  getVideoThumbnailUrl,
} from "../videoUtils";

describe("getYouTubeVideoId", () => {
  it("extracts video ID from a standard YouTube watch URL", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts video ID from a YouTube short URL (youtu.be)", () => {
    expect(getYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts video ID and ignores extra query parameters", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("returns empty string for a non-YouTube URL", () => {
    expect(getYouTubeVideoId("https://vimeo.com/123456789")).toBe("");
  });

  it("returns empty string for an empty string input", () => {
    expect(getYouTubeVideoId("")).toBe("");
  });
});

describe("getVimeoVideoId", () => {
  it("extracts video ID from a Vimeo URL", () => {
    expect(getVimeoVideoId("https://vimeo.com/123456789")).toBe("123456789");
  });

  it("returns empty string for a non-Vimeo URL", () => {
    expect(getVimeoVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("");
  });

  it("returns empty string for an empty string input", () => {
    expect(getVimeoVideoId("")).toBe("");
  });
});

describe("getEmbedUrl", () => {
  it("returns a YouTube embed URL for a YouTube watch URL", () => {
    expect(getEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("returns a YouTube embed URL for a youtu.be short URL", () => {
    expect(getEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("returns a Vimeo player URL for a Vimeo URL", () => {
    expect(getEmbedUrl("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789"
    );
  });

  it("returns empty string for an unrecognised URL", () => {
    expect(getEmbedUrl("https://example.com/video")).toBe("");
  });
});

describe("getVideoThumbnail", () => {
  it("returns a YouTube thumbnail URL for a YouTube watch URL", () => {
    expect(getVideoThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
    );
  });

  it("returns empty string for a Vimeo URL (no static thumbnail available)", () => {
    expect(getVideoThumbnail("https://vimeo.com/123456789")).toBe("");
  });

  it("returns empty string for an unrecognised URL", () => {
    expect(getVideoThumbnail("https://example.com/video")).toBe("");
  });
});

describe("getVideoThumbnailUrl", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns a YouTube thumbnail immediately for a YouTube URL", async () => {
    const url = await getVideoThumbnailUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(url).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches and returns a Vimeo thumbnail for a Vimeo URL", async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      json: async () => ({ thumbnail_url: "https://i.vimeocdn.com/video/12345_640.jpg" }),
    } as Response);

    const url = await getVideoThumbnailUrl("https://vimeo.com/123456789");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://vimeo.com/api/oembed.json?url=https://vimeo.com/123456789"
    );
    expect(url).toBe("https://i.vimeocdn.com/video/12345_640.jpg");
  });

  it("returns an empty string and logs error if Vimeo fetch fails", async () => {
    const mockError = new Error("Network error");
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(mockError);

    const url = await getVideoThumbnailUrl("https://vimeo.com/123456789");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://vimeo.com/api/oembed.json?url=https://vimeo.com/123456789"
    );
    expect(console.error).toHaveBeenCalledWith("Failed to fetch Vimeo thumbnail URL:", mockError);
    expect(url).toBe("");
  });

  it("returns an empty string when Vimeo API returns no thumbnail_url", async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      json: async () => ({}),
    } as Response);

    const url = await getVideoThumbnailUrl("https://vimeo.com/123456789");
    expect(url).toBe("");
  });

  it("returns an empty string for an unrecognised URL", async () => {
    const url = await getVideoThumbnailUrl("https://example.com/video");
    expect(url).toBe("");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
