import ICAL from "ical.js";
import type { EventDateSelection, EventSelection, EventType } from "../types/generatorConfig";

export interface CalendarImportRange {
  startDate: string;
  endDate: string;
}

export interface CalendarImportResult {
  events: EventSelection[];
  skippedEvents: number;
}

export class CalendarImportError extends Error {
  readonly canDownloadFeed: boolean;

  constructor(message: string, canDownloadFeed = false) {
    super(message);
    this.name = "CalendarImportError";
    this.canDownloadFeed = canDownloadFeed;
  }
}

interface ClassificationRule {
  eventType: Exclude<EventType, "TBD">;
  matches: (text: string) => boolean;
}

export const CALENDAR_EVENT_CLASSIFICATION_RULES: readonly ClassificationRule[] = [
  {
    eventType: "Video Review",
    matches: (text) => /\bgame\b/.test(text) && /\b(film|video)\b/.test(text),
  },
  {
    eventType: "Game",
    matches: (text) => /\b(game|vs|showcase|show\s*case|tourney|tournament)\b/.test(text),
  },
  {
    eventType: "Off-ice Practice",
    matches: (text) => /\b(off[\s-]?ice|dry[\s-]?land)\b/.test(text),
  },
  {
    eventType: "On-ice Practice",
    matches: (text) => /\bpractice\b/.test(text),
  },
  {
    eventType: "Video Review",
    matches: (text) => /\b(review|video|film)\b/.test(text),
  },
  {
    eventType: "Evaluation",
    matches: (text) => /\b(evaluation|evals?|eval)\b/.test(text),
  },
];

export function inferCalendarEventType(title: string, description: string): EventType {
  const text = `${title} ${description}`.toLocaleLowerCase();
  return CALENDAR_EVENT_CLASSIFICATION_RULES.find((rule) => rule.matches(text))?.eventType ?? "TBD";
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

interface LocalizedEventTime {
  date: string;
  startTime?: string;
  timeZone?: string;
}

function dateKeyFromFields(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateKeyFromTime(time: ICAL.Time): string {
  return dateKeyFromFields(time.year, time.month, time.day);
}

function formatStartTime(hour: number, minute: number): string | undefined {
  if (hour === 0 && minute === 0) {
    return undefined;
  }
  const displayHour = hour % 12 || 12;
  const period = hour >= 12 ? "PM" : "AM";
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatPartsInTimeZone(date: Date, timeZone: string): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZoneName: "short",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  );
}

function timezoneOffsetMilliseconds(date: Date, timeZone: string): number {
  const parts = formatPartsInTimeZone(date, timeZone);
  const localWallTime = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute)
  );
  return localWallTime - date.getTime();
}

function dateForTimeZone(time: ICAL.Time, timeZone: string): Date {
  const wallTime = Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute, time.second);
  let instant = new Date(wallTime - timezoneOffsetMilliseconds(new Date(wallTime), timeZone));
  instant = new Date(wallTime - timezoneOffsetMilliseconds(instant, timeZone));
  return instant;
}

function localizedEventTime(time: ICAL.Time, timeZone: string | undefined): LocalizedEventTime {
  if (time.isDate) {
    return { date: dateKeyFromTime(time) };
  }

  if (!timeZone || timeZone === "floating") {
    return {
      date: dateKeyFromTime(time),
      startTime: formatStartTime(time.hour, time.minute),
    };
  }

  if (timeZone === "UTC") {
    return {
      date: dateKeyFromTime(time),
      startTime: formatStartTime(time.hour, time.minute),
      timeZone: "UTC",
    };
  }

  try {
    const localizedDate = dateForTimeZone(time, timeZone);
    const parts = formatPartsInTimeZone(localizedDate, timeZone);
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      startTime: formatStartTime(Number(parts.hour), Number(parts.minute)),
      timeZone: parts.timeZoneName,
    };
  } catch (error) {
    if (!(error instanceof RangeError)) {
      throw error;
    }
    return {
      date: dateKeyFromTime(time),
      startTime: formatStartTime(time.hour, time.minute),
      timeZone,
    };
  }
}

function eventTimeZone(event: ICAL.Event): string | undefined {
  const timeZone = event.startDate.zone?.tzid;
  if (timeZone && timeZone !== "floating") {
    return timeZone;
  }
  const parameter = event.component.getFirstProperty("dtstart")?.getParameter("tzid");
  return typeof parameter === "string" ? parameter : timeZone;
}

function isWithinRange(date: string, range: CalendarImportRange): boolean {
  return date >= range.startDate && date <= range.endDate;
}

