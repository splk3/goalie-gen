import { inferCalendarEventType, mergeCalendarEvents, parseCalendarFeed } from "../calendarImport";

describe("inferCalendarEventType", () => {
  it("applies the ordered classification rules case-insensitively", () => {
    expect(inferCalendarEventType("Game Film Review", "")).toBe("Video Review");
    expect(inferCalendarEventType("Tournament Showcase", "")).toBe("Game");
    expect(inferCalendarEventType("Team Practice", "")).toBe("On-ice Practice");
    expect(inferCalendarEventType("Goalie video", "")).toBe("Video Review");
    expect(inferCalendarEventType("Mid-season evals", "")).toBe("Evaluation");
    expect(inferCalendarEventType("Dry-land workout", "")).toBe("Off-ice Practice");
    expect(inferCalendarEventType("Team meeting", "")).toBe("TBD");
  });

  it("includes descriptions in classification", () => {
    expect(inferCalendarEventType("Team session", "Off ice conditioning")).toBe("Off-ice Practice");
  });
});

describe("parseCalendarFeed", () => {
  it("parses timed and recurring events within the selected range", () => {
    const result = parseCalendarFeed(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "UID:practice-1",
        "DTSTART;TZID=America/New_York:20260713T180000",
        "DTEND;TZID=America/New_York:20260713T190000",
        "RRULE:FREQ=WEEKLY;COUNT=3",
        "SUMMARY:Team Practice",
        "DESCRIPTION:Goalie work",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
      { startDate: "2026-07-01", endDate: "2026-07-31" }
    );

    expect(result.skippedEvents).toBe(0);
    expect(result.events).toHaveLength(3);
    expect(result.events[0]).toMatchObject({
      date: "2026-07-13",
      eventType: "On-ice Practice",
      title: "Team Practice",
      description: "Goalie work",
      source: "calendar",
    });
  });

  it("supports all-day events and excludes events outside the range", () => {
    const result = parseCalendarFeed(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "UID:game-1",
        "DTSTART;VALUE=DATE:20260801",
        "SUMMARY:Game",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
      { startDate: "2026-07-01", endDate: "2026-07-31" }
    );

    expect(result.events).toHaveLength(0);
  });
});

describe("mergeCalendarEvents", () => {
  it("adds imported events without duplicating existing identities", () => {
    const event = {
      id: "same-event",
      date: "2026-07-13",
      eventType: "Game" as const,
      title: "Game",
      description: "",
      source: "calendar" as const,
    };
    const result = mergeCalendarEvents(
      [{ date: "2026-07-13", eventTypes: ["Game"], events: [event] }],
      [event]
    );

    expect(result).toHaveLength(1);
    expect(result[0].eventTypes).toEqual(["Game"]);
    expect(result[0].events).toHaveLength(1);
  });
});
