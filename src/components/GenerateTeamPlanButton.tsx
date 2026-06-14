import * as React from "react";
import type { FileChild, IRunOptions } from "docx";
import Logo from "./Logo";
import Modal from "./Modal";
import SliderToggle from "./SliderToggle";
import { trackEvent } from "../utils/analytics";
import ImageUploader from "./ImageUploader";
import TeamColorPickers from "./TeamColorPickers";
import { parseMarkdown } from "../utils/markdownParser";
import { blocksToDocxParagraphs } from "../utils/docxContent";
import { loadDocxModule } from "../utils/loadExportModules";
import { OBJECT_URL_REVOKE_DELAY_MS } from "../utils/staticAsset";
import { toDocxImageTypeFromMime } from "../utils/docxImageType";
import { buildEventCalendarMonths } from "../utils/teamPlanCalendarGrid";
import {
  DEFAULT_PRIMARY_TEAM_COLOR,
  DEFAULT_SECONDARY_TEAM_COLOR,
  extractPaletteHexColorsFromDataUrl,
} from "../utils/teamColors";
import coverMd from "../content/team-plan/cover.md";
import seasonOverviewMd from "../content/team-plan/season-overview.md";
import practiceTemplateMd from "../content/team-plan/practice-template.md";
import eventDetailsMd from "../content/team-plan/event-details.md";

type AgeGroup = "8u" | "10u" | "12u" | "14u+";
type SkillLevel = "beginner" | "intermediate" | "advanced";
type ConfigurableEventType =
  | "On-ice Practice"
  | "Off-ice Practice"
  | "Video Review"
  | "Evaluation"
  | "Game";
type EventType = ConfigurableEventType | "TBD";

interface EventDateSelection {
  date: string;
  eventTypes: EventType[];
}

interface EventSelection {
  date: string;
  eventType: EventType;
}

interface GenerateTeamPlanButtonProps {
  variant?: "blue" | "red";
}

const CONFIGURABLE_EVENT_TYPES: ConfigurableEventType[] = [
  "On-ice Practice",
  "Off-ice Practice",
  "Video Review",
  "Evaluation",
  "Game",
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_CALENDARS_PER_PAGE = 2;

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
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function extractLevel3Section(markdown: string, heading: string): string {
  const lines = markdown.split(/\r?\n/);
  const sectionLines: string[] = [];
  let collecting = false;

  for (const line of lines) {
    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      if (collecting) {
        break;
      }
      collecting = headingMatch[1].trim() === heading;
      continue;
    }

    if (collecting) {
      sectionLines.push(line);
    }
  }

  return sectionLines.join("\n").trim();
}

function valueOrPlaceholder(value: string, placeholderName: string): string {
  const trimmed = value.trim();
  return trimmed || `[${placeholderName}]`;
}

function normalizeUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getSeasonOverviewMarkdown(includeStarter: boolean, selectedAgeGroup: string): string {
  const ageGroupHeadingMap: Record<string, string> = {
    "8u": "8U Starter Content Placeholder",
    "10u": "10U Starter Content Placeholder",
    "12u": "12U Starter Content Placeholder",
    "14u+": "14U+ Starter Content Placeholder",
  };

  const selectedPlaceholderSection = extractLevel3Section(
    seasonOverviewMd,
    "Selected Overview Placeholder"
  );
  const starterHeading = ageGroupHeadingMap[selectedAgeGroup];
  const starterSection = starterHeading
    ? extractLevel3Section(seasonOverviewMd, starterHeading)
    : "";

  const sectionBody = includeStarter
    ? starterSection || selectedPlaceholderSection || "[SEASON_OVERVIEW_SELECTED]"
    : selectedPlaceholderSection || "[SEASON_OVERVIEW_SELECTED]";

  return `## Season Overview\n\n${sectionBody}`;
}