function validateRange(range: CalendarImportRange): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(range.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(range.endDate)) {
    throw new CalendarImportError("Choose valid start and end dates for calendar import.");
  }
  if (parseDateKey(range.startDate) > parseDateKey(range.endDate)) {
    throw new CalendarImportError(
      "The calendar import start date must be on or before the end date."
    );
  }
}

function eventId(
  uid: string,
  date: string,
  title: string,
  description: string,
  startTime = ""
): string {
  return `${uid}|${date}|${startTime.trim()}|${title.trim()}|${description.trim()}`;
}

function getComponents(calendar: ICAL.Component): ICAL.Component[] {
  return calendar.getAllSubcomponents("vevent");
}

function normalizeCalendarLineEndings(icsText: string): string {
  return icsText.replace(/\r\n?|\n/g, "\r\n");
}

export function parseCalendarFeed(
  icsText: string,
  range: CalendarImportRange
): CalendarImportResult {
  validateRange(range);
  if (!icsText.trim()) {
    throw new CalendarImportError("The calendar feed is empty.");
  }

  let calendar: ICAL.Component;
  try {
    calendar = ICAL.Component.fromString(normalizeCalendarLineEndings(icsText));
  } catch {
    throw new CalendarImportError("The calendar data could not be parsed as an iCalendar feed.");
  }

  const events: EventSelection[] = [];
  let skippedEvents = 0;

  for (const component of getComponents(calendar)) {
    try {
      const event = new ICAL.Event(component);
      if (!event.startDate) {
        skippedEvents += 1;
        continue;
      }

      const timeZone = eventTimeZone(event);
      const occurrences: ICAL.Time[] = [];
      if (event.isRecurring()) {
        const iterator = event.iterator();
        let occurrence: ICAL.Time | null;
        while ((occurrence = iterator.next())) {
          const date = localizedEventTime(occurrence, timeZone).date;
          if (date > range.endDate) {
            break;
          }
          if (date >= range.startDate) {
            occurrences.push(occurrence);
          }
        }
      } else {
        occurrences.push(event.startDate);
      }

      for (const occurrence of occurrences) {
        const localizedTime = localizedEventTime(occurrence, timeZone);
        const occurrenceDate = localizedTime.date;
        if (!isWithinRange(occurrenceDate, range)) {
          continue;
        }
        const details = event.getOccurrenceDetails(occurrence);
        const title = details.item.summary?.trim() ?? "";
        const description = details.item.description?.trim() ?? "";
        events.push({
          id: eventId(
            event.uid || "calendar-event",
            occurrenceDate,
            title,
            description,
            localizedTime.startTime
          ),
          date: occurrenceDate,
          eventType: inferCalendarEventType(title, description),
          title,
          description,
          startTime: localizedTime.startTime,
          timeZone: localizedTime.timeZone,
          source: "calendar",
        });
      }
    } catch {
      skippedEvents += 1;
    }
  }

  return { events: deduplicateCalendarEvents(events), skippedEvents };
}

function deduplicateCalendarEvents(events: EventSelection[]): EventSelection[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key =
      event.id ??
      eventId("", event.date, event.title ?? "", event.description ?? "", event.startTime ?? "");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function fetchCalendarFeed(url: string): Promise<string> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new CalendarImportError("Paste a calendar feed URL first.");
  }

  let response: Response;
  try {
    response = await fetch(trimmedUrl);
  } catch {
    throw new CalendarImportError(
      "This calendar feed could not be fetched in the browser. The provider may block cross-site requests (CORS). Download the feed and upload the .ics file instead.",
      true
    );
  }
  if (!response.ok) {
    throw new CalendarImportError(
      `The calendar feed returned HTTP ${response.status}. Download the feed and upload the .ics file instead.`,
      true
    );
  }
  return response.text();
}

export function mergeCalendarEvents(
  existing: EventDateSelection[],
  importedEvents: EventSelection[]
): EventDateSelection[] {
  const merged = new Map<string, EventDateSelection>();
  for (const selection of existing) {
    merged.set(selection.date, {
      ...selection,
      eventTypes: [...selection.eventTypes],
      events: selection.events ? [...selection.events] : [],
    });
  }

  const existingIds = new Set(
    Array.from(merged.values())
      .flatMap((selection) => selection.events ?? [])
      .map((event) => event.id)
      .filter((id): id is string => Boolean(id))
  );

  for (const event of importedEvents) {
    if (event.id && existingIds.has(event.id)) {
      continue;
    }
    const selection = merged.get(event.date) ?? { date: event.date, eventTypes: [], events: [] };
    selection.eventTypes.push(event.eventType);
    selection.events?.push(event);
    merged.set(event.date, selection);
    if (event.id) {
      existingIds.add(event.id);
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
}
