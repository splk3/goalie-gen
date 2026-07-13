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

function dateKeyFromTime(time: ICAL.Time): string {
  return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
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

function eventId(uid: string, date: string, title: string, description: string): string {
  return `${uid}|${date}|${title.trim()}|${description.trim()}`;
}

function getComponents(calendar: ICAL.Component): ICAL.Component[] {
  return calendar.getAllSubcomponents("vevent");
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
    calendar = ICAL.Component.fromString(icsText);
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

      const occurrences: ICAL.Time[] = [];
      if (event.isRecurring()) {
        const iterator = event.iterator();
        let occurrence: ICAL.Time | null;
        while ((occurrence = iterator.next())) {
          const date = dateKeyFromTime(occurrence);
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
        const occurrenceDate = dateKeyFromTime(occurrence);
        if (!isWithinRange(occurrenceDate, range)) {
          continue;
        }
        const details = event.getOccurrenceDetails(occurrence);
        const title = details.item.summary?.trim() ?? "";
        const description = details.item.description?.trim() ?? "";
        events.push({
          id: eventId(event.uid || "calendar-event", occurrenceDate, title, description),
          date: occurrenceDate,
          eventType: inferCalendarEventType(title, description),
          title,
          description,
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
    const key = event.id ?? eventId("", event.date, event.title ?? "", event.description ?? "");
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
