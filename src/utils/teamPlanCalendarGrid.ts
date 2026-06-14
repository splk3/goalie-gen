export interface CalendarDateSelection {
  date: string;
  eventTypes: string[];
}

export interface MonthCalendarCell {
  dayOfMonth: number | null;
  eventTypes: string[];
  hasEvents: boolean;
}

export interface MonthCalendarGrid {
  monthKey: string;
  monthLabel: string;
  weeks: MonthCalendarCell[][];
}

function parseDateKeyUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildEventCalendarMonths(
  eventDateSelections: CalendarDateSelection[]
): MonthCalendarGrid[] {
  const monthEventMap = new Map<string, Map<string, string[]>>();

  for (const selection of eventDateSelections) {
    const monthKey = selection.date.slice(0, 7);
    const byDate = monthEventMap.get(monthKey) ?? new Map<string, string[]>();
    const existingEventTypes = byDate.get(selection.date) ?? [];
    const mergedTypes: string[] = [...existingEventTypes];
    for (const eventType of selection.eventTypes) {
      if (!mergedTypes.includes(eventType)) {
        mergedTypes.push(eventType);
      }
    }
    byDate.set(selection.date, mergedTypes);
    monthEventMap.set(monthKey, byDate);
  }

  return Array.from(monthEventMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, byDate]) => {
      const monthStart = parseDateKeyUtc(`${monthKey}-01`);
      const firstWeekday = monthStart.getUTCDay();
      const daysInMonth = new Date(
        Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)
      ).getUTCDate();

      const weeks: MonthCalendarCell[][] = [];
      let currentWeek: MonthCalendarCell[] = [];

      for (let i = 0; i < firstWeekday; i += 1) {
        currentWeek.push({ dayOfMonth: null, eventTypes: [], hasEvents: false });
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const dateKey = `${monthKey}-${`${day}`.padStart(2, "0")}`;
        const eventTypes = byDate.get(dateKey) ?? [];
        currentWeek.push({
          dayOfMonth: day,
          eventTypes,
          hasEvents: eventTypes.length > 0,
        });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push({ dayOfMonth: null, eventTypes: [], hasEvents: false });
        }
        weeks.push(currentWeek);
      }

      return {
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        weeks,
      };
    });
}
