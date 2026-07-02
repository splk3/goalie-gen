/**
 * Platform-agnostic Team Plan DOCX document builder.
 *
 * This builder contains the canonical document assembly logic. Platform-specific
 * concerns (image loading, QR code generation) are injected as resolved data or
 * callbacks so the same builder runs unchanged in both the browser and Node.
 */
import { parseMarkdown } from "../markdownParser";
import { blocksToDocxParagraphs, cleanHexColor, makeDocxHeaderFooter } from "../docxContent";
import { buildEventCalendarMonths } from "../teamPlanCalendarGrid";
import type {
  TeamPlanConfig,
  TeamPlanContent,
  ResolvedLogoData,
  QrGenerator,
} from "../../types/generatorConfig";
import {
  extractLevel3Section,
  valueOrPlaceholder,
  normalizeUrl,
  formatDisplayDate,
  getSeasonOverviewMarkdown,
  getEventStarterMarkdown,
} from "../generatorDefaults";

type DocxModule = typeof import("docx");

// ─── Layout constants ─────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Keep each month table contiguous by forcing one calendar month per page.
const MONTH_CALENDARS_PER_PAGE = 1;
const DOCX_CONTENT_WIDTH_TWIPS = 9360;
const GAME_EVENT_LABEL_COLUMN_WIDTH_TWIPS = 1200;
const GAME_EVENT_TOTALS_COLUMN_WIDTH_TWIPS = 900;
const GAME_EVENT_TIMELINE_WIDTH_TWIPS =
  DOCX_CONTENT_WIDTH_TWIPS -
  GAME_EVENT_LABEL_COLUMN_WIDTH_TWIPS -
  GAME_EVENT_TOTALS_COLUMN_WIDTH_TWIPS;
const GAME_EVENT_PERIOD_WIDTH_TWIPS = Math.floor(GAME_EVENT_TIMELINE_WIDTH_TWIPS * 0.3);
const GAME_EVENT_OT_WIDTH_TWIPS =
  GAME_EVENT_TIMELINE_WIDTH_TWIPS - GAME_EVENT_PERIOD_WIDTH_TWIPS * 3;

/**
 * Builds a Team Plan `Document` object from the supplied configuration,
 * pre-loaded markdown content, and optional logo image / QR generator.
 *
 * The caller is responsible for:
 * - Loading markdown content from the filesystem or Webpack module imports.
 * - Resolving the logo image bytes and dimensions.
 * - Providing a `QrGenerator` callback appropriate for the runtime environment.
 * - Providing the `docx` module (either a direct import or a lazy-loaded one).
 * - Packaging the returned `Document` via `Packer.toBlob()` / `Packer.toBuffer()`.
 *
 * @param config       Team plan configuration (feature flags, colors, text fields,
 *                     pre-processed event selections).
 * @param content      Pre-loaded markdown strings for each content section.
 * @param logo         Pre-resolved logo image data, or `null` if no logo.
 * @param qrGenerator  Platform-specific QR code PNG generator callback.
 * @param docx         The `docx` module exports.
 */
