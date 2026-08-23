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

    trackEvent("generate_team_plan", { team_name: "Eagles", team_name_provided: true });

    expect(mockGtag).toHaveBeenCalledWith("event", "generate_team_plan", {
      team_name: "Eagles",
      team_name_provided: true,
    });
  });

  it("supports club plan generation analytics payload", () => {
    const mockGtag = jest.fn();
    (window as { gtag?: unknown }).gtag = mockGtag;

    trackEvent("generate_club_plan", { club_name: "Metro Club", club_name_provided: true });

    expect(mockGtag).toHaveBeenCalledWith("event", "generate_club_plan", {
      club_name: "Metro Club",
      club_name_provided: true,
    });

    it("supports separate download events for team plan, club plan, and goalie journal", () => {
      const mockGtag = jest.fn();
      (window as { gtag?: unknown }).gtag = mockGtag;

      trackEvent("download_team_plan", { format: "docx", team_name: "Eagles", team_name_provided: true });
      trackEvent("download_club_plan", {
        format: "docx",
        club_name: "Metro Club",
        club_name_provided: true,
      });
      trackEvent("download_goalie_journal", {
        format: "pdf",
        team_name: "Falcons",
        team_name_provided: true,
        season_provided: true,
      });

      expect(mockGtag).toHaveBeenNthCalledWith(1, "event", "download_team_plan", {
        format: "docx",
        team_name: "Eagles",
        team_name_provided: true,
      });
      expect(mockGtag).toHaveBeenNthCalledWith(2, "event", "download_club_plan", {
        format: "docx",
        club_name: "Metro Club",
        club_name_provided: true,
      });
      expect(mockGtag).toHaveBeenNthCalledWith(3, "event", "download_goalie_journal", {
        format: "pdf",
        team_name: "Falcons",
        team_name_provided: true,
        season_provided: true,
      });
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

    trackEvent("generate_goalie_journal", {
      team_name: "Falcons",
      goalie_name: "Do Not Track",
    } as unknown as { format?: string; team_name?: string; team_name_provided?: boolean });

    expect(mockGtag).toHaveBeenCalledWith("event", "generate_goalie_journal", {
      team_name: "Falcons",
    });
  });

  it("does not throw when window.gtag is not available", () => {
    expect(() => {
      trackEvent("generate_team_plan", { team_name_provided: false });
    }).not.toThrow();
  });

  it("logs to console in development mode when gtag is not available", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    trackEvent("generate_goalie_journal", { team_name: "Falcons", team_name_provided: true });

    expect(consoleSpy).toHaveBeenCalledWith("[Analytics] Event: generate_goalie_journal", {
      team_name: "Falcons",
      team_name_provided: true,
    });
    consoleSpy.mockRestore();
  });

  it("does not log to console in production mode when gtag is not available", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      writable: true,
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    trackEvent("generate_team_plan", { team_name: "Falcons", team_name_provided: true });

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
