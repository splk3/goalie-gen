import * as fs from "fs";
import * as path from "path";
import * as qrCode from "qrcode";
import * as docx from "docx";
import { toDocxImageTypeFromExtension } from "./src/utils/docxImageType";
import { normalizeUrl } from "./src/utils/generatorDefaults";
import { getImageDimensions } from "./generate-utils";
import { buildTeamPlanDocument } from "./src/utils/builders/teamPlanBuilder";
import type {
  TeamPlanConfig,
  TeamPlanContent,
  ResolvedLogoData,
  EventDateSelection,
  EventSelection,
  QrGenerator,
} from "./src/types/generatorConfig";

// Node-native QR generator (satisfies QrGenerator callback type)
const nodeQrGenerator: QrGenerator = async (url: string): Promise<Uint8Array | null> => {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    return null;
  }
  try {
    const buffer = await qrCode.toBuffer(normalized, {
      margin: 1,
      width: 200,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } catch (error) {
    console.error("Failed to generate QR code", error);
    return null;
  }
};

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
      return;
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

  // Load markdown content from the filesystem
  const contentDir = path.join(__dirname, "src/content/team-plan");
  const content: TeamPlanContent = {
    coverMd: fs.readFileSync(path.join(contentDir, "cover.md"), "utf8"),
    seasonOverviewMd: fs.readFileSync(path.join(contentDir, "season-overview.md"), "utf8"),
    eventDetailsMd: fs.readFileSync(path.join(contentDir, "event-details.md"), "utf8"),
  };

  // Resolve logo image
  let resolvedLogo: ResolvedLogoData | null = null;
  if (logoPath) {
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const rawDimensions = getImageDimensions(logoPath);
      const ext = path.extname(logoPath).toLowerCase().replace(".", "");
      const docxImageType = toDocxImageTypeFromExtension(ext);

      let imgWidth = 400;
      let imgHeight = 400;
      if (rawDimensions) {
        const ratio = rawDimensions.width / rawDimensions.height;
        if (ratio > 1) {
          imgWidth = 400;
          imgHeight = 400 / ratio;
        } else {
          imgHeight = 400;
          imgWidth = 400 * ratio;
        }
      }

      resolvedLogo = {
        data: logoBuffer.buffer.slice(
          logoBuffer.byteOffset,
          logoBuffer.byteOffset + logoBuffer.byteLength
        ),
        type: docxImageType,
        width: imgWidth,
        height: imgHeight,
      };
    } else {
      console.warn(`Warning: Logo file not found at: ${logoPath}`);
    }
  }

  // Build mock schedule dates for testing (e.g. July 2026)
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

  const detailedEntryEventTypes: Record<string, boolean> = {
    "On-ice Practice": true,
    "Off-ice Practice": true,
    "Video Review": true,
    Evaluation: true,
    Game: true,
    TBD: false,
  };

  const sortedEventDates = [...selectedEventDates].sort((a, b) => a.date.localeCompare(b.date));
  const eventSelections = sortedEventDates.flatMap<EventSelection>((eventDate) =>
    eventDate.eventTypes.map((eventType) => ({ date: eventDate.date, eventType }))
  );
  const detailedEventSelections = eventSelections.filter(
    (event) => detailedEntryEventTypes[event.eventType]
  );

  // Build config
  const config: TeamPlanConfig = {
    teamName,
    teamWebsite,
    teamMotto,
    primaryColor,
    secondaryColor,
    ageGroup,
    skillLevel,
    hasGoalieMentors: enableAll,
    hasGoalieEvaluations: enableAll,
    goalieEvaluationTimes: "3",
    includeStarterIntroductionAndGoals: true,
    addCalendarOfEvents: enableAll,
    includeCalendarView: enableAll,
    includeEventDetails: enableAll,
    addSuggestedDrillEachPractice: enableAll,
    sortedEventDates,
    eventSelections,
    detailedEventSelections,
  };

  const document = await buildTeamPlanDocument(config, content, resolvedLogo, nodeQrGenerator, docx);
  const buffer = await docx.Packer.toBuffer(document);
  fs.writeFileSync(outputPath, buffer);
  console.log(`\u2713 Generated team plan successfully at: ${outputPath}`);
}

run().catch((err) => {
  console.error("Fatal error generating team plan:", err);
  throw err instanceof Error ? err : new Error(String(err));
});