export async function buildTeamPlanDocument(
  config: TeamPlanConfig,
  content: TeamPlanContent,
  logo: ResolvedLogoData | null,
  qrGenerator: QrGenerator,
  docx: DocxModule
): Promise<InstanceType<DocxModule["Document"]>> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    ExternalHyperlink,
    HeadingLevel,
    ImageRun,
    Paragraph,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
    Header,
    Footer,
    TabStopType,
    PageNumber,
  } = docx;

  const {
    teamName,
    teamWebsite,
    teamMotto,
    primaryColor,
    secondaryColor,
    ageGroup,
    skillLevel,
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
  } = config;

  const { coverMd, seasonOverviewMd, eventDetailsMd } = content;

  const cleanPrimary = cleanHexColor(primaryColor);
  const cleanSecondary = cleanHexColor(secondaryColor);
  const colorOpts = { primaryColor, secondaryColor };

  type RunOptions = Omit<ConstructorParameters<typeof TextRun>[0] & object, "text">;

  const toBlackRun = (text: string, options: RunOptions = {}) =>
    new TextRun({ text, color: "000000", ...options });

  const toPrimaryRun = (text: string, options: RunOptions = {}) =>
    new TextRun({ text, color: cleanPrimary, ...options });

  const toSecondaryRun = (text: string, options: RunOptions = {}) =>
    new TextRun({ text, color: cleanSecondary, ...options });

  // ── Game score table factory ───────────────────────────────────────────────

  const createGameEventScoreTable = () => {
    const gameEventColumnWidths = [
      GAME_EVENT_LABEL_COLUMN_WIDTH_TWIPS,
      GAME_EVENT_PERIOD_WIDTH_TWIPS,
      GAME_EVENT_PERIOD_WIDTH_TWIPS,
      GAME_EVENT_PERIOD_WIDTH_TWIPS,
      GAME_EVENT_OT_WIDTH_TWIPS,
      GAME_EVENT_TOTALS_COLUMN_WIDTH_TWIPS,
    ];
    const periodLabels = ["1st", "2nd", "3rd", "OT", "Totals"];

    const borderCell = (
      children: InstanceType<typeof Paragraph>[],
      options?: { showBottomBorder?: boolean; showRightBorder?: boolean }
    ) => ({
      children,
      verticalAlign: VerticalAlign.TOP,
      borders: {
        left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
        right:
          options?.showRightBorder === false
            ? { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
            : { style: BorderStyle.SINGLE, size: 8, color: "000000" },
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: options?.showBottomBorder
          ? { style: BorderStyle.SINGLE, size: 8, color: "000000" }
          : { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
    });

    return new Table({
      width: { size: DOCX_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: gameEventColumnWidths,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: GAME_EVENT_LABEL_COLUMN_WIDTH_TWIPS, type: WidthType.DXA },
              borders: {
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              children: [new Paragraph({ children: [toBlackRun("")] })],
            }),
            ...periodLabels.map(
              (label, index) =>
                new TableCell({
                  width: { size: gameEventColumnWidths[index + 1], type: WidthType.DXA },
                  ...borderCell(
                    [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                        children: [toBlackRun(label, { bold: true })],
                      }),
                    ],
                    {
                      showBottomBorder: false,
                      showRightBorder: label !== "Totals",
                    }
                  ),
                })
            ),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: GAME_EVENT_LABEL_COLUMN_WIDTH_TWIPS, type: WidthType.DXA },
              borders: {
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
              },
              children: [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [toBlackRun("Goals")],
                }),
              ],
            }),
            ...periodLabels.map(
              (label, index) =>
                new TableCell({
                  width: { size: gameEventColumnWidths[index + 1], type: WidthType.DXA },
                  ...borderCell([new Paragraph({ children: [toBlackRun("")] })], {
                    showBottomBorder: true,
                    showRightBorder: label !== "Totals",
                  }),
                })
            ),
          ],
        }),
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: GAME_EVENT_LABEL_COLUMN_WIDTH_TWIPS, type: WidthType.DXA },
              borders: {
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              children: [new Paragraph({ children: [toBlackRun("Shots")] })],
            }),
            ...periodLabels.map(
              (label, index) =>
                new TableCell({
                  width: { size: gameEventColumnWidths[index + 1], type: WidthType.DXA },
                  ...borderCell(
                    [
                      new Paragraph({
                        spacing: { after: 1400 },
                        children: [toBlackRun("")],
                      }),
                    ],
                    {
                      showRightBorder: label !== "Totals",
                    }
                  ),
                })
            ),
          ],
        }),
      ],
    });
  };

  // ── QR resource link helper ────────────────────────────────────────────────

  const documentChildren: (
    | InstanceType<typeof Paragraph>
    | InstanceType<typeof Table>
  )[] = [];

  const addResourceLinkWithQr = async (
    linesBeforeUrl: string,
    rawUrl: string,
    qrSize = 84,
    inline = false
  ): Promise<void> => {
    const normalizedLink = normalizeUrl(rawUrl);
    if (!normalizedLink) {
      return;
    }

    const qrData = await qrGenerator(normalizedLink);

    if (inline && qrData) {
      documentChildren.push(
        new Paragraph({
          children: [
            toBlackRun(linesBeforeUrl),
            new ExternalHyperlink({
              link: normalizedLink,
              children: [toPrimaryRun(normalizedLink, { underline: { type: "single" } })],
            }),
            toBlackRun(" "),
            new ImageRun({
              type: "png",
              data: qrData,
              transformation: { width: qrSize, height: qrSize },
            }),
          ],
          spacing: { after: 200 },
        })
      );
    } else {
      documentChildren.push(
        new Paragraph({
          children: [
            toBlackRun(linesBeforeUrl),
            new ExternalHyperlink({
              link: normalizedLink,
              children: [toPrimaryRun(normalizedLink, { underline: { type: "single" } })],
            }),
          ],
          spacing: { after: 120 },
        })
      );

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
    }
  };

  // ── Cover page ─────────────────────────────────────────────────────────────

  const planTitleSection = extractLevel3Section(coverMd, "Plan Title") || "[PLAN_TITLE]";
  const coverTitle = planTitleSection.replace(
    /\[PLAN_TITLE\]/g,
    "Team-Level Goaltending Development Plan"
  );

  documentChildren.push(
    new Paragraph({
      children: [toPrimaryRun(coverTitle, { bold: true })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [toPrimaryRun(teamName, { bold: true })],
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Cover page: logo image
  if (logo) {
    documentChildren.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: logo.type,
            data: logo.data,
            transformation: { width: logo.width, height: logo.height },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Cover page: website hyperlink
  const normalizedWebsiteUrl = normalizeUrl(teamWebsite);
  if (normalizedWebsiteUrl) {
    documentChildren.push(
      new Paragraph({
        children: [
          new ExternalHyperlink({
            link: normalizedWebsiteUrl,
            children: [toPrimaryRun(teamWebsite.trim(), { underline: { type: "single" } })],
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }

  // Cover page: motto
  if (teamMotto.trim()) {
    documentChildren.push(
      new Paragraph({
        children: [toSecondaryRun(teamMotto.trim(), { italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }

  // ── Plan details page ──────────────────────────────────────────────────────

  documentChildren.push(new Paragraph({ children: [toBlackRun("")], pageBreakBefore: true }));

  documentChildren.push(
    new Paragraph({
      children: [toPrimaryRun("Team-Level Goaltending Development Plan", { bold: true })],
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

  // Season Overview section
  documentChildren.push(
    ...blocksToDocxParagraphs(
      parseMarkdown(
        getSeasonOverviewMarkdown(includeStarterIntroductionAndGoals, ageGroup, seasonOverviewMd)
      ),
      colorOpts
    )
  );

  // Goalie Mentor section (optional)
  if (hasGoalieMentors) {
    documentChildren.push(
      ...blocksToDocxParagraphs(
        parseMarkdown(`## Goalie Mentor Information

- Mentor Name: [GOALIE_MENTOR_NAME]
- Mentor Team: [GOALIE_MENTOR_TEAM]
- Mentor Role: [GOALIE_MENTOR_ROLE]
- Mentor Contact Information: [GOALIE_MENTOR_CONTACT_INFORMATION]
- Mentor Meeting Cadence: [GOALIE_MENTOR_MEETING_CADENCE]`),
        colorOpts
      )
    );
  }

  // Goalie Evaluations section (optional)
  if (hasGoalieEvaluations) {
    const evaluationsCount = parseInt(goalieEvaluationTimes, 10);
    documentChildren.push(
      new Paragraph({
        children: [toPrimaryRun("Goalie Evaluations", { bold: true })],
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

  // ── Calendar section ───────────────────────────────────────────────────────

  if (addCalendarOfEvents && eventSelections.length > 0) {
    documentChildren.push(
      new Paragraph({
        children: [toPrimaryRun("Team Calendar", { bold: true })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (includeCalendarView) {
      const calendarMonths = buildEventCalendarMonths(sortedEventDates);

      documentChildren.push(
        new Paragraph({
          children: [toPrimaryRun("Calendar View", { bold: true })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      calendarMonths.forEach((month, monthIndex) => {
        const startsNewCalendarPage =
          monthIndex > 0 && monthIndex % MONTH_CALENDARS_PER_PAGE === 0;
        documentChildren.push(
          new Paragraph({
            children: [toPrimaryRun(month.monthLabel, { bold: true })],
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
              (weekday, index) =>
                new TableCell({
                  width: { size: index === 6 ? 1338 : 1337, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { fill: "EDEDED" },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 60 },
                      children: [toSecondaryRun(weekday, { bold: true })],
                    }),
                  ],
                })
            ),
          }),
          ...month.weeks.map(
            (week) =>
              new TableRow({
                cantSplit: true,
                children: week.map((cell, index) => {
                  const dateLabel = cell.dayOfMonth ? `${cell.dayOfMonth}` : "";
                  const eventTypeLabel = cell.hasEvents ? cell.eventTypes.join(", ") : "";
                  return new TableCell({
                    width: { size: index === 6 ? 1338 : 1337, type: WidthType.DXA },
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
            width: { size: 9360, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            columnWidths: [1337, 1337, 1337, 1337, 1337, 1337, 1338],
            rows: tableRows,
          })
        );
        documentChildren.push(
          new Paragraph({ children: [toBlackRun("")], spacing: { after: 120 } })
        );
      });
    }

    // Event Details section
    if (includeEventDetails) {
      documentChildren.push(
        new Paragraph({
          children: [toPrimaryRun("Event Details", { bold: true })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      for (const event of detailedEventSelections) {
        documentChildren.push(
          new Paragraph({
            children: [
              toBlackRun(`${formatDisplayDate(event.date)} (${event.eventType})`),
            ],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 250, after: 120 },
          })
        );

        documentChildren.push(
          ...blocksToDocxParagraphs(
            parseMarkdown(getEventStarterMarkdown(event.eventType, eventDetailsMd)),
            colorOpts
          )
        );

        if (event.eventType === "On-ice Practice" && addSuggestedDrillEachPractice) {
          await addResourceLinkWithQr(
            "Suggested goalie drills page: ",
            "https://goaliegen.com/goalie-drills/",
            60,
            true
          );
        }

        if (event.eventType === "Game") {
          documentChildren.push(
            new Paragraph({
              children: [toBlackRun("Game Timeline", { bold: true })],
              pageBreakBefore: true,
              spacing: { before: 120, after: 80 },
            })
          );
          documentChildren.push(createGameEventScoreTable());
          documentChildren.push(
            new Paragraph({
              children: [toBlackRun("")],
              spacing: { after: 160 },
            })
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

  // ── Assemble Document ──────────────────────────────────────────────────────

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: {
              width: 12240, // 8.5 inches in twips (8.5 * 1440)
              height: 15840, // 11 inches in twips (11 * 1440)
            },
            margin: {
              top: 1440, // 1 inch in twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        ...makeDocxHeaderFooter(
          `${valueOrPlaceholder(teamName, "TEAM_NAME").toUpperCase()} GOALTENDING DEVELOPMENT PLAN`,
          cleanPrimary,
          cleanSecondary,
          {
            Header,
            Footer,
            BorderStyle,
            TabStopType,
            PageNumber,
            Paragraph,
            TextRun,
            AlignmentType,
          }
        ),
        children: documentChildren,
      },
    ],
  });
}
