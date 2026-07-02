import * as fs from "fs";
import * as path from "path";
import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
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

const INTRO_OPTIONS = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"] as const;

// Simple dimension parser for PNG and JPEG
function getImageDimensions(filePath: string): { width: number; height: number } | null {
  try {
    const buffer = fs.readFileSync(filePath);
    // PNG Check
    if (buffer.readUInt32BE(0) === 0x89504e47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    // Simple JPEG Check
    if (buffer.readUInt16BE(0) === 0xffd8) {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        if (marker === 0xffc0 || marker === 0xffc2) {
          // SOF0 or SOF2
          // Length (2 bytes)
          const _length = buffer.readUInt16BE(offset);
          // Precision (1 byte), Height (2 bytes), Width (2 bytes)
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

function withSectionHeading(markdown: string, heading: string): string {
  return markdown.replace(/^##\s+.+$/m, `## ${heading}`);
}

function buildTrainingDetailsBlock(
  hasDedicatedGoaliePractices: boolean,
  dedicatedGoaliePracticesHowOften: string,
  dedicatedGoaliePracticesLength: string,
  dedicatedGoaliePracticesWithWhom: string,
  dedicatedGoaliePracticesStartingAgeGroup: string,
  hasOffIceGoalieTraining: boolean,
  offIceGoalieTrainingHowOften: string,
  offIceGoalieTrainingLength: string,
  offIceGoalieTrainingWithWhom: string,
  offIceGoalieTrainingStartingAgeGroup: string,
  hasGoalieVideoSessions: boolean,
  goalieVideoSessionsHowOften: string,
  goalieVideoSessionsLength: string,
  goalieVideoSessionsStartingAgeGroup: string,
  isEquipmentProvided: boolean,
  equipmentProvidedAgeGroups: string,
  hasTeamPracticeGoalieTraining: boolean,
  hasGoalieCoachPerTeam: boolean,
  hasYoungerGoalieMentors: boolean,
  hasGoalieEvaluations: boolean,
  goalieEvaluationsWhen: string,
  hasGoalieDiscount: boolean,
  goalieDiscountDetails: string,
  goalieDiscountStartingAgeGroup: string,
  goaliesAreFree: boolean,
  useIntermediateNets: boolean,
  benefitsForClubGoaliesMd: string
): string {
  const lines: string[] = [benefitsForClubGoaliesMd.trim(), ""];

  if (useIntermediateNets) {
    lines.push(
      "- 8U and younger (mites) teams use USA Hockey recommended intermediate sized nets."
    );
  }

  if (isEquipmentProvided) {
    lines.push(
      `- Goalie equipment is provided by the club for: ${valueOrPlaceholder(
        equipmentProvidedAgeGroups,
        "EQUIPMENT_AGE_GROUPS"
      )}.`
    );
  }

  if (hasTeamPracticeGoalieTraining) {
    lines.push("- Teams include goalie training during team practices.");
  }
  if (hasGoalieCoachPerTeam) {
    lines.push("- Each team has a goalie coach.");
  }
  if (hasYoungerGoalieMentors) {
    lines.push("- Younger goalies are paired with mentors from older teams.");
  }

  if (hasDedicatedGoaliePractices) {
    lines.push(
      `- Dedicated goalie practices are offered ${valueOrPlaceholder(
        dedicatedGoaliePracticesHowOften,
        "DEDICATED_GOALIE_PRACTICES_HOW_OFTEN"
      )}, run for ${valueOrPlaceholder(
        dedicatedGoaliePracticesLength,
        "DEDICATED_GOALIE_PRACTICES_LENGTH"
      )}, led by ${valueOrPlaceholder(
        dedicatedGoaliePracticesWithWhom,
        "DEDICATED_GOALIE_PRACTICES_WITH_WHOM"
      )}, starting at ${valueOrPlaceholder(
        dedicatedGoaliePracticesStartingAgeGroup,
        "DEDICATED_GOALIE_PRACTICES_STARTING_AGE_GROUP"
      )}.`
    );
  }

  if (hasOffIceGoalieTraining) {
    lines.push(
      `- Off-ice goalie training is offered ${valueOrPlaceholder(
        offIceGoalieTrainingHowOften,
        "OFF_ICE_GOALIE_TRAINING_HOW_OFTEN"
      )}, run for ${valueOrPlaceholder(
        offIceGoalieTrainingLength,
        "OFF_ICE_GOALIE_TRAINING_LENGTH"
      )}, led by ${valueOrPlaceholder(
        offIceGoalieTrainingWithWhom,
        "OFF_ICE_GOALIE_TRAINING_WITH_WHOM"
      )}, starting at ${valueOrPlaceholder(
        offIceGoalieTrainingStartingAgeGroup,
        "OFF_ICE_GOALIE_TRAINING_STARTING_AGE_GROUP"
      )}.`
    );
  }

  if (hasGoalieVideoSessions) {
    lines.push(
      `- Goalie-specific video sessions are offered ${valueOrPlaceholder(
        goalieVideoSessionsHowOften,
        "GOALIE_VIDEO_SESSIONS_HOW_OFTEN"
      )}, run for ${valueOrPlaceholder(
        goalieVideoSessionsLength,
        "GOALIE_VIDEO_SESSIONS_LENGTH"
      )}, starting at ${valueOrPlaceholder(
        goalieVideoSessionsStartingAgeGroup,
        "GOALIE_VIDEO_SESSIONS_STARTING_AGE_GROUP"
      )}.`
    );
  }

  if (hasGoalieEvaluations) {
    lines.push(
      `- Goalie evaluations are conducted ${valueOrPlaceholder(
        goalieEvaluationsWhen,
        "GOALIE_EVALUATIONS_WHEN"
      )}.`
    );
  }

  if (hasGoalieDiscount) {
    if (goaliesAreFree) {
      lines.push(
        `- Goalie discount program: Goalies are free${
          goalieDiscountStartingAgeGroup.trim()
            ? ` starting at ${valueOrPlaceholder(
                goalieDiscountStartingAgeGroup,
                "GOALIE_DISCOUNT_STARTING_AGE_GROUP"
              )}`
            : ""
        }.`
      );
    } else {
      lines.push(
        `- Goalie discount program: ${valueOrPlaceholder(
          goalieDiscountDetails,
          "GOALIE_DISCOUNT"
        )}${
          goalieDiscountStartingAgeGroup.trim()
            ? ` (starting age group: ${valueOrPlaceholder(
                goalieDiscountStartingAgeGroup,
                "GOALIE_DISCOUNT_STARTING_AGE_GROUP"
              )})`
            : ""
        }.`
      );
    }
  }

  return lines.join("\n");
}

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

  // Paths to content markdown files
  const contentDir = path.join(__dirname, "src/content/club-plan");
  const introductionMd = fs.readFileSync(path.join(contentDir, "introduction.md"), "utf8");
  const seasonGoalsMd = fs.readFileSync(path.join(contentDir, "season-goals.md"), "utf8");
  const benefitsForClubGoaliesMd = fs.readFileSync(
    path.join(contentDir, "benefits-for-club-goalies.md"),
    "utf8"
  );
  const skillDevelopmentMd = fs.readFileSync(path.join(contentDir, "skill-development.md"), "utf8");
  const contactInformationMd = fs.readFileSync(
    path.join(contentDir, "contact-information.md"),
    "utf8"
  );
  const equipmentMd = fs.readFileSync(path.join(contentDir, "equipment.md"), "utf8");
  const progressTrackingMd = fs.readFileSync(path.join(contentDir, "progress-tracking.md"), "utf8");
  const resourcesMd = fs.readFileSync(path.join(contentDir, "resources.md"), "utf8");

  // Replicate feature flags
  const useIntermediateNets = enableAll;
  const isEquipmentProvided = enableAll;
  const equipmentProvidedAgeGroups = "8U and younger (mites)";
  const hasTeamPracticeGoalieTraining = enableAll;
  const hasGoalieCoachPerTeam = enableAll;
  const hasYoungerGoalieMentors = enableAll;

  const hasDedicatedGoaliePractices = enableAll;
  const dedicatedGoaliePracticesHowOften = "2x a month";
  const dedicatedGoaliePracticesLength = "1 hour";
  const dedicatedGoaliePracticesWithWhom = "Goalie Coach or Training Organization Name";
  const dedicatedGoaliePracticesStartingAgeGroup = "12U";

  const hasOffIceGoalieTraining = enableAll;
  const offIceGoalieTrainingHowOften = "2x a month";
  const offIceGoalieTrainingLength = "1 hour";
  const offIceGoalieTrainingWithWhom = "Goalie Coach or Training Organization Name";
  const offIceGoalieTrainingStartingAgeGroup = "12U";

  const hasGoalieVideoSessions = enableAll;
  const goalieVideoSessionsHowOften = "weekly";
  const goalieVideoSessionsLength = "30 minutes";
  const goalieVideoSessionsStartingAgeGroup = "12U";

  const hasGoalieEvaluations = enableAll;
  const goalieEvaluationsWhen =
    "at the beginning of the season, mid-season, and at the end of the season";

  const hasGoalieDiscount = enableAll;
  const goalieDiscountDetails = "50% off registration fees";
  const goalieDiscountStartingAgeGroup = "10U and older";
  const goaliesAreFree = false;

  const includeStarterIntroduction = true;
  const includeStarterSeasonGoals = true;
  const includeRequiredEquipmentSection = true;
  const includeExternalResourcesSection = true;

  const cleanPrimary = cleanHexColor(primaryColor);
  const cleanSecondary = cleanHexColor(secondaryColor);
  const colorOpts = { primaryColor, secondaryColor };

  const toPrimaryRun = (text: string, options: Record<string, unknown> = {}) =>
    new TextRun({ text, color: cleanPrimary, ...options });

  const toSecondaryRun = (text: string, options: Record<string, unknown> = {}) =>
    new TextRun({ text, color: cleanSecondary, ...options });

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

  const selectedIntroMarkdown = includeStarterIntroduction
    ? extractLevel3Section(
        introductionMd,
        INTRO_OPTIONS[Math.floor(Math.random() * INTRO_OPTIONS.length)]
      )
    : extractLevel3Section(introductionMd, "Placeholder");

  const selectedSeasonGoalsMarkdown = includeStarterSeasonGoals
    ? extractLevel3Section(seasonGoalsMd, "Sample Content")
    : extractLevel3Section(seasonGoalsMd, "Placeholder");

  const documentChildren: Paragraph[] = [];
  documentChildren.push(
    new Paragraph({
      children: [toPrimaryRun("Goaltending Development Plan", { bold: true })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [toPrimaryRun("for the")],
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [toPrimaryRun(valueOrPlaceholder(clubName, "CLUB_NAME"), { bold: true })],
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
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

    let imgWidth = 320;
    let imgHeight = 320;

    if (imageDimensions) {
      const ratio = imageDimensions.width / imageDimensions.height;
      if (ratio > 1) {
        imgWidth = 320;
        imgHeight = 320 / ratio;
      } else {
        imgHeight = 320;
        imgWidth = 320 * ratio;
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
        spacing: { before: 200, after: 200 },
      })
    );
  } else {
    documentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: "[CLUB_LOGO]", color: "000000" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
      })
    );
  }

  const normalizedWebsiteUrl = clubWebsite.trim();
  const websiteLinkTarget =
    normalizedWebsiteUrl && !/^https?:\/\//i.test(normalizedWebsiteUrl)
      ? `https://${normalizedWebsiteUrl}`
      : normalizedWebsiteUrl;

  documentChildren.push(
    new Paragraph({
      children: normalizedWebsiteUrl
        ? [
            new ExternalHyperlink({
              link: websiteLinkTarget,
              children: [toPrimaryRun(normalizedWebsiteUrl, { underline: { type: "single" } })],
            }),
          ]
        : [toPrimaryRun(valueOrPlaceholder(clubWebsite, "WEBSITE_URL"))],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    })
  );

  if (clubMotto.trim()) {
    documentChildren.push(
      new Paragraph({
        children: [toSecondaryRun(clubMotto.trim(), { italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }

  documentChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));

  documentChildren.push(
    new Paragraph({
      children: [toPrimaryRun("Goaltending Development Plan", { bold: true })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 200 },
    })
  );

  documentChildren.push(
    ...blocksToDocxParagraphs(
      parseMarkdown(`## Introduction\n\n${selectedIntroMarkdown}`),
      colorOpts
    )
  );

  documentChildren.push(
    ...blocksToDocxParagraphs(
      parseMarkdown(
        withSectionHeading(
          contactInformationMd.replace(/\[CLUB NAME\]/g, valueOrPlaceholder(clubName, "CLUB_NAME")),
          "Goalie Coaching Contacts"
        )
      ),
      colorOpts
    )
  );

  documentChildren.push(
    ...blocksToDocxParagraphs(
      parseMarkdown(`## Season Goals\n\n${selectedSeasonGoalsMarkdown}`),
      colorOpts
    )
  );

  const hasAnyBenefits =
    useIntermediateNets ||
    isEquipmentProvided ||
    hasTeamPracticeGoalieTraining ||
    hasGoalieCoachPerTeam ||
    hasYoungerGoalieMentors ||
    hasDedicatedGoaliePractices ||
    hasOffIceGoalieTraining ||
    hasGoalieVideoSessions ||
    hasGoalieEvaluations ||
    hasGoalieDiscount;

  if (hasAnyBenefits) {
    const trainingDetailsMarkdown = buildTrainingDetailsBlock(
      hasDedicatedGoaliePractices,
      dedicatedGoaliePracticesHowOften,
      dedicatedGoaliePracticesLength,
      dedicatedGoaliePracticesWithWhom,
      dedicatedGoaliePracticesStartingAgeGroup,
      hasOffIceGoalieTraining,
      offIceGoalieTrainingHowOften,
      offIceGoalieTrainingLength,
      offIceGoalieTrainingWithWhom,
      offIceGoalieTrainingStartingAgeGroup,
      hasGoalieVideoSessions,
      goalieVideoSessionsHowOften,
      goalieVideoSessionsLength,
      goalieVideoSessionsStartingAgeGroup,
      isEquipmentProvided,
      equipmentProvidedAgeGroups,
      hasTeamPracticeGoalieTraining,
      hasGoalieCoachPerTeam,
      hasYoungerGoalieMentors,
      hasGoalieEvaluations,
      goalieEvaluationsWhen,
      hasGoalieDiscount,
      goalieDiscountDetails,
      goalieDiscountStartingAgeGroup,
      goaliesAreFree,
      useIntermediateNets,
      benefitsForClubGoaliesMd
    );
    documentChildren.push(
      ...blocksToDocxParagraphs(parseMarkdown(trainingDetailsMarkdown), colorOpts)
    );
  }

  documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(skillDevelopmentMd), colorOpts));

  if (includeRequiredEquipmentSection) {
    documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(equipmentMd), colorOpts));
  }

  if (hasGoalieEvaluations) {
    const progressWithValues = progressTrackingMd.replace(
      /\[GOALIE_EVALUATIONS_WHEN\]/g,
      valueOrPlaceholder(goalieEvaluationsWhen, "GOALIE_EVALUATIONS_WHEN")
    );
    documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(progressWithValues), colorOpts));
  }

  if (includeExternalResourcesSection) {
    documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(resourcesMd), colorOpts));
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
          `${valueOrPlaceholder(clubName, "CLUB_NAME").toUpperCase()} GOALTENDING DEVELOPMENT PLAN`,
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
  console.log(`✓ Generated club plan successfully at: ${outputPath}`);
}

run().catch((err) => {
  console.error("Fatal error generating club plan:", err);
  throw err instanceof Error ? err : new Error(String(err));
});
