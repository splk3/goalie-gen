import * as fs from "fs";
import * as path from "path";
import * as jsPdfModule from "jspdf";
import * as qrCode from "qrcode";
import { DEFAULT_JOURNAL_ENTRY_COUNT } from "./src/utils/generatorDefaults";
import { DEFAULT_PRIMARY_TEAM_COLOR, DEFAULT_SECONDARY_TEAM_COLOR } from "./src/utils/teamColors";
import { buildGoalieJournalPdf } from "./src/utils/builders/goalieJournalBuilder";
import { GOALIE_JOURNAL_PROMOTION_URL } from "./src/utils/goalieJournalPromotion";
import { getImageDimensions } from "./generate-utils";
import type {
  GoalieJournalConfig,
  GoalieJournalContent,
  JournalLogoData,
} from "./src/types/generatorConfig";

async function run() {
  const args = process.argv.slice(2);
  let goalieName = "Test Goalie";
  let teamName = "Test Team";
  let primaryColor = DEFAULT_PRIMARY_TEAM_COLOR;
  let secondaryColor = DEFAULT_SECONDARY_TEAM_COLOR;
  let logoPath = "";
  let outputPath = "test-goalie-journal.pdf";
  let entryCount = DEFAULT_JOURNAL_ENTRY_COUNT;

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
    } else if (args[i] === "--out" && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === "--entries" && args[i + 1]) {
      const parsed = parseInt(args[i + 1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        entryCount = parsed;
      }
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: tsx generate-test-goalie-journal.ts [options]

Options:
  --name <string>      Goalie Name (default: "Test Goalie")
  --team <string>      Team Name (default: "Test Team")
 --primary <hex>      Primary Color (default: "${DEFAULT_PRIMARY_TEAM_COLOR}")
 --secondary <hex>    Secondary Color (default: "${DEFAULT_SECONDARY_TEAM_COLOR}")
 --logo <path>        Path to logo image file (optional, PNG/JPEG)
  --out <path>         Path to output .pdf file (default: "test-goalie-journal.pdf")
  --entries <number>   Number of journal entries (default: ${DEFAULT_JOURNAL_ENTRY_COUNT})
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
  console.log(`  Entries:     ${entryCount}`);
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

  // Resolve logo to a base64 data URL (jsPDF's addImage accepts data URLs)
  let logoData: JournalLogoData | null = null;
  if (logoPath) {
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const dimensions = getImageDimensions(logoPath);
      const base64 = logoBuffer.toString("base64");
      const ext = path.extname(logoPath).toLowerCase();
      const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
      const dataUrl = `data:${mimeType};base64,${base64}`;
      logoData = {
        dataUrl,
        width: dimensions?.width ?? 60,
        height: dimensions?.height ?? 60,
      };
    } else {
      console.warn(`Warning: Logo file not found at: ${logoPath}`);
    }
  }

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

  const currentYear = new Date().getFullYear();
  const season = `${currentYear}-${currentYear + 1}`;

  const config: GoalieJournalConfig = {
    goalieName,
    teamName,
    primaryColor,
    secondaryColor,
    season,
    entryCount,
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
    footerLogoData
  );
  const arrayBuffer = doc.output("arraybuffer");
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  console.log(`\u2713 Generated goalie journal successfully at: ${outputPath}`);
}

run().catch((err) => {
  console.error("Fatal error generating goalie journal:", err);
  throw err instanceof Error ? err : new Error(String(err));
});
