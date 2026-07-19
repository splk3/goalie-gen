import * as React from "react";
import Logo from "./Logo";
import Modal from "./Modal";
import SliderToggle from "./SliderToggle";
import { trackEvent } from "../utils/analytics";
import ImageUploader from "./ImageUploader";
import TeamColorPickers from "./TeamColorPickers";
import { loadDocxModule } from "../utils/loadExportModules";
import { OBJECT_URL_REVOKE_DELAY_MS } from "../utils/staticAsset";
import { toDocxImageTypeFromMime } from "../utils/docxImageType";
import {
  DEFAULT_PRIMARY_TEAM_COLOR,
  DEFAULT_SECONDARY_TEAM_COLOR,
  extractPaletteHexColorsFromDataUrl,
} from "../utils/teamColors";
import { normalizeUrl } from "../utils/generatorDefaults";
import { buildTeamPlanDocument } from "../utils/builders/teamPlanBuilder";
import {
  fetchCalendarFeed,
  mergeCalendarEvents,
  parseCalendarFeed,
  CalendarImportError,
} from "../utils/calendarImport";
import coverMd from "../content/team-plan/cover.md";
import seasonOverviewMd from "../content/team-plan/season-overview.md";
import eventDetailsMd from "../content/team-plan/event-details.md";

import type {
  AgeGroup,
  ConfigurableEventType,
  EventType,
  EventDateSelection,
  EventSelection,
} from "../types/generatorConfig";

interface GenerateTeamPlanButtonProps {
  variant?: "blue" | "red";
}

interface EventTypeLegendProps {
  label: string;
  helperText: string;
}

const CONFIGURABLE_EVENT_TYPES: ConfigurableEventType[] = [
  "On-ice Practice",
  "Off-ice Practice",
  "Video Review",
  "Evaluation",
  "Game",
];
const DETAILED_ENTRY_EVENT_TYPES: EventType[] = [...CONFIGURABLE_EVENT_TYPES, "TBD"];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function EventTypeLegend({ label, helperText }: EventTypeLegendProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <span
        role="img"
        aria-label={`${label} help`}
        title={helperText}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 text-xs text-gray-600 dark:border-gray-500 dark:text-gray-300"
      >
        i
      </span>
    </span>
  );
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  if (result.getDate() !== date.getDate()) {
    result.setDate(0);
  }
  return result;
}

function reconcileEventTypes(
  eventTypes: EventType[] | undefined,
  availableEventTypeOptions: EventType[],
  fallbackEventType: EventType
): EventType[] {
  if (!eventTypes || eventTypes.length === 0) {
    return [fallbackEventType];
  }
  return eventTypes.map((eventType) =>
    availableEventTypeOptions.includes(eventType) ? eventType : fallbackEventType
  );
}

