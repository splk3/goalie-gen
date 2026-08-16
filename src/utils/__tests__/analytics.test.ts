import { trackEvent } from "../analytics";

describe("trackEvent", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      writable: true,
    });
    // Remove gtag from window after each test
    delete (window as { gtag?: unknown }).gtag;
  });

  it("calls window.gtag with the event action and params when gtag is available", () => {
    const mockGtag = jest.fn();
    (window as { gtag?: unknown }).gtag = mockGtag;

    trackEvent("generate_plan", { type: "individual", team_name: "Eagles" });

    expect(mockGtag).toHaveBeenCalledWith("event", "generate_plan", {
      type: "individual",
      team_name: "Eagles",
    });
  });

  it("supports club plan generation analytics payload", () => {
    const mockGtag = jest.fn();
    (window as { gtag?: unknown }).gtag = mockGtag;

    trackEvent("generate_plan", { type: "club", club_name: "Metro Club" });

    expect(mockGtag).toHaveBeenCalledWith("event", "generate_plan", {
      type: "club",
      club_name: "Metro Club",
    });
  });

  it("calls window.gtag for download_drill event with required params", () => {
    const mockGtag = jest.fn();
    (window as { gtag?: unknown }).gtag = mockGtag;

    trackEvent("download_drill", {
      drill_name: "Butterfly Slides",
      age_group: "U12",
      skill_level: "Intermediate",
    });

    expect(mockGtag).toHaveBeenCalledWith("event", "download_drill", {
      drill_name: "Butterfly Slides",
      age_group: "U12",
      skill_level: "Intermediate",
    });
  });

  it("calls window.gtag for drill view and share events", () => {
    const mockGtag = jest.fn();
    (window as { gtag?: unknown }).gtag = mockGtag;

    trackEvent("view_drill", {
      drill_name: "Butterfly Slides",
      drill_slug: "butterfly-slides",
      source_page: "drill_page",
    });
    trackEvent("share_drill", {
      drill_name: "Butterfly Slides",
      drill_slug: "butterfly-slides",
      source_page: "drill_page",
      share_method: "clipboard",
    });

    expect(mockGtag).toHaveBeenNthCalledWith(1, "event", "view_drill", {
      drill_name: "Butterfly Slides",
      drill_slug: "butterfly-slides",
      source_page: "drill_page",
    });
    expect(mockGtag).toHaveBeenNthCalledWith(2, "event", "share_drill", {
      drill_name: "Butterfly Slides",
      drill_slug: "butterfly-slides",
      source_page: "drill_page",
      share_method: "clipboard",
    });
  });

  it("strips disallowed player/goalie name keys from payloads", () => {
    const mockGtag = jest.fn();
    (window as { gtag?: unknown }).gtag = mockGtag;

    trackEvent("generate_journal", {
      team_name: "Falcons",
      goalie_name: "Do Not Track",
    } as unknown as { format?: string; team_name?: string });

    expect(mockGtag).toHaveBeenCalledWith("event", "generate_journal", {
      team_name: "Falcons",
    });
  });

  it("does not throw when window.gtag is not available", () => {
    expect(() => {
      trackEvent("generate_plan", { type: "team" });
    }).not.toThrow();
  });

  it("logs to console in development mode when gtag is not available", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    trackEvent("generate_journal", { team_name: "Falcons" });

    expect(consoleSpy).toHaveBeenCalledWith("[Analytics] Event: generate_journal", {
      team_name: "Falcons",
    });
    consoleSpy.mockRestore();
  });

  it("does not log to console in production mode when gtag is not available", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      writable: true,
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    trackEvent("generate_plan", { type: "individual" });

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
