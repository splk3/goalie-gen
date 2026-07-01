import * as fs from "fs";
import * as path from "path";
import * as qrCode from "qrcode";
import {
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
  Header,
  Footer,
  BorderStyle,
  TabStopType,
  PageNumber,
} from "docx";
import { parseMarkdown } from "./src/utils/markdownParser";
import {
  blocksToDocxParagraphs,
  cleanHexColor,
  makeDocxHeaderFooter,
} from "./src/utils/docxContent";
import { buildEventCalendarMonths } from "./src/utils/teamPlanCalendarGrid";

type EventType =
  | "On-ice Practice"
  | "Off-ice Practice"
  | "Video Review"
  | "Evaluation"
  | "Game"
  | "TBD";

interface EventDateSelection {
  date: string;
  eventTypes: EventType[];
}

interface EventSelection {
  date: string;
  eventType: EventType;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

// Simple dimension parser for PNG and JPEG
function getImageDimensions(filePath: string): { width: number; height: number } | null {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.readUInt32BE(0) === 0x89504e47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    if (buffer.readUInt16BE(0) === 0xffd8) {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        if (marker === 0xffc0 || marker === 0xffc2) {
          const _length = buffer.readUInt16BE(offset);
          const height = buffer.readUInt16BE(offset + 3);
          const width = buffer.readUInt16BE(offset + 5);
          return { width, height };
        } else {
          const length = buffer.readUInt16BE(offset);
          offset += length;
        }
      }
    }
  } catch (e) {
    console.error("Error reading image dimensions:", e);
  }
  return null;
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