async function getQrCodePngData(url: string): Promise<Uint8Array | null> {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return null;
  }

  try {
    const qrCode = await import("qrcode");
    const dataURL = await qrCode.toDataURL(normalizedUrl, {
      margin: 1,
      width: 200,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    const base64 = dataURL.split(",")[1];
    if (!base64) {
      return null;
    }
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("Failed to generate QR code", error);
    return null;
  }
}

export default function GenerateTeamPlanButton({ variant = "blue" }: GenerateTeamPlanButtonProps) {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [teamName, setTeamName] = React.useState<string>("");
  const [teamWebsite, setTeamWebsite] = React.useState<string>("");
  const [teamMotto, setTeamMotto] = React.useState<string>("");
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [primaryTeamColor, setPrimaryTeamColor] = React.useState<string>(
    DEFAULT_PRIMARY_TEAM_COLOR
  );
  const [secondaryTeamColor, setSecondaryTeamColor] = React.useState<string>(
    DEFAULT_SECONDARY_TEAM_COLOR
  );
  const [logoPaletteColors, setLogoPaletteColors] = React.useState<string[]>([]);
  const [ageGroup, setAgeGroup] = React.useState<string>("");
  const [addSuggestedDrillEachPractice, setAddSuggestedDrillEachPractice] =
    React.useState<boolean>(true);
  const [hasGoalieMentors, setHasGoalieMentors] = React.useState<boolean>(false);
  const [hasGoalieEvaluations, setHasGoalieEvaluations] = React.useState<boolean>(false);
  const [goalieEvaluationTimes, setGoalieEvaluationTimes] = React.useState<string>("3");
  const [includeStarterIntroductionAndGoals, setIncludeStarterIntroductionAndGoals] =
    React.useState<boolean>(true);
  const [addCalendarOfEvents, setAddCalendarOfEvents] = React.useState<boolean>(false);
  const [includeCalendarView, setIncludeCalendarView] = React.useState<boolean>(true);
  const [includeEventDetails, setIncludeEventDetails] = React.useState<boolean>(true);
  const [calendarEnabledEventTypes, setCalendarEnabledEventTypes] = React.useState<
    Record<ConfigurableEventType, boolean>
  >({
    "On-ice Practice": true,
    "Off-ice Practice": true,
    "Video Review": true,
    Evaluation: true,
    Game: true,
  });
  const [detailedEntryEventTypes, setDetailedEntryEventTypes] = React.useState<
    Record<EventType, boolean>
  >({
    "On-ice Practice": true,
    "Off-ice Practice": true,
    "Video Review": true,
    Evaluation: true,
    Game: true,
    TBD: true,
  });
  const [selectedEventDates, setSelectedEventDates] = React.useState<EventDateSelection[]>([]);
  const [calendarImportStartDate, setCalendarImportStartDate] = React.useState<string>(() =>
    toDateKey(new Date())
  );
  const [calendarImportEndDate, setCalendarImportEndDate] = React.useState<string>(() =>
    toDateKey(addMonths(new Date(), 6))
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState<boolean>(false);
  const [isCalendarImportOpen, setIsCalendarImportOpen] = React.useState<boolean>(false);
  const [calendarFeedUrl, setCalendarFeedUrl] = React.useState<string>("");
  const [isImportingCalendar, setIsImportingCalendar] = React.useState<boolean>(false);
  const [calendarImportStatus, setCalendarImportStatus] = React.useState<string>("");
  const [calendarImportError, setCalendarImportError] = React.useState<string>("");
  const [canDownloadCalendarFeed, setCanDownloadCalendarFeed] = React.useState<boolean>(false);
  const [datePickerMonth, setDatePickerMonth] = React.useState<Date>(getMonthStart(new Date()));
  const [draftSelectedDateKeys, setDraftSelectedDateKeys] = React.useState<string[]>([]);
  const [datePendingDeletion, setDatePendingDeletion] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [validationError, setValidationError] = React.useState<string>("");
  const [generatedBlob, setGeneratedBlob] = React.useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = React.useState<string>("");
  const validationErrorRef = React.useRef<HTMLDivElement>(null);
  const shouldScrollValidationErrorRef = React.useRef<boolean>(false);
  const addEventDatesButtonRef = React.useRef<HTMLButtonElement>(null);
  const addCalendarEventsButtonRef = React.useRef<HTMLButtonElement>(null);
  const calendarFileInputRef = React.useRef<HTMLInputElement>(null);
  const deleteDateTriggerRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (validationError && shouldScrollValidationErrorRef.current) {
      validationErrorRef.current?.scrollIntoView?.({ block: "nearest" });
      shouldScrollValidationErrorRef.current = false;
    }
  }, [validationError]);

  const ageGroups: AgeGroup[] = ["8U", "10U", "12U", "14U", "16U and older"];

  const availableConfigurableEventTypes = React.useMemo(
    () => CONFIGURABLE_EVENT_TYPES.filter((eventType) => calendarEnabledEventTypes[eventType]),
    [calendarEnabledEventTypes]
  );

  const availableEventTypeOptions = React.useMemo<EventType[]>(
    () => [...availableConfigurableEventTypes, "TBD"],
    [availableConfigurableEventTypes]
  );

  const getDefaultEventType = React.useCallback((): EventType => {
    if (calendarEnabledEventTypes["On-ice Practice"]) {
      return "On-ice Practice";
    }
    if (calendarEnabledEventTypes.Game) {
      return "Game";
    }
    if (availableConfigurableEventTypes.length > 0) {
      return [...availableConfigurableEventTypes].sort((a, b) => a.localeCompare(b))[0];
    }
    return "TBD";
  }, [availableConfigurableEventTypes, calendarEnabledEventTypes]);

  const openDatePicker = () => {
    setDraftSelectedDateKeys(selectedEventDates.map((entry) => entry.date));
    setDatePickerMonth(getMonthStart(new Date()));
    setIsDatePickerOpen(true);
  };

  const openCalendarImport = () => {
    setCalendarImportError("");
    setCalendarImportStatus("");
    setCanDownloadCalendarFeed(false);
    setIsCalendarImportOpen(true);
  };

  const closeCalendarImport = React.useCallback(() => {
    if (isImportingCalendar) {
      return;
    }
    setIsCalendarImportOpen(false);
    setCalendarFeedUrl("");
    setCalendarImportError("");
    setCalendarImportStatus("");
    setCanDownloadCalendarFeed(false);
    requestAnimationFrame(() => addCalendarEventsButtonRef.current?.focus());
  }, [isImportingCalendar]);

  const importCalendarText = async (icsText: string) => {
    setCalendarImportError("");
    setCalendarImportStatus("");
    setCanDownloadCalendarFeed(false);
    setIsImportingCalendar(true);
    try {
      const result = parseCalendarFeed(
        icsText,
        {
          startDate: calendarImportStartDate,
          endDate: calendarImportEndDate,
        },
        { expandFiniteEvents: true }
      );
      if (result.effectiveRange) {
        setCalendarImportStartDate(result.effectiveRange.startDate);
        setCalendarImportEndDate(result.effectiveRange.endDate);
      }
      setSelectedEventDates((previous) => mergeCalendarEvents(previous, result.events));
      setCalendarImportStatus(
        `Imported ${result.events.length} event${result.events.length === 1 ? "" : "s"}${
          result.skippedEvents ? `; skipped ${result.skippedEvents}` : ""
        }.`
      );
    } catch (error) {
      setCanDownloadCalendarFeed(error instanceof CalendarImportError && error.canDownloadFeed);
      setCalendarImportError(
        error instanceof CalendarImportError
          ? error.message
          : "The calendar could not be imported. Check the feed and try again."
      );
    } finally {
      setIsImportingCalendar(false);
    }
  };

  const handleCalendarFeedImport = async () => {
    setCalendarImportError("");
    setCalendarImportStatus("");
    setCanDownloadCalendarFeed(false);
    setIsImportingCalendar(true);
    try {
      const icsText = await fetchCalendarFeed(calendarFeedUrl);
      const result = parseCalendarFeed(
        icsText,
        {
          startDate: calendarImportStartDate,
          endDate: calendarImportEndDate,
        },
        { expandFiniteEvents: true }
      );
      if (result.effectiveRange) {
        setCalendarImportStartDate(result.effectiveRange.startDate);
        setCalendarImportEndDate(result.effectiveRange.endDate);
      }
      setSelectedEventDates((previous) => mergeCalendarEvents(previous, result.events));
      setCalendarImportStatus(
        `Imported ${result.events.length} event${result.events.length === 1 ? "" : "s"}${
          result.skippedEvents ? `; skipped ${result.skippedEvents}` : ""
        }.`
      );
    } catch (error) {
      setCanDownloadCalendarFeed(error instanceof CalendarImportError && error.canDownloadFeed);
      setCalendarImportError(
        error instanceof CalendarImportError
          ? error.message
          : "The calendar could not be imported. Check the feed and try again."
      );
    } finally {
      setIsImportingCalendar(false);
    }
  };

  const handleDownloadCalendarFeed = () => {
    setCalendarImportError("");
    const rawUrl = calendarFeedUrl.trim();
    if (!rawUrl) {
      return;
    }

    const normalizedUrl = normalizeUrl(rawUrl);
    if (!normalizedUrl) {
      setCalendarImportError("Enter a valid calendar feed URL.");
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      setCalendarImportError("Enter a valid calendar feed URL.");
      return;
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      setCalendarImportError("Only http(s) calendar feed URLs are allowed.");
      return;
    }

    const safeUrl = parsedUrl.toString();
    const link = document.createElement("a");
    link.href = safeUrl;
    link.download = "calendar-feed.ics";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(() => {
      window.open(safeUrl, "_blank", "noopener,noreferrer");
    }, 0);
  };

  const handleUseDownloadedFeed = () => {
    calendarFileInputRef.current?.click();
  };

  const handleCalendarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    await importCalendarText(await file.text());
  };

  const closeDatePickerWithoutSaving = React.useCallback(() => {
    setIsDatePickerOpen(false);
    setDraftSelectedDateKeys([]);
    requestAnimationFrame(() => {
      addEventDatesButtonRef.current?.focus();
    });
  }, []);

  const openDeleteDateConfirmation = React.useCallback(
    (selectionDate: string, triggerElement: HTMLButtonElement) => {
      deleteDateTriggerRef.current = triggerElement;
      setDatePendingDeletion(selectionDate);
    },
    []
  );

  const cancelDeleteDateConfirmation = React.useCallback(() => {
    const restoreTarget = deleteDateTriggerRef.current;
    setDatePendingDeletion(null);
    requestAnimationFrame(() => {
      restoreTarget?.focus();
    });
  }, []);

  const confirmDeleteDateEntry = React.useCallback(() => {
    if (!datePendingDeletion) {
      return;
    }
    setSelectedEventDates((previous) =>
      previous.filter((entry) => entry.date !== datePendingDeletion)
    );
    setDatePendingDeletion(null);
    requestAnimationFrame(() => {
      addEventDatesButtonRef.current?.focus();
    });
  }, [datePendingDeletion]);

  const saveDatePickerSelection = () => {
    const sortedDateKeys = [...draftSelectedDateKeys].sort();
    const defaultEventType = getDefaultEventType();
    setSelectedEventDates((previous) => {
      const previousByDate = new Map(previous.map((entry) => [entry.date, entry.eventTypes]));
      return sortedDateKeys.map((date) => {
        const previousEventTypes = previousByDate.get(date);
        return {
          date,
          eventTypes: reconcileEventTypes(
            previousEventTypes,
            availableEventTypeOptions,
            defaultEventType
          ),
          events: previousEventTypes ? previous.find((entry) => entry.date === date)?.events : [],
        };
      });
    });
    closeDatePickerWithoutSaving();
  };

  const toggleDraftDate = (dateKey: string) => {
    setDraftSelectedDateKeys((previous) => {
      if (previous.includes(dateKey)) {
        return previous.filter((value) => value !== dateKey);
      }
      return [...previous, dateKey];
    });
  };

  const handleImageChange = (file: File | null, previewUrl: string | null) => {
    setSelectedImage(file);
    setImagePreview(previewUrl);
  };

  React.useEffect(() => {
    let isCancelled = false;

    const syncTeamColorsFromLogo = async () => {
      if (!imagePreview) {
        if (!isCancelled) {
          setLogoPaletteColors([]);
          setPrimaryTeamColor(DEFAULT_PRIMARY_TEAM_COLOR);
          setSecondaryTeamColor(DEFAULT_SECONDARY_TEAM_COLOR);
        }
        return;
      }

      const palette = await extractPaletteHexColorsFromDataUrl(imagePreview, 6);
      if (isCancelled) {
        return;
      }

      setLogoPaletteColors(palette);
      setPrimaryTeamColor(palette[0] ?? DEFAULT_PRIMARY_TEAM_COLOR);
      setSecondaryTeamColor(palette[1] ?? DEFAULT_SECONDARY_TEAM_COLOR);
    };

    void syncTeamColorsFromLogo();

    return () => {
      isCancelled = true;
    };
  }, [imagePreview]);

  const updateSelectionEventTypes = React.useCallback(
    (selectionDate: string, updater: (eventTypes: EventType[]) => EventType[]) => {
      setSelectedEventDates((previous) =>
        previous.map((entry) => {
          if (entry.date !== selectionDate) {
            return entry;
          }
          const eventTypes = updater(entry.eventTypes);
          return {
            ...entry,
            eventTypes,
            events: entry.events
              ?.map((event, index) => ({
                ...event,
                eventType: eventTypes[index] ?? event.eventType,
              }))
              .slice(0, eventTypes.length),
          };
        })
      );
    },
    []
  );

  const validateInputs = (): boolean => {
    setValidationError("");
    shouldScrollValidationErrorRef.current = false;

    if (!teamName.trim()) {
      shouldScrollValidationErrorRef.current = true;
      setValidationError("Please enter a team name");
      return false;
    }

    if (!ageGroup) {
      shouldScrollValidationErrorRef.current = true;
      setValidationError("Please select an age group");
      return false;
    }

    if (hasGoalieEvaluations) {
      if (goalieEvaluationTimes.includes(".") || goalieEvaluationTimes.includes(",")) {
        shouldScrollValidationErrorRef.current = true;
        setValidationError("Evaluation times must be a positive whole number");
        return false;
      }

      const evaluationsNum = parseInt(goalieEvaluationTimes, 10);
      if (
        isNaN(evaluationsNum) ||
        evaluationsNum <= 0 ||
        evaluationsNum.toString() !== goalieEvaluationTimes.trim()
      ) {
        shouldScrollValidationErrorRef.current = true;
        setValidationError("Evaluation times must be a positive whole number");
        return false;
      }
    }

    return true;
  };

  const generateDocx = async (): Promise<void> => {
    const docxModule = await loadDocxModule();
    const { Packer } = docxModule;

    // ── Sort / reconcile event data ─────────────────────────────────────────
    const sortedEventDates = [...selectedEventDates].sort((a, b) => a.date.localeCompare(b.date));
    const eventSelections = sortedEventDates.flatMap<EventSelection>((eventDate) =>
      eventDate.eventTypes.map((eventType, index) => {
        const event = eventDate.events?.[index] ?? {
          date: eventDate.date,
          eventType,
          source: "manual" as const,
        };
        return { ...event, eventType };
      })
    );
    const detailedEventSelections = eventSelections.filter(
      (event) => detailedEntryEventTypes[event.eventType]
    );

    // ── Resolve logo image ──────────────────────────────────────────────────
    let resolvedLogo: import("../types/generatorConfig").ResolvedLogoData | null = null;
    if (selectedImage && imagePreview) {
      const arrayBuffer = await selectedImage.arrayBuffer();
      const docxImageType = toDocxImageTypeFromMime(selectedImage.type);
      let imgWidth = 400;
      let imgHeight = 400;
      try {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = imagePreview;
        });
        const ratio = img.width / img.height;
        if (ratio > 1) {
          imgWidth = 400;
          imgHeight = 400 / ratio;
        } else {
          imgHeight = 400;
          imgWidth = 400 * ratio;
        }
      } catch (e) {
        console.error("Failed to parse image dimensions", e);
      }
      resolvedLogo = { data: arrayBuffer, type: docxImageType, width: imgWidth, height: imgHeight };
    }

    // ── Build config & content ──────────────────────────────────────────────
    const config: import("../types/generatorConfig").TeamPlanConfig = {
      teamName,
      teamWebsite,
      teamMotto,
      primaryColor: primaryTeamColor,
      secondaryColor: secondaryTeamColor,
      ageGroup,
      hasGoalieMentors,
      hasGoalieEvaluations,
      goalieEvaluationTimes,
      includeStarterIntroductionAndGoals,
      addCalendarOfEvents,
      includeCalendarView,
      includeEventDetails,
      addSuggestedDrillEachPractice,
      sortedEventDates,
      eventSelections,
      detailedEventSelections,
    };

    const content: import("../types/generatorConfig").TeamPlanContent = {
      coverMd,
      seasonOverviewMd,
      eventDetailsMd,
    };

    const doc = await buildTeamPlanDocument(
      config,
      content,
      resolvedLogo,
      getQrCodePngData,
      docxModule
    );
    const blob = await Packer.toBlob(doc);
    const safeName = (teamName.trim() || "TEAM_NAME").replace(/[<>:"/|?*]/g, "_");
    setGeneratedBlob(blob);
    setGeneratedFileName(`${safeName}_Team_Development_Plan.docx`);
  };

  const handleGenerate = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsGenerating(true);

    try {
      await generateDocx();

      trackEvent("generate_plan", {
        type: "team",
        format: "docx",
        team_name: teamName,
        age_group: ageGroup,
      });
    } catch (error) {
      console.error("Error generating document:", error);
      setValidationError("There was an error generating the document. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedBlob && generatedFileName) {
      const url = URL.createObjectURL(generatedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generatedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS);

      trackEvent("download_plan", {
        type: "team",
        format: "docx",
        team_name: teamName,
      });

      setShowModal(false);
      setTeamName("");
      setTeamWebsite("");
      setTeamMotto("");
      setSelectedImage(null);
      setImagePreview(null);
      setPrimaryTeamColor(DEFAULT_PRIMARY_TEAM_COLOR);
      setSecondaryTeamColor(DEFAULT_SECONDARY_TEAM_COLOR);
      setLogoPaletteColors([]);
      setAgeGroup("");
      setAddSuggestedDrillEachPractice(true);
      setHasGoalieMentors(false);
      setHasGoalieEvaluations(false);
      setGoalieEvaluationTimes("3");
      setIncludeStarterIntroductionAndGoals(true);
      setAddCalendarOfEvents(false);
      setIncludeCalendarView(true);
      setIncludeEventDetails(true);
      setCalendarEnabledEventTypes({
        "On-ice Practice": true,
        "Off-ice Practice": true,
        "Video Review": true,
        Evaluation: true,
        Game: true,
      });
      setDetailedEntryEventTypes({
        "On-ice Practice": true,
        "Off-ice Practice": true,
        "Video Review": true,
        Evaluation: true,
        Game: true,
        TBD: true,
      });
      setSelectedEventDates([]);
      setCalendarImportStartDate(toDateKey(new Date()));
      setCalendarImportEndDate(toDateKey(addMonths(new Date(), 6)));
      setIsCalendarImportOpen(false);
      setCalendarFeedUrl("");
      setCalendarImportStatus("");
      setCalendarImportError("");
      setCanDownloadCalendarFeed(false);
      setIsDatePickerOpen(false);
      setDatePickerMonth(getMonthStart(new Date()));
      setDraftSelectedDateKeys([]);
      setDatePendingDeletion(null);
      setValidationError("");
      setGeneratedBlob(null);
      setGeneratedFileName("");
    }
  };

  const handleCancel = React.useCallback(() => {
    setShowModal(false);
    setTeamName("");
    setTeamWebsite("");
    setTeamMotto("");
    setSelectedImage(null);
    setImagePreview(null);
    setPrimaryTeamColor(DEFAULT_PRIMARY_TEAM_COLOR);
    setSecondaryTeamColor(DEFAULT_SECONDARY_TEAM_COLOR);
    setLogoPaletteColors([]);
    setAgeGroup("");
    setAddSuggestedDrillEachPractice(true);
    setHasGoalieMentors(false);
    setHasGoalieEvaluations(false);
    setGoalieEvaluationTimes("3");
    setIncludeStarterIntroductionAndGoals(true);
    setAddCalendarOfEvents(false);
    setIncludeCalendarView(true);
    setIncludeEventDetails(true);
    setCalendarEnabledEventTypes({
      "On-ice Practice": true,
      "Off-ice Practice": true,
      "Video Review": true,
      Evaluation: true,
      Game: true,
    });
    setDetailedEntryEventTypes({
      "On-ice Practice": true,
      "Off-ice Practice": true,
      "Video Review": true,
      Evaluation: true,
      Game: true,
      TBD: true,
    });
    setSelectedEventDates([]);
    setCalendarImportStartDate(toDateKey(new Date()));
    setCalendarImportEndDate(toDateKey(addMonths(new Date(), 6)));
    setIsCalendarImportOpen(false);
    setCalendarFeedUrl("");
    setCalendarImportStatus("");
    setCalendarImportError("");
    setCanDownloadCalendarFeed(false);
    setIsDatePickerOpen(false);
    setDatePickerMonth(getMonthStart(new Date()));
    setDraftSelectedDateKeys([]);
    setDatePendingDeletion(null);
    setValidationError("");
    setGeneratedBlob(null);
    setGeneratedFileName("");
  }, []);

  React.useEffect(() => {
    const defaultEventType = getDefaultEventType();
    setSelectedEventDates((previous) =>
      previous.map((entry) => ({
        ...entry,
        eventTypes: reconcileEventTypes(
          entry.eventTypes,
          availableEventTypeOptions,
          defaultEventType
        ),
      }))
    );
  }, [availableEventTypeOptions, getDefaultEventType]);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showModal && !isGenerating && !generatedBlob) {
        if (datePendingDeletion) {
          cancelDeleteDateConfirmation();
        } else if (isCalendarImportOpen) {
          closeCalendarImport();
        } else if (isDatePickerOpen) {
          closeDatePickerWithoutSaving();
        } else {
          handleCancel();
        }
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [
    showModal,
    isGenerating,
    generatedBlob,
    handleCancel,
    datePendingDeletion,
    cancelDeleteDateConfirmation,
    isCalendarImportOpen,
    closeCalendarImport,
    isDatePickerOpen,
    closeDatePickerWithoutSaving,
  ]);

  const firstDayOfMonth = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), 1);
  const daysInMonth = new Date(
    datePickerMonth.getFullYear(),
    datePickerMonth.getMonth() + 1,
    0
  ).getDate();
  const leadingEmptyDays = firstDayOfMonth.getDay();
  const monthLabel = datePickerMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const canEditEventPlanning = !generatedBlob && !isGenerating;

  const variantClasses = {
    blue: "bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700",
    red: "bg-usa-red hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800",
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setShowModal(true)}
        className={`${variantClasses[variant]} text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105 text-center`}
      >
        Generate Team Development Plan
      </button>

      <Modal
        isOpen={showModal}
        labelledBy="team-plan-modal-title"
        className="max-w-2xl w-full"
        triggerRef={triggerRef}
      >
        {/* Scrollable content */}
        <div className="p-8 overflow-y-auto flex-1 min-h-0">
          <div className="flex items-center gap-4 mb-6">
            <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
            <h2
              id="team-plan-modal-title"
              className="text-2xl font-bold text-usa-blue dark:text-blue-400"
            >
              Generate Team Plan
            </h2>
          </div>

          <div className="mb-4">
            <label
              htmlFor="team-name"
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Team Name
            </label>
            <input
              type="text"
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!!generatedBlob || isGenerating}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your team name"
            />
          </div>

          <div className="mb-4">
            <ImageUploader
              onImageCropped={handleImageChange}
              disabled={!!generatedBlob || isGenerating}
              label="Team Logo (Optional)"
            />
          </div>

          <TeamColorPickers
            primaryColor={primaryTeamColor}
            secondaryColor={secondaryTeamColor}
            paletteColors={logoPaletteColors}
            disabled={!!generatedBlob || isGenerating}
            onPrimaryColorChange={setPrimaryTeamColor}
            onSecondaryColorChange={setSecondaryTeamColor}
          />

          <div className="mb-4">
            <label
              htmlFor="team-website"
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Team/Club Website (Optional)
            </label>
            <input
              type="text"
              id="team-website"
              value={teamWebsite}
              onChange={(e) => setTeamWebsite(e.target.value)}
              disabled={!!generatedBlob || isGenerating}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="https://example.com"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="team-motto"
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Team/Club Motto/Mission (Optional)
            </label>
            <textarea
              id="team-motto"
              value={teamMotto}
              onChange={(e) => setTeamMotto(e.target.value)}
              disabled={!!generatedBlob || isGenerating}
              rows={3}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Share your team or club mission"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="ageGroup"
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Age Group
            </label>
            <select
              id="ageGroup"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              disabled={!!generatedBlob || isGenerating}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select age group</option>
              {ageGroups.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <legend className="px-2 text-lg font-bold text-usa-blue dark:text-blue-400">
              Team Plan Details
            </legend>

            <SliderToggle
              id="add-suggested-goalie-drill"
              label="Add suggested goalie drill for each practice?"
              enabled={addSuggestedDrillEachPractice}
              onChange={setAddSuggestedDrillEachPractice}
              disabled={!!generatedBlob || isGenerating}
            />
            <SliderToggle
              id="has-goalie-mentors"
              label="Does this team have a goalie mentor(s) from an older team(s)?"
              enabled={hasGoalieMentors}
              onChange={setHasGoalieMentors}
              disabled={!!generatedBlob || isGenerating}
            />
            <SliderToggle
              id="goalie-evaluations"
              label="Do goalies receive evaluations?"
              enabled={hasGoalieEvaluations}
              onChange={setHasGoalieEvaluations}
              disabled={!!generatedBlob || isGenerating}
            />
            {hasGoalieEvaluations && (
              <div className="ml-1 mb-4">
                <label
                  htmlFor="goalie-evaluations-count"
                  className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
                >
                  Number of evaluation times during season
                </label>
                <input
                  id="goalie-evaluations-count"
                  type="number"
                  min="1"
                  step="1"
                  value={goalieEvaluationTimes}
                  onChange={(e) => setGoalieEvaluationTimes(e.target.value)}
                  disabled={!!generatedBlob || isGenerating}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}
            <SliderToggle
              id="include-starter-intro-goals"
              label="Add starter content for introduction and season goals?"
              enabled={includeStarterIntroductionAndGoals}
              onChange={setIncludeStarterIntroductionAndGoals}
              disabled={!!generatedBlob || isGenerating}
            />
            <SliderToggle
              id="include-calendar-events"
              label="Add calendar of events?"
              enabled={addCalendarOfEvents}
              onChange={(enabled) => {
                setAddCalendarOfEvents(enabled);
                if (!enabled) {
                  closeDatePickerWithoutSaving();
                  setIsCalendarImportOpen(false);
                  setDatePendingDeletion(null);
                }
              }}
              disabled={!!generatedBlob || isGenerating}
            />
          </fieldset>

          {addCalendarOfEvents && (
            <fieldset className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <legend className="px-2 text-lg font-bold text-usa-blue dark:text-blue-400">
                Event Planning
              </legend>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="calendar-import-start-date"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Calendar import start date
                  </label>
                  <input
                    id="calendar-import-start-date"
                    type="date"
                    value={calendarImportStartDate}
                    onChange={(event) => setCalendarImportStartDate(event.target.value)}
                    disabled={!canEditEventPlanning}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="calendar-import-end-date"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Calendar import end date
                  </label>
                  <input
                    id="calendar-import-end-date"
                    type="date"
                    value={calendarImportEndDate}
                    onChange={(event) => setCalendarImportEndDate(event.target.value)}
                    disabled={!canEditEventPlanning}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <SliderToggle
                id="include-calendar-view"
                label="Include calendar view?"
                enabled={includeCalendarView}
                onChange={setIncludeCalendarView}
                disabled={!canEditEventPlanning}
              />
              <SliderToggle
                id="include-event-details"
                label="Include details for each event?"
                enabled={includeEventDetails}
                onChange={setIncludeEventDetails}
                disabled={!canEditEventPlanning}
              />

              <fieldset className="mb-4">
                <legend className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  <EventTypeLegend
                    label="Calendar Event Types"
                    helperText="These event types will be enabled for your plan and will show up on the calendar view, if enabled"
                  />
                </legend>
                <div className="space-y-2">
                  {CONFIGURABLE_EVENT_TYPES.map((eventType) => (
                    <label
                      key={eventType}
                      className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={calendarEnabledEventTypes[eventType]}
                        onChange={(e) => {
                          const isEnabled = e.target.checked;
                          setCalendarEnabledEventTypes((previous) => ({
                            ...previous,
                            [eventType]: isEnabled,
                          }));
                          setDetailedEntryEventTypes((previous) => ({
                            ...previous,
                            [eventType]: isEnabled,
                          }));
                        }}
                        disabled={!canEditEventPlanning}
                        className="h-4 w-4 text-usa-blue dark:text-blue-400 border-gray-300 rounded focus:ring-usa-blue disabled:cursor-not-allowed"
                      />
                      <span>{eventType}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {includeEventDetails && (
                <fieldset className="mb-4">
                  <legend className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    <EventTypeLegend
                      label="Event Types for Detailed Entries"
                      helperText="Events of these types will have individual entries in the team plan, for use in planning and for taking notes"
                    />
                  </legend>
                  <div className="space-y-2">
                    {DETAILED_ENTRY_EVENT_TYPES.map((eventType) => {
                      const isCalendarDisabledForType =
                        eventType !== "TBD" && !calendarEnabledEventTypes[eventType];
                      return (
                        <label
                          key={`detailed-event-type-${eventType}`}
                          className={`flex items-center gap-2 ${
                            isCalendarDisabledForType
                              ? "text-gray-400 dark:text-gray-500"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={detailedEntryEventTypes[eventType]}
                            onChange={(e) =>
                              setDetailedEntryEventTypes((previous) => ({
                                ...previous,
                                [eventType]: e.target.checked,
                              }))
                            }
                            disabled={!canEditEventPlanning || isCalendarDisabledForType}
                            className="h-4 w-4 text-usa-blue dark:text-blue-400 border-gray-300 rounded focus:ring-usa-blue disabled:cursor-not-allowed"
                          />
                          <span>
                            {eventType}
                            {isCalendarDisabledForType && (
                              <span className="ml-1">(Must be enabled in Calendar view.)</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  ref={addEventDatesButtonRef}
                  onClick={openDatePicker}
                  disabled={!canEditEventPlanning}
                  className={`w-full rounded-lg px-4 py-2 font-semibold text-white transition-colors ${
                    canEditEventPlanning
                      ? "bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700"
                      : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  }`}
                >
                  Add Event Dates Manually
                </button>
                <button
                  type="button"
                  ref={addCalendarEventsButtonRef}
                  onClick={openCalendarImport}
                  disabled={!canEditEventPlanning}
                  className={`w-full rounded-lg px-4 py-2 font-semibold text-white transition-colors ${
                    canEditEventPlanning
                      ? "bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700"
                      : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  }`}
                >
                  Add Event Dates from Calendar Feed
                </button>
              </div>

              {selectedEventDates.length > 0 && (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    Selected Event Dates
                  </p>
                  <div className="space-y-3">
                    {selectedEventDates.map((selection) => (
                      <div
                        key={selection.date}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={(event) =>
                              openDeleteDateConfirmation(selection.date, event.currentTarget)
                            }
                            disabled={!canEditEventPlanning}
                            aria-label={`Delete all events for ${formatDisplayDate(selection.date)}`}
                            className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-usa-blue ${
                              canEditEventPlanning
                                ? "border-gray-300 text-gray-500 hover:border-usa-red hover:bg-usa-red hover:text-white dark:border-gray-600 dark:text-gray-300 dark:hover:border-usa-red dark:hover:bg-usa-red dark:hover:text-white"
                                : "border-gray-300 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:text-gray-500"
                            }`}
                          >
                            <span aria-hidden="true">×</span>
                          </button>
                          <div className="min-w-0 flex-1">
                            <span className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                              {formatDisplayDate(selection.date)}
                            </span>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:items-center">
                              <select
                                value={selection.eventTypes[0] ?? getDefaultEventType()}
                                onChange={(e) =>
                                  updateSelectionEventTypes(selection.date, (eventTypes) => [
                                    e.target.value as EventType,
                                    ...eventTypes.slice(1),
                                  ])
                                }
                                disabled={!canEditEventPlanning}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Event type for ${formatDisplayDate(selection.date)}`}
                              >
                                {availableEventTypeOptions.map((eventType) => (
                                  <option key={`${selection.date}-${eventType}`} value={eventType}>
                                    {eventType}
                                  </option>
                                ))}
                              </select>
                              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={selection.eventTypes.length > 1}
                                  onChange={(e) =>
                                    updateSelectionEventTypes(selection.date, (eventTypes) => {
                                      if (e.target.checked) {
                                        return [...eventTypes, getDefaultEventType()];
                                      }
                                      return [eventTypes[0] ?? getDefaultEventType()];
                                    })
                                  }
                                  disabled={!canEditEventPlanning}
                                  aria-label={`More than one event on this date (${formatDisplayDate(selection.date)})`}
                                  className="h-4 w-4 text-usa-blue dark:text-blue-400 border-gray-300 rounded focus:ring-usa-blue disabled:cursor-not-allowed"
                                />
                                <span>More than one event on this date</span>
                              </label>
                            </div>
                            {selection.eventTypes.length > 1 && (
                              <div className="mt-2 space-y-2">
                                {selection.eventTypes.slice(1).map((eventType, index) => (
                                  <div
                                    key={`${selection.date}-additional-event-type-${index + 1}`}
                                    className="flex items-center gap-2"
                                  >
                                    <select
                                      value={eventType}
                                      onChange={(e) =>
                                        updateSelectionEventTypes(selection.date, (eventTypes) =>
                                          eventTypes.map((value, valueIndex) =>
                                            valueIndex === index + 1
                                              ? (e.target.value as EventType)
                                              : value
                                          )
                                        )
                                      }
                                      disabled={!canEditEventPlanning}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                      aria-label={`Additional event type ${index + 2} for ${formatDisplayDate(
                                        selection.date
                                      )}`}
                                    >
                                      {availableEventTypeOptions.map((availableEventType) => (
                                        <option
                                          key={`${selection.date}-additional-${index + 1}-${availableEventType}`}
                                          value={availableEventType}
                                        >
                                          {availableEventType}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateSelectionEventTypes(selection.date, (eventTypes) =>
                                          eventTypes.filter(
                                            (_, valueIndex) => valueIndex !== index + 1
                                          )
                                        )
                                      }
                                      disabled={!canEditEventPlanning}
                                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                        canEditEventPlanning
                                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                          : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                                      }`}
                                      aria-label={`Remove additional event type ${index + 2} for ${formatDisplayDate(
                                        selection.date
                                      )}`}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSelectionEventTypes(selection.date, (eventTypes) => [
                                      ...eventTypes,
                                      getDefaultEventType(),
                                    ])
                                  }
                                  disabled={!canEditEventPlanning}
                                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                    canEditEventPlanning
                                      ? "bg-usa-blue text-white hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700"
                                      : "bg-gray-400 text-white cursor-not-allowed dark:bg-gray-600"
                                  }`}
                                  aria-label={`Add another event type for ${formatDisplayDate(selection.date)}`}
                                >
                                  Add Another Event Type
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>
          )}

          {validationError && (
            <div
              ref={validationErrorRef}
              className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm"
            >
              {validationError}
            </div>
          )}

          {generatedBlob && !validationError && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg text-sm">
              Document generated successfully! Click Download to save it.
            </div>
          )}
        </div>

        {/* Non-scrolling footer — action buttons always visible */}
        <div className="px-8 pt-4 pb-8 flex gap-4 flex-shrink-0">
          {!generatedBlob ? (
            <>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`flex-1 bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors ${
                  isGenerating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isGenerating}
                className={`flex-1 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors ${
                  isGenerating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Download
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </Modal>

      {showModal && isCalendarImportOpen && (
        <>
          <div aria-hidden="true" className="fixed inset-0 bg-black/70 z-[60]" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="calendar-import-title"
              className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl dark:bg-gray-800"
            >
              <h3
                id="calendar-import-title"
                className="mb-2 text-xl font-bold text-usa-blue dark:text-blue-400"
              >
                Import Calendar Events
              </h3>
              <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                Paste a calendar feed URL, or download the feed from your calendar provider and
                upload the .ics file below. Imported events are added to the existing events.
              </p>
              <label
                htmlFor="calendar-feed-url"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Calendar feed URL
              </label>
              <input
                id="calendar-feed-url"
                type="url"
                value={calendarFeedUrl}
                onChange={(event) => setCalendarFeedUrl(event.target.value)}
                placeholder="https://..."
                disabled={isImportingCalendar}
                className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCalendarFeedImport}
                  disabled={isImportingCalendar || !calendarFeedUrl.trim()}
                  className="rounded-lg bg-usa-blue px-4 py-2 font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {isImportingCalendar ? "Importing..." : "Import from URL"}
                </button>
                <button
                  type="button"
                  onClick={() => calendarFileInputRef.current?.click()}
                  disabled={isImportingCalendar}
                  className="rounded-lg bg-gray-600 px-4 py-2 font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  Upload an .ics file
                </button>
              </div>
              <input
                ref={calendarFileInputRef}
                type="file"
                accept=".ics,text/calendar"
                onChange={handleCalendarFileChange}
                className="hidden"
                aria-label="Upload an .ics file"
              />
              {calendarImportError && (
                <div role="alert" className="mb-3 rounded-lg bg-red-100 p-3 text-sm text-red-800">
                  <p>{calendarImportError}</p>
                  {canDownloadCalendarFeed && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadCalendarFeed}
                        className="rounded-lg bg-usa-blue px-3 py-2 font-semibold text-white hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700"
                      >
                        Download Feed
                      </button>
                      <span aria-hidden="true" className="text-lg font-bold text-gray-600">
                        →
                      </span>
                      <button
                        type="button"
                        onClick={handleUseDownloadedFeed}
                        disabled={isImportingCalendar}
                        className="rounded-lg bg-gray-600 px-3 py-2 font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        Use Downloaded Feed
                      </button>
                    </div>
                  )}
                </div>
              )}
              {calendarImportStatus && (
                <p className="mb-3 rounded-lg bg-green-100 p-3 text-sm text-green-800">
                  {calendarImportStatus}
                </p>
              )}
              <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
                If URL import fails because the provider blocks browser access (CORS), download the
                calendar as an .ics file from that application and upload it here.
              </p>
              <button
                type="button"
                onClick={closeCalendarImport}
                disabled={isImportingCalendar}
                className="w-full rounded-lg bg-gray-400 px-4 py-2 font-semibold text-white hover:bg-gray-500 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {showModal && isDatePickerOpen && (
        <>
          <div aria-hidden="true" className="fixed inset-0 bg-black/70 z-[60]" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-date-picker-title"
              className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-2xl p-5"
            >
              <h3
                id="event-date-picker-title"
                className="text-xl font-bold text-usa-blue dark:text-blue-400 mb-4"
              >
                Select Event Dates
              </h3>

              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setDatePickerMonth(
                      (previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1)
                    )
                  }
                  className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() =>
                    setDatePickerMonth(
                      (previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1)
                    )
                  }
                  className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAY_LABELS.map((label) => (
                  <span
                    key={label}
                    className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 mb-5">
                {Array.from({ length: leadingEmptyDays }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const date = new Date(
                    datePickerMonth.getFullYear(),
                    datePickerMonth.getMonth(),
                    day
                  );
                  const dateKey = toDateKey(date);
                  const isSelected = draftSelectedDateKeys.includes(dateKey);

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => toggleDraftDate(dateKey)}
                      aria-pressed={isSelected}
                      aria-label={date.toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      className={`rounded px-2 py-1 text-sm transition-colors ${
                        isSelected
                          ? "bg-usa-blue text-white dark:bg-blue-600"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveDatePickerSelection}
                  className="flex-1 rounded-lg bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 text-white font-semibold"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={closeDatePickerWithoutSaving}
                  className="flex-1 rounded-lg bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-white font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {showModal && datePendingDeletion && (
        <>
          <div aria-hidden="true" className="fixed inset-0 bg-black/70 z-[70]" />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-event-date-title"
              aria-describedby="delete-event-date-description"
              className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-2xl p-5"
            >
              <h3
                id="delete-event-date-title"
                className="text-xl font-bold text-usa-blue dark:text-blue-400 mb-2"
              >
                Delete event date?
              </h3>
              <p
                id="delete-event-date-description"
                className="mb-4 text-sm text-gray-700 dark:text-gray-300"
              >
                Remove {formatDisplayDate(datePendingDeletion)} and all event types assigned to this
                date?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelDeleteDateConfirmation}
                  className="flex-1 rounded-lg bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-white font-semibold"
                  autoFocus
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteDateEntry}
                  className="flex-1 rounded-lg bg-usa-red hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800 px-4 py-2 text-white font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
