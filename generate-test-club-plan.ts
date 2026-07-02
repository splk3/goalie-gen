import * as fs from "fs";
import * as path from "path";
import * as docx from "docx";
import { toDocxImageTypeFromExtension } from "./src/utils/docxImageType";
import {
  DEFAULT_PROVIDED_EQUIPMENT_AGE_GROUPS,
  DEFAULT_TRAINING_FREQUENCY,
  DEFAULT_TRAINING_SESSION_LENGTH,
  DEFAULT_TRAINING_WITH_WHOM,
  DEFAULT_TRAINING_STARTING_AGE,
  DEFAULT_VIDEO_SESSION_FREQUENCY,
  DEFAULT_VIDEO_SESSION_LENGTH,
  DEFAULT_EVALUATION_WHEN,
  DEFAULT_GOALIE_DISCOUNT,
} from "./src/utils/generatorDefaults";
import { buildClubPlanDocument } from "./src/utils/builders/clubPlanBuilder";
import type { ClubPlanConfig, ClubPlanContent, ResolvedLogoData } from "./src/types/generatorConfig";

import { getImageDimensions } from "./generate-utils";

async function run() {
  const args = process.argv.slice(2);
  let clubName = "Test Club";
  let clubWebsite = "www.testclub.com";
  let clubMotto = "Developing great goalies!";
  let primaryColor = "#00205B";
  let secondaryColor = "#AF272F";
  let logoPath = "";
  let outputPath = "test-club-plan.docx";
  let enableAll = true;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      clubName = args[i + 1];
      i++;
    } else if (args[i] === "--website" && args[i + 1]) {
      clubWebsite = args[i + 1];
      i++;
    } else if (args[i] === "--motto" && args[i + 1]) {
      clubMotto = args[i + 1];
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
    } else if (args[i] === "--none") {
      enableAll = false;
    } else if (args[i] === "--all") {
      enableAll = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: tsx generate-test-club-plan.ts [options]

Options:
  --name <string>      Club Name (default: "Test Club")
  --website <string>   Club Website (default: "www.testclub.com")
  --motto <string>     Club Motto (default: "Developing great goalies!")
  --primary <hex>      Primary Color (default: "#00205B")
  --secondary <hex>    Secondary Color (default: "#AF272F")
  --logo <path>        Path to logo image file (optional)
  --out <path>         Path to output .docx file (default: "test-club-plan.docx")
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

  console.log("Generating test club plan with options:");
  console.log(`  Club Name: ${clubName}`);
  console.log(`  Website:   ${clubWebsite}`);
  console.log(`  Motto:     ${clubMotto}`);
  console.log(`  Colors:    Primary: ${primaryColor}, Secondary: ${secondaryColor}`);
  console.log(`  Logo:      ${logoPath || "None"}`);
  console.log(`  Output:    ${outputPath}`);
  console.log(`  Features:  ${enableAll ? "All enabled" : "Minimal/none"}\n`);

  // Load markdown content from the filesystem
  const contentDir = path.join(__dirname, "src/content/club-plan");
  const content: ClubPlanContent = {
    introductionMd: fs.readFileSync(path.join(contentDir, "introduction.md"), "utf8"),
    seasonGoalsMd: fs.readFileSync(path.join(contentDir, "season-goals.md"), "utf8"),
    benefitsForClubGoaliesMd: fs.readFileSync(
      path.join(contentDir, "benefits-for-club-goalies.md"),
      "utf8"
    ),
    skillDevelopmentMd: fs.readFileSync(path.join(contentDir, "skill-development.md"), "utf8"),
    contactInformationMd: fs.readFileSync(
      path.join(contentDir, "contact-information.md"),
      "utf8"
    ),
    equipmentMd: fs.readFileSync(path.join(contentDir, "equipment.md"), "utf8"),
    progressTrackingMd: fs.readFileSync(path.join(contentDir, "progress-tracking.md"), "utf8"),
    resourcesMd: fs.readFileSync(path.join(contentDir, "resources.md"), "utf8"),
  };

  // Resolve logo image
  let resolvedLogo: ResolvedLogoData | null = null;
  if (logoPath) {
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const rawDimensions = getImageDimensions(logoPath);
      const ext = path.extname(logoPath).toLowerCase().replace(".", "");
      const docxImageType = toDocxImageTypeFromExtension(ext);

      let imgWidth = 320;
      let imgHeight = 320;
      if (rawDimensions) {
        const ratio = rawDimensions.width / rawDimensions.height;
        if (ratio > 1) {
          imgWidth = 320;
          imgHeight = 320 / ratio;
        } else {
          imgHeight = 320;
          imgWidth = 320 * ratio;
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

  // Build config
  const config: ClubPlanConfig = {
    clubName,
    clubWebsite,
    clubMotto,
    primaryColor,
    secondaryColor,
    useIntermediateNets: enableAll,
    isEquipmentProvided: enableAll,
    equipmentProvidedAgeGroups: enableAll ? DEFAULT_PROVIDED_EQUIPMENT_AGE_GROUPS : "",
    hasTeamPracticeGoalieTraining: enableAll,
    hasGoalieCoachPerTeam: enableAll,
    hasYoungerGoalieMentors: enableAll,
    hasDedicatedGoaliePractices: enableAll,
    dedicatedGoaliePracticesHowOften: DEFAULT_TRAINING_FREQUENCY,
    dedicatedGoaliePracticesLength: DEFAULT_TRAINING_SESSION_LENGTH,
    dedicatedGoaliePracticesWithWhom: DEFAULT_TRAINING_WITH_WHOM,
    dedicatedGoaliePracticesStartingAgeGroup: DEFAULT_TRAINING_STARTING_AGE,
    hasOffIceGoalieTraining: enableAll,
    offIceGoalieTrainingHowOften: DEFAULT_TRAINING_FREQUENCY,
    offIceGoalieTrainingLength: DEFAULT_TRAINING_SESSION_LENGTH,
    offIceGoalieTrainingWithWhom: DEFAULT_TRAINING_WITH_WHOM,
    offIceGoalieTrainingStartingAgeGroup: DEFAULT_TRAINING_STARTING_AGE,
    hasGoalieVideoSessions: enableAll,
    goalieVideoSessionsHowOften: DEFAULT_VIDEO_SESSION_FREQUENCY,
    goalieVideoSessionsLength: DEFAULT_VIDEO_SESSION_LENGTH,
    goalieVideoSessionsStartingAgeGroup: DEFAULT_TRAINING_STARTING_AGE,
    hasGoalieEvaluations: enableAll,
    goalieEvaluationsWhen: DEFAULT_EVALUATION_WHEN,
    hasGoalieDiscount: enableAll,
    goalieDiscountDetails: DEFAULT_GOALIE_DISCOUNT,
    goalieDiscountStartingAgeGroup: "10U and older",
    goaliesAreFree: false,
    includeStarterIntroduction: true,
    includeStarterSeasonGoals: true,
    includeRequiredEquipmentSection: true,
    includeExternalResourcesSection: true,
  };

  const doc = await buildClubPlanDocument(config, content, resolvedLogo, docx);
  const buffer = await docx.Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`\u2713 Generated club plan successfully at: ${outputPath}`);
}

run().catch((err) => {
  console.error("Fatal error generating club plan:", err);
  throw err instanceof Error ? err : new Error(String(err));
});
