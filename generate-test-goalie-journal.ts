import * as fs from "fs";
import * as path from "path";
import * as jsPdfModule from "jspdf";
import * as qrCode from "qrcode";
import {
  DEFAULT_JOURNAL_ENTRY_COUNT,
  MAX_JOURNAL_ENTRY_COUNT,
  MIN_JOURNAL_ENTRY_COUNT,
  getDefaultJournalSeason,
  normalizeJournalSeason,
  parseJournalEntryCount,
} from "./src/utils/generatorDefaults";
import { DEFAULT_PRIMARY_TEAM_COLOR, DEFAULT_SECONDARY_TEAM_COLOR } from "./src/utils/teamColors";
import { buildGoalieJournalPdf } from "./src/utils/builders/goalieJournalBuilder";
import { GOALIE_JOURNAL_PROMOTION_URL } from "./src/utils/goalieJournalPromotion";
import { getImageDimensions } from "./generate-utils";
import type {
  GoalieJournalConfig,
  GoalieJournalContent,
  JournalLogoData,
} from "./src/types/generatorConfig";

function loadJournalImage(imagePath: string, label: string): JournalLogoData | null {
  if (!imagePath) {
    return null;
  }
  if (!fs.existsSync(imagePath)) {
    console.warn(`Warning: ${label} file not found at: ${imagePath}`);
    return null;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const dimensions = getImageDimensions(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return {
    dataUrl: `data:${mimeType};base64,${imageBuffer.toString("base64")}`,
    width: dimensions?.width ?? 60,
    height: dimensions?.height ?? 60,
  };
}

async function run() {
  const args = process.argv.slice(2);
  let goalieName = "Test Goalie";
  let teamName = "Test Team";
  let primaryColor = DEFAULT_PRIMARY_TEAM_COLOR;
  let secondaryColor = DEFAULT_SECONDARY_TEAM_COLOR;
  let logoPath = "";
  let goaliePhotoPath = "";
  let outputPath = "test-goalie-journal.pdf";
  let season = getDefaultJournalSeason();
  let entryCount = DEFAULT_JOURNAL_ENTRY_COUNT;
  let writeInGoalieName = false;
  let writeInTeamName = false;
  let writeInSeason = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      goalieName = args[i + 1];
      i++;
    } else if (args[i] === "--team" && args[i + 1]) {
      teamName = args[i + 1];
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
    } else if (args[i] === "--goalie-photo" && args[i + 1]) {
      goaliePhotoPath = args[i + 1];
      i++;
    } else if (args[i] === "--out" && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === "--season") {
      const seasonArgument = args[i + 1];
      const parsedSeason =
        seasonArgument && !seasonArgument.startsWith("--")
          ? normalizeJournalSeason(seasonArgument)
          : null;
      if (!parsedSeason) {
        throw new Error("--season must be a non-empty string");
      }
      season = parsedSeason;
      i++;
    } else if (args[i] === "--entries") {
      const parsedEntryCount = parseJournalEntryCount(args[i + 1] ?? "");
      if (parsedEntryCount === null) {
        throw new Error(
          `--entries must be a whole number between ${MIN_JOURNAL_ENTRY_COUNT} and ${MAX_JOURNAL_ENTRY_COUNT}`
        );
      }
      entryCount = parsedEntryCount;
      i++;
    } else if (args[i] === "--write-in-goalie-name") {
      writeInGoalieName = true;
    } else if (args[i] === "--write-in-team-name") {
      writeInTeamName = true;
    } else if (args[i] === "--write-in-season") {
      writeInSeason = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: tsx generate-test-goalie-journal.ts [options]

Options:
  --name <string>      Goalie Name (default: "Test Goalie")
  --team <string>      Team Name (default: "Test Team")
  --primary <hex>      Primary Color (default: "${DEFAULT_PRIMARY_TEAM_COLOR}")
  --secondary <hex>    Secondary Color (default: "${DEFAULT_SECONDARY_TEAM_COLOR}")
  --logo <path>        Path to logo image file (optional, PNG/JPEG)
  --goalie-photo <path> Path to goalie photo (optional, PNG/JPEG)
  --out <path>         Path to output .pdf file (default: "test-goalie-journal.pdf")
  --season <string>    Season label (default: "${getDefaultJournalSeason()}")
  --entries <number>   Number of journal entries (default: ${DEFAULT_JOURNAL_ENTRY_COUNT})
  --write-in-goalie-name  Render a printable Goalie Name field
  --write-in-team-name    Render a printable Team Name field
  --write-in-season       Render a printable Season field
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

  console.log("Generating test goalie journal with options:");
  console.log(`  Goalie Name: ${goalieName}`);
  console.log(`  Team Name:   ${teamName}`);
  console.log(`  Colors:      Primary: ${primaryColor}, Secondary: ${secondaryColor}`);
  console.log(`  Logo:        ${logoPath || "None"}`);
  console.log(`  Goalie Photo: ${goaliePhotoPath || "None"}`);
  console.log(`  Season:      ${season}`);
  console.log(`  Entries:     ${entryCount}`);
  console.log(
    `  Write-ins:   Goalie Name: ${writeInGoalieName}, Team Name: ${writeInTeamName}, Season: ${writeInSeason}`
  );
  console.log(`  Output:      ${outputPath}\n`);

  // Load markdown content from the filesystem
  const contentDir = path.join(__dirname, "src/content/goalie-journal");
  const journalContent: GoalieJournalContent = {
    coverMd: fs.readFileSync(path.join(contentDir, "cover.md"), "utf8"),
    acknowledgementsMd: fs.readFileSync(path.join(contentDir, "acknowledgements.md"), "utf8"),
    howToUseMd: fs.readFileSync(path.join(contentDir, "how-to-use.md"), "utf8"),
    howToImproveEveryDayMd: fs.readFileSync(
      path.join(contentDir, "how-to-improve-every-day.md"),
      "utf8"
    ),
    seasonGoalsMd: fs.readFileSync(path.join(contentDir, "season-goals.md"), "utf8"),
    practiceEntryMd: fs.readFileSync(path.join(contentDir, "practice-entry.md"), "utf8"),
    endOfSeasonMd: fs.readFileSync(path.join(contentDir, "end-of-season.md"), "utf8"),
  };

  const logoData = loadJournalImage(logoPath, "Logo");
  const goaliePhotoData = loadJournalImage(goaliePhotoPath, "Goalie photo");

  const footerLogoPath = path.join(__dirname, "static/images/logos/logo-alt-light.png");
  let footerLogoData: JournalLogoData | null = null;
  if (fs.existsSync(footerLogoPath)) {
    const footerLogoBuffer = fs.readFileSync(footerLogoPath);
    const dimensions = getImageDimensions(footerLogoPath);
    footerLogoData = {
      dataUrl: `data:image/png;base64,${footerLogoBuffer.toString("base64")}`,
      width: dimensions?.width ?? 60,
      height: dimensions?.height ?? 60,
    };
  }

  const config: GoalieJournalConfig = {
    goalieName: writeInGoalieName ? "" : goalieName,
    teamName: writeInTeamName ? "" : teamName,
    primaryColor,
    secondaryColor,
    season: writeInSeason ? "" : season,
    entryCount,
    writeInGoalieName,
    writeInTeamName,
    writeInSeason,
  };

  const qrCodeDataUrl = await qrCode.toDataURL(GOALIE_JOURNAL_PROMOTION_URL, {
    margin: 1,
    width: 160,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  const doc = buildGoalieJournalPdf(
    config,
    journalContent,
    logoData,
    jsPdfModule,
    qrCodeDataUrl,
    footerLogoData,
    goaliePhotoData
  );
  const arrayBuffer = doc.output("arraybuffer");
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  console.log(`\u2713 Generated goalie journal successfully at: ${outputPath}`);
}

run().catch((err) => {
  console.error("Fatal error generating goalie journal:", err);
  throw err instanceof Error ? err : new Error(String(err));
});