function getEventStarterMarkdown(eventType: EventType): string {
  if (eventType === "On-ice Practice") {
    return (
      extractLevel3Section(eventDetailsMd, "Practice Event Starter Placeholder") ||
      "[EVENT_DETAILS_PRACTICE_STARTER]"
    );
  }
  if (eventType === "Game") {
    return (
      extractLevel3Section(eventDetailsMd, "Game Event Starter Placeholder") ||
      "[EVENT_DETAILS_GAME_STARTER]"
    );
  }
  if (eventType === "Off-ice Practice" || eventType === "Video Review") {
    return (
      extractLevel3Section(eventDetailsMd, "Off-Ice Event Starter Placeholder") ||
      "[EVENT_DETAILS_OFF_ICE_STARTER]"
    );
  }
  return (
    extractLevel3Section(eventDetailsMd, "Selected Event Details Placeholder") ||
    "[EVENT_DETAILS_SELECTED]"
  );
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
  const [skillLevel, setSkillLevel] = React.useState<string>("");
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
  const [enabledEventTypes, setEnabledEventTypes] = React.useState<
    Record<ConfigurableEventType, boolean>
  >({
    "On-ice Practice": true,
    "Off-ice Practice": true,
    "Video Review": true,
    Evaluation: true,
    Game: true,
  });
  const [selectedEventDates, setSelectedEventDates] = React.useState<EventDateSelection[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState<boolean>(false);
  const [datePickerMonth, setDatePickerMonth] = React.useState<Date>(getMonthStart(new Date()));
  const [draftSelectedDateKeys, setDraftSelectedDateKeys] = React.useState<string[]>([]);
  const [datePendingDeletion, setDatePendingDeletion] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [validationError, setValidationError] = React.useState<string>("");
  const [generatedBlob, setGeneratedBlob] = React.useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = React.useState<string>("");
  const addEventDatesButtonRef = React.useRef<HTMLButtonElement>(null);
  const deleteDateTriggerRef = React.useRef<HTMLButtonElement | null>(null);

  const ageGroups: AgeGroup[] = ["8u", "10u", "12u", "14u+"];
  const skillLevels: SkillLevel[] = ["beginner", "intermediate", "advanced"];

  const availableConfigurableEventTypes = React.useMemo(
    () => CONFIGURABLE_EVENT_TYPES.filter((eventType) => enabledEventTypes[eventType]),
    [enabledEventTypes]
  );

  const availableEventTypeOptions = React.useMemo<EventType[]>(
    () => [...availableConfigurableEventTypes, "TBD"],
    [availableConfigurableEventTypes]
  );

  const getDefaultEventType = React.useCallback((): EventType => {
    if (enabledEventTypes["On-ice Practice"]) {
      return "On-ice Practice";
    }
    if (enabledEventTypes.Game) {
      return "Game";
    }
    if (availableConfigurableEventTypes.length > 0) {
      return [...availableConfigurableEventTypes].sort((a, b) => a.localeCompare(b))[0];
    }
    return "TBD";
  }, [availableConfigurableEventTypes, enabledEventTypes]);

  const openDatePicker = () => {
    setDraftSelectedDateKeys(selectedEventDates.map((entry) => entry.date));
    setDatePickerMonth(getMonthStart(new Date()));
    setIsDatePickerOpen(true);
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

      const palette = await extractPaletteHexColorsFromDataUrl(imagePreview, 8);
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
        previous.map((entry) =>
          entry.date === selectionDate ? { ...entry, eventTypes: updater(entry.eventTypes) } : entry
        )
      );
    },
    []
  );

  const validateInputs = (): boolean => {
    setValidationError("");

    if (!teamName.trim()) {
      setValidationError("Please enter a team name");
      return false;
    }

    if (!ageGroup) {
      setValidationError("Please select an age group");
      return false;
    }

    if (!skillLevel) {
      setValidationError("Please select a skill level");
      return false;
    }

    if (hasGoalieEvaluations) {
      if (goalieEvaluationTimes.includes(".") || goalieEvaluationTimes.includes(",")) {
        setValidationError("Evaluation times must be a positive whole number");
        return false;
      }

      const evaluationsNum = parseInt(goalieEvaluationTimes, 10);
      if (
        isNaN(evaluationsNum) ||
        evaluationsNum <= 0 ||
        evaluationsNum.toString() !== goalieEvaluationTimes.trim()
      ) {
        setValidationError("Evaluation times must be a positive whole number");
        return false;
      }
    }

    return true;
  };

  const generateDocx = async (): Promise<void> => {
    const {
      AlignmentType,
      Document,
      ExternalHyperlink,
      HeadingLevel,
      ImageRun,
      Packer,
      Paragraph,
      Table,
      TableCell,
      TableLayoutType,
      TableRow,
      TextRun,
      VerticalAlign,
      WidthType,
    } = await loadDocxModule();
    const sortedEventDates = [...selectedEventDates].sort((a, b) => a.date.localeCompare(b.date));
    const eventSelections = sortedEventDates.flatMap<EventSelection>((eventDate) =>
      eventDate.eventTypes.map((eventType) => ({ date: eventDate.date, eventType }))
    );

    let arrayBuffer: ArrayBuffer | null = null;
    if (selectedImage) {
      arrayBuffer = await selectedImage.arrayBuffer();
    }

    const toBlackRun = (text: string, options: Omit<IRunOptions, "text"> = {}) =>
      new TextRun({ text, color: "000000", ...options });

    const addResourceLinkWithQr = async (
      linesBeforeUrl: string,
      rawUrl: string,
      qrSize = 84
    ): Promise<void> => {
      const normalizedUrl = normalizeUrl(rawUrl);
      if (!normalizedUrl) {
        return;
      }

      documentChildren.push(
        new Paragraph({
          children: [
            toBlackRun(linesBeforeUrl),
            new ExternalHyperlink({
              link: normalizedUrl,
              children: [toBlackRun(normalizedUrl, { underline: { type: "single" } })],
            }),
          ],
          spacing: { after: 120 },
        })
      );

      const qrData = await getQrCodePngData(normalizedUrl);
      if (qrData) {
        documentChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                type: "png",
                data: qrData,
                transformation: { width: qrSize, height: qrSize },
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 },
          })
        );
      }
    };

    const documentChildren: FileChild[] = [];

    const planTitleSection = extractLevel3Section(coverMd, "Plan Title") || "[PLAN_TITLE]";
    const coverTitle = planTitleSection.replace(
      /\[PLAN_TITLE\]/g,
      "Team-Level Goaltending Development Plan"
    );
    documentChildren.push(
      new Paragraph({
        children: [toBlackRun(coverTitle)],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [toBlackRun(teamName)],
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    if (arrayBuffer && imagePreview && selectedImage) {
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

      documentChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: docxImageType,
              data: arrayBuffer,
              transformation: { width: imgWidth, height: imgHeight },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    const normalizedWebsiteUrl = normalizeUrl(teamWebsite);
    if (normalizedWebsiteUrl) {
      documentChildren.push(
        new Paragraph({
          children: [
            new ExternalHyperlink({
              link: normalizedWebsiteUrl,
              children: [toBlackRun(teamWebsite.trim(), { underline: { type: "single" } })],
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        })
      );
    }

    if (teamMotto.trim()) {
      documentChildren.push(
        new Paragraph({
          children: [toBlackRun(teamMotto.trim(), { italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        })
      );
    }

    documentChildren.push(new Paragraph({ children: [toBlackRun("")], pageBreakBefore: true }));

    documentChildren.push(
      new Paragraph({
        children: [toBlackRun("Team-Level Goaltending Development Plan")],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 200 },
      }),
      new Paragraph({
        children: [toBlackRun(`Team Name: ${valueOrPlaceholder(teamName, "TEAM_NAME")}`)],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          toBlackRun(`Age Group: ${valueOrPlaceholder(ageGroup.toUpperCase(), "AGE_GROUP")}`),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          toBlackRun(
            `Experience Level: ${valueOrPlaceholder(
              skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1),
              "SKILL_LEVEL"
            )}`
          ),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [toBlackRun(`Website: ${valueOrPlaceholder(teamWebsite, "WEBSITE_URL")}`)],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          toBlackRun(
            `Motto / Mission: ${valueOrPlaceholder(teamMotto, "TEAM_OR_CLUB_MOTTO_OR_MISSION")}`
          ),
        ],
        spacing: { after: 300 },
      })
    );

    documentChildren.push(
      ...blocksToDocxParagraphs(
        parseMarkdown(getSeasonOverviewMarkdown(includeStarterIntroductionAndGoals, ageGroup))
      )
    );

    if (hasGoalieMentors) {
      documentChildren.push(
        ...blocksToDocxParagraphs(
          parseMarkdown(`## Goalie Mentor Information

- Mentor Name: [GOALIE_MENTOR_NAME]
- Mentor Team: [GOALIE_MENTOR_TEAM]
- Mentor Role: [GOALIE_MENTOR_ROLE]
- Mentor Contact Information: [GOALIE_MENTOR_CONTACT_INFORMATION]
- Mentor Meeting Cadence: [GOALIE_MENTOR_MEETING_CADENCE]`)
        )
      );
    }

    if (hasGoalieEvaluations) {
      const evaluationsCount = parseInt(goalieEvaluationTimes, 10);
      documentChildren.push(
        new Paragraph({
          children: [toBlackRun("Goalie Evaluations")],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [toBlackRun("Planned evaluation sessions:")],
          spacing: { after: 120 },
        })
      );

      for (let i = 1; i <= evaluationsCount; i += 1) {
        documentChildren.push(
          new Paragraph({
            children: [toBlackRun(`Evaluation ${i}: [EVALUATION_${i}_DATE]`)],
            bullet: { level: 0 },
            spacing: { after: 100 },
          })
        );
      }

      await addResourceLinkWithQr(
        "Evaluation forms available at ",
        "https://goaliegen.com/goalie-evals/"
      );
    }

    documentChildren.push(
      new Paragraph({
        children: [toBlackRun("Practice Plans")],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const allTemplateBlocks = parseMarkdown(practiceTemplateMd);
    // Skip only the first heading (section title) so the "Practice N" label
    // above each practice isn't duplicated, but any sub-headings in the
    // template (e.g. "### Warm-Up") are still rendered in each practice.
    const firstHeadingIdx = allTemplateBlocks.findIndex((b) => b.type === "heading");
    const templateBlocks =
      firstHeadingIdx >= 0
        ? allTemplateBlocks.filter((_, i) => i !== firstHeadingIdx)
        : allTemplateBlocks;
    documentChildren.push(
      new Paragraph({
        children: [toBlackRun("Practice 1")],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );
    if (addSuggestedDrillEachPractice) {
      documentChildren.push(
        new Paragraph({
          children: [toBlackRun("Suggested Goalie Drill: [SUGGESTED_GOALIE_DRILL]")],
          spacing: { after: 100 },
        })
      );
    }
    documentChildren.push(...blocksToDocxParagraphs(templateBlocks));

    if (addCalendarOfEvents && eventSelections.length > 0) {
      documentChildren.push(
        new Paragraph({
          children: [toBlackRun("Team Calendar")],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      if (includeCalendarView) {
        const calendarMonths = buildEventCalendarMonths(sortedEventDates);

        documentChildren.push(
          new Paragraph({
            children: [toBlackRun("Calendar View")],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );

        calendarMonths.forEach((month, monthIndex) => {
          const startsNewCalendarPage =
            monthIndex > 0 && monthIndex % MONTH_CALENDARS_PER_PAGE === 0;
          documentChildren.push(
            new Paragraph({
              children: [toBlackRun(month.monthLabel)],
              heading: HeadingLevel.HEADING_3,
              pageBreakBefore: startsNewCalendarPage,
              spacing: { before: 250, after: 120 },
            })
          );

          const tableRows = [
            new TableRow({
              cantSplit: true,
              tableHeader: true,
              children: WEEKDAY_LABELS.map(
                (weekday) =>
                  new TableCell({
                    width: { size: 14.28, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: "EDEDED" },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [toBlackRun(weekday, { bold: true })],
                      }),
                    ],
                  })
              ),
            }),
            ...month.weeks.map(
              (week) =>
                new TableRow({
                  cantSplit: true,
                  children: week.map((cell) => {
                    const dateLabel = cell.dayOfMonth ? `${cell.dayOfMonth}` : "";
                    const eventTypeLabel = cell.hasEvents ? cell.eventTypes.join(", ") : "";
                    return new TableCell({
                      width: { size: 14.28, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.TOP,
                      shading: cell.hasEvents ? { fill: "D9D9D9" } : undefined,
                      children: [
                        new Paragraph({
                          spacing: { after: cell.hasEvents ? 30 : 80 },
                          children: [toBlackRun(dateLabel, { bold: cell.hasEvents })],
                        }),
                        ...(eventTypeLabel
                          ? [
                              new Paragraph({
                                spacing: { after: 40 },
                                children: [toBlackRun(eventTypeLabel, { size: 16 })],
                              }),
                            ]
                          : [new Paragraph({ children: [toBlackRun("")] })]),
                      ],
                    });
                  }),
                })
            ),
          ];

          documentChildren.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              rows: tableRows,
            })
          );
          documentChildren.push(
            new Paragraph({ children: [toBlackRun("")], spacing: { after: 120 } })
          );
        });
      }

      if (includeEventDetails) {
        documentChildren.push(
          new Paragraph({
            children: [toBlackRun("Event Details")],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );

        for (const event of eventSelections) {
          documentChildren.push(
            new Paragraph({
              children: [toBlackRun(`${formatDisplayDate(event.date)} (${event.eventType})`)],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 250, after: 120 },
            })
          );

          documentChildren.push(
            ...blocksToDocxParagraphs(
              parseMarkdown(`- Event Date: ${valueOrPlaceholder(event.date, "EVENT_DATE")}
- Event Type: ${event.eventType}
- Event Focus: [EVENT_FOCUS]

${getEventStarterMarkdown(event.eventType)}`)
            )
          );

          if (event.eventType === "On-ice Practice" && addSuggestedDrillEachPractice) {
            await addResourceLinkWithQr(
              "Suggested goalie drills page: ",
              "https://goaliegen.com/goalie-drills/"
            );
          }

          if (event.eventType === "Evaluation") {
            await addResourceLinkWithQr(
              "Evaluation forms available at ",
              "https://goaliegen.com/goalie-evals/"
            );
          }
        }
      }
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Helvetica",
            },
          },
        },
      },
      sections: [{ properties: {}, children: documentChildren }],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = valueOrPlaceholder(teamName, "TEAM_NAME").replace(/[<>:"/\\|?*]/g, "_");
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
        skill_level: skillLevel,
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
      setSkillLevel("");
      setAddSuggestedDrillEachPractice(true);
      setHasGoalieMentors(false);
      setHasGoalieEvaluations(false);
      setGoalieEvaluationTimes("3");
      setIncludeStarterIntroductionAndGoals(true);
      setAddCalendarOfEvents(false);
      setIncludeCalendarView(true);
      setIncludeEventDetails(true);
      setEnabledEventTypes({
        "On-ice Practice": true,
        "Off-ice Practice": true,
        "Video Review": true,
        Evaluation: true,
        Game: true,
      });
      setSelectedEventDates([]);
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
    setSkillLevel("");
    setAddSuggestedDrillEachPractice(true);
    setHasGoalieMentors(false);
    setHasGoalieEvaluations(false);
    setGoalieEvaluationTimes("3");
    setIncludeStarterIntroductionAndGoals(true);
    setAddCalendarOfEvents(false);
    setIncludeCalendarView(true);
    setIncludeEventDetails(true);
    setEnabledEventTypes({
      "On-ice Practice": true,
      "Off-ice Practice": true,
      "Video Review": true,
      Evaluation: true,
      Game: true,
    });
    setSelectedEventDates([]);
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
        className="max-w-md w-full"
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

          <div className="mb-4">
            <label
              htmlFor="skillLevel"
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Skill Level
            </label>
            <select
              id="skillLevel"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              disabled={!!generatedBlob || isGenerating}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select skill level</option>
              {skillLevels.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
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
                  Event Types
                </legend>
                <div className="space-y-2">
                  {CONFIGURABLE_EVENT_TYPES.map((eventType) => (
                    <label
                      key={eventType}
                      className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={enabledEventTypes[eventType]}
                        onChange={(e) =>
                          setEnabledEventTypes((previous) => ({
                            ...previous,
                            [eventType]: e.target.checked,
                          }))
                        }
                        disabled={!canEditEventPlanning}
                        className="h-4 w-4 text-usa-blue border-gray-300 rounded focus:ring-usa-blue disabled:cursor-not-allowed"
                      />
                      <span>{eventType}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      aria-label="TBD event type is always enabled"
                      className="h-4 w-4 text-usa-blue border-gray-300 rounded"
                    />
                    <span>TBD (always enabled)</span>
                  </label>
                </div>
              </fieldset>

              <button
                type="button"
                ref={addEventDatesButtonRef}
                onClick={openDatePicker}
                disabled={!canEditEventPlanning}
                className={`mb-4 w-full rounded-lg px-4 py-2 font-semibold text-white transition-colors ${
                  canEditEventPlanning
                    ? "bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700"
                    : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                }`}
              >
                Add Event Dates
              </button>

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
                                  className="h-4 w-4 text-usa-blue border-gray-300 rounded focus:ring-usa-blue disabled:cursor-not-allowed"
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
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm">
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
        <div className="px-8 pb-8 flex gap-4 flex-shrink-0">
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