function getSeasonOverviewMarkdown(
  includeStarter: boolean,
  selectedAgeGroup: string,
  seasonOverviewMd: string
): string {
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

function getEventStarterMarkdown(eventType: EventType, eventDetailsMd: string): string {
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

async function run() {
  const args = process.argv.slice(2);
  let teamName = "Test Team";
  let teamWebsite = "www.testteam.com";
  let teamMotto = "Strive for excellence!";
  let primaryColor = "#00205B";
  let secondaryColor = "#AF272F";
  let logoPath = "";
  let outputPath = "test-team-plan.docx";
  let ageGroup = "12u";
  let skillLevel = "intermediate";
  let enableAll = true;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      teamName = args[i + 1];
      i++;
    } else if (args[i] === "--website" && args[i + 1]) {
      teamWebsite = args[i + 1];
      i++;
    } else if (args[i] === "--motto" && args[i + 1]) {
      teamMotto = args[i + 1];
      i++;
    } else if (args[i] === "--primary" && args[i + 1]) {
      primaryColor = args[i + 1];
      i++;
    } else if (args[i] === "--secondary" && args[i + 1]) {
      secondaryColor = args[i + 1];
      i++;
    } else if (args[i] === "--logo" && args[i + 1]) {
      logoPath = args[i + 1];
      i++;
    } else if (args[i] === "--out" && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === "--age" && args[i + 1]) {
      ageGroup = args[i + 1].toLowerCase();
      i++;
    } else if (args[i] === "--skill" && args[i + 1]) {
      skillLevel = args[i + 1].toLowerCase();
      i++;
    } else if (args[i] === "--none") {
      enableAll = false;
    } else if (args[i] === "--all") {
      enableAll = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: tsx generate-test-team-plan.ts [options]

Options:
  --name <string>      Team Name (default: "Test Team")
  --website <string>   Team Website (default: "www.testteam.com")
  --motto <string>     Team Motto (default: "Strive for excellence!")
  --primary <hex>      Primary Color (default: "#00205B")
  --secondary <hex>    Secondary Color (default: "#AF272F")
  --logo <path>        Path to logo image file (optional)
  --out <path>         Path to output .docx file (default: "test-team-plan.docx")
  --age <string>       Age Group (8u, 10u, 12u, 14u+, default: "12u")
  --skill <string>     Skill Level (beginner, intermediate, advanced, default: "intermediate")
  --all                Enable all optional sections and features (default)
  --none               Disable all optional sections and features
      `);
      process.exit(0);
    }
  }

  // Resolve output path to be in test-docs if it's a simple filename or relative path
  if (!outputPath.includes("/") && !outputPath.includes("\\")) {
    outputPath = path.join("test-docs", outputPath);
  }

  // Ensure the output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Generating test team plan with options:");
  console.log(`  Team Name:   ${teamName}`);
  console.log(`  Website:     ${teamWebsite}`);
  console.log(`  Motto:       ${teamMotto}`);
  console.log(`  Colors:      Primary: ${primaryColor}, Secondary: ${secondaryColor}`);
  console.log(`  Age Group:   ${ageGroup}`);
  console.log(`  Skill Level: ${skillLevel}`);
  console.log(`  Logo:        ${logoPath || "None"}`);
  console.log(`  Output:      ${outputPath}`);
  console.log(`  Features:    ${enableAll ? "All enabled" : "Minimal/none"}\n`);

  // Paths to content markdown files
  const contentDir = path.join(__dirname, "src/content/team-plan");
  const coverMd = fs.readFileSync(path.join(contentDir, "cover.md"), "utf8");
  const seasonOverviewMd = fs.readFileSync(path.join(contentDir, "season-overview.md"), "utf8");
  const eventDetailsMd = fs.readFileSync(path.join(contentDir, "event-details.md"), "utf8");

  // Replicate configurations
  const hasGoalieMentors = enableAll;
  const hasGoalieEvaluations = enableAll;
  const goalieEvaluationTimes = "3";
  const addCalendarOfEvents = enableAll;
  const includeCalendarView = enableAll;
  const includeEventDetails = enableAll;
  const addSuggestedDrillEachPractice = enableAll;
  const includeStarterIntroductionAndGoals = true;

  const detailedEntryEventTypes: Record<EventType, boolean> = {
    "On-ice Practice": true,
    "Off-ice Practice": true,
    "Video Review": true,
    Evaluation: true,
    Game: true,
    TBD: false,
  };

  // Mock schedule dates for Delaware Stars/RAPTORS/Outlaws (e.g. July 2026)
  const selectedEventDates: EventDateSelection[] = enableAll
    ? [
        { date: "2026-07-06", eventTypes: ["On-ice Practice"] },
        { date: "2026-07-08", eventTypes: ["Video Review"] },
        { date: "2026-07-11", eventTypes: ["Game"] },
        { date: "2026-07-13", eventTypes: ["On-ice Practice"] },
        { date: "2026-07-15", eventTypes: ["Evaluation"] },
        { date: "2026-07-18", eventTypes: ["Game"] },
      ]
    : [];

  const sortedEventDates = [...selectedEventDates].sort((a, b) => a.date.localeCompare(b.date));
  const eventSelections = sortedEventDates.flatMap<EventSelection>((eventDate) =>
    eventDate.eventTypes.map((eventType) => ({ date: eventDate.date, eventType }))
  );
  const detailedEventSelections = eventSelections.filter(
    (event) => detailedEntryEventTypes[event.eventType]
  );

  const cleanPrimary = cleanHexColor(primaryColor);
  const cleanSecondary = cleanHexColor(secondaryColor);
  const colorOpts = { primaryColor, secondaryColor };

  const toBlackRun = (text: string, options: any = {}) =>
    new TextRun({ text, color: "000000", ...options });

  const toPrimaryRun = (text: string, options: any = {}) =>
    new TextRun({ text, color: cleanPrimary, ...options });

  const toSecondaryRun = (text: string, options: any = {}) =>
    new TextRun({ text, color: cleanSecondary, ...options });

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
      children: any[],
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

  const documentChildren: any[] = [];

  const addResourceLinkWithQr = async (
    linesBeforeUrl: string,
    rawUrl: string,
    qrSize = 84,
    inline = false
  ): Promise<void> => {
    const normalizedUrl = normalizeUrl(rawUrl);
    if (!normalizedUrl) {
      return;
    }

    let qrData: Buffer | null = null;
    try {
      qrData = await qrCode.toBuffer(normalizedUrl, {
        margin: 1,
        width: 200,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
    } catch (error) {
      console.error("Failed to generate QR code", error);
    }

    if (inline && qrData) {
      documentChildren.push(
        new Paragraph({
          children: [
            toBlackRun(linesBeforeUrl),
            new ExternalHyperlink({
              link: normalizedUrl,
              children: [toPrimaryRun(normalizedUrl, { underline: { type: "single" } })],
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
              link: normalizedUrl,
              children: [toPrimaryRun(normalizedUrl, { underline: { type: "single" } })],
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

  let arrayBuffer: Buffer | null = null;
  let imageDimensions: { width: number; height: number } | null = null;
  if (logoPath) {
    if (fs.existsSync(logoPath)) {
      arrayBuffer = fs.readFileSync(logoPath);
      imageDimensions = getImageDimensions(logoPath);
    } else {
      console.warn(`Warning: Logo file not found at: ${logoPath}`);
    }
  }

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

  if (arrayBuffer && logoPath) {
    const ext = path.extname(logoPath).toLowerCase();
    let docxImageType: "jpg" | "png" | "gif" | "bmp" = "png";
    if (ext === ".jpg" || ext === ".jpeg") {
      docxImageType = "jpg";
    } else if (ext === ".gif") {
      docxImageType = "gif";
    } else if (ext === ".bmp") {
      docxImageType = "bmp";
    }

    let imgWidth = 400;
    let imgHeight = 400;

    if (imageDimensions) {
      const ratio = imageDimensions.width / imageDimensions.height;
      if (ratio > 1) {
        imgWidth = 400;
        imgHeight = 400 / ratio;
      } else {
        imgHeight = 400;
        imgWidth = 400 * ratio;
      }
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
            children: [toPrimaryRun(teamWebsite.trim(), { underline: { type: "single" } })],
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
        children: [toSecondaryRun(teamMotto.trim(), { italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }

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

  documentChildren.push(
    ...blocksToDocxParagraphs(
      parseMarkdown(
        getSeasonOverviewMarkdown(includeStarterIntroductionAndGoals, ageGroup, seasonOverviewMd)
      ),
      colorOpts
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
- Mentor Meeting Cadence: [GOALIE_MENTOR_MEETING_CADENCE]`),
        colorOpts
      )
    );
  }

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
        const startsNewCalendarPage = monthIndex > 0 && monthIndex % MONTH_CALENDARS_PER_PAGE === 0;
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
            children: [toBlackRun(`${event.date} (${event.eventType})`)],
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

  const doc = new Document({
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

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated team plan successfully at: ${outputPath}`);
}

run().catch((err) => {
  console.error("Fatal error generating team plan:", err);
  process.exit(1);
});
