import { buildEventCalendarMonths } from "../teamPlanCalendarGrid";

describe("buildEventCalendarMonths", () => {
  it("creates one month grid per month containing events in chronological order", () => {
    const months = buildEventCalendarMonths([
      { date: "2026-06-12", eventTypes: ["Game"] },
      { date: "2026-04-02", eventTypes: ["On-ice Practice"] },
    ]);

    expect(months.map((month) => month.monthKey)).toEqual(["2026-04", "2026-06"]);
  });

  it("positions days by real weekday and pads empty leading cells", () => {
    const months = buildEventCalendarMonths([{ date: "2026-04-02", eventTypes: ["Game"] }]);

    const april = months[0];
    expect(april.monthKey).toBe("2026-04");
    expect(april.weeks[0].slice(0, 3).every((cell) => cell.dayOfMonth === null)).toBe(true);
    expect(april.weeks[0][3].dayOfMonth).toBe(1);
    expect(april.weeks[0][4].dayOfMonth).toBe(2);
  });

  it("retains multiple event types on one date and de-duplicates repeated labels", () => {
    const months = buildEventCalendarMonths([
      { date: "2026-05-10", eventTypes: ["On-ice Practice", "Game"] },
      { date: "2026-05-10", eventTypes: ["Game", "Evaluation"] },
    ]);

    const may = months[0];
    const may10Cell = may.weeks.flat().find((cell) => cell.dayOfMonth === 10);

    expect(may10Cell).toBeDefined();
    expect(may10Cell?.hasEvents).toBe(true);
    expect(may10Cell?.eventTypes).toEqual(["On-ice Practice", "Game", "Evaluation"]);
  });

  it("pads trailing cells to a 7-day week with no-event placeholders", () => {
    const months = buildEventCalendarMonths([{ date: "2026-04-30", eventTypes: ["Game"] }]);
    const april = months[0];
    const lastWeek = april.weeks[april.weeks.length - 1];

    expect(lastWeek).toHaveLength(7);
    expect(lastWeek[5]).toMatchObject({
      dayOfMonth: null,
      hasEvents: false,
      eventTypes: [],
    });
    expect(lastWeek[6]).toMatchObject({
      dayOfMonth: null,
      hasEvents: false,
      eventTypes: [],
    });
  });
});
