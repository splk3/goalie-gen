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

    trackEvent("generate_plan", { type: "club", team_name: "Metro Club" });

    expect(mockGtag).toHaveBeenCalledWith("event", "generate_plan", {
      type: "club",
      team_name: "Metro Club",
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
