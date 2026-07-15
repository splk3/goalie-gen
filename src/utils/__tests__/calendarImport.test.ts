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
      startTime: "6:00 PM",
      timeZone: "EDT",
      eventType: "On-ice Practice",
      title: "Team Practice",
      description: "Goalie work",
      source: "calendar",
    });
  });

  it("omits start time for all-day events", () => {
    const result = parseCalendarFeed(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "UID:all-day-1",
        "DTSTART;VALUE=DATE:20260715",
        "SUMMARY:Team Event",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
      { startDate: "2026-07-01", endDate: "2026-07-31" }
    );

    expect(result.events).toMatchObject([{ date: "2026-07-15", startTime: undefined }]);
  });

  it("omits a midnight start time", () => {
    const result = parseCalendarFeed(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "UID:midnight-1",
        "DTSTART:20260715T000000Z",
        "SUMMARY:Overnight Event",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
      { startDate: "2026-07-01", endDate: "2026-07-31" }
    );

    expect(result.events).toMatchObject([{ date: "2026-07-15", startTime: undefined }]);
  });

  it("keeps UTC event times in UTC", () => {
    const result = parseCalendarFeed(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "UID:utc-1",
        "DTSTART:20260715T180000Z",
        "SUMMARY:Game",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
      { startDate: "2026-07-01", endDate: "2026-07-31" }
    );

    expect(result.events).toMatchObject([
      { date: "2026-07-15", startTime: "6:00 PM", timeZone: "UTC" },
    ]);
  });

  it("uses the event timezone when it changes the local calendar date", () => {
    const result = parseCalendarFeed(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "UID:timezone-boundary-1",
        "DTSTART;TZID=America/Los_Angeles:20260701T003000",
        "SUMMARY:Practice",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
      { startDate: "2026-07-01", endDate: "2026-07-01" }
    );

    expect(result.events).toMatchObject([
      { date: "2026-07-01", startTime: "12:30 AM", timeZone: "PDT" },
    ]);
  });

  it("accepts feeds containing lone carriage-return line endings", () => {
    const result = parseCalendarFeed(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "UID:lone-cr-1",
        "DTSTART:20260715T180000Z",
        "SUMMARY:Team Practice",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r"),
      { startDate: "2026-07-01", endDate: "2026-07-31" }
    );

    expect(result.events).toMatchObject([
      { date: "2026-07-15", startTime: "6:00 PM", title: "Team Practice" },
    ]);
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
