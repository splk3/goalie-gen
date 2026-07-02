/**
 * Platform-agnostic Club Plan DOCX document builder.
 *
 * This builder contains the canonical document assembly logic and accepts
 * pre-resolved platform dependencies (image data, docx classes) so it can be
 * called from both the React web button and the Node CLI test script.
 */
import { parseMarkdown } from "../markdownParser";
import { blocksToDocxParagraphs, cleanHexColor, makeDocxHeaderFooter } from "../docxContent";
import type { ClubPlanConfig, ClubPlanContent, ResolvedLogoData } from "../../types/generatorConfig";
import {
  extractLevel3Section,
  valueOrPlaceholder,
  withSectionHeading,
  buildTrainingDetailsBlock,
  CLUB_PLAN_INTRO_OPTIONS,
} from "../generatorDefaults";

type DocxModule = typeof import("docx");

/**
 * Builds a Club Plan `Document` object from the supplied configuration,
 * pre-loaded markdown content, and optional logo image.
 *
 * The caller is responsible for:
 * - Loading markdown content from the filesystem or Webpack module imports.
 * - Resolving the logo image bytes and dimensions.
 * - Providing the `docx` module (either a direct import or a lazy-loaded one).
 * - Packaging the returned `Document` via `Packer.toBlob()` / `Packer.toBuffer()`.
 *
 * @param config  Club plan configuration (feature flags, colors, text fields).
 * @param content Pre-loaded markdown strings for each content section.
 * @param logo    Pre-resolved logo image data, or `null` if no logo is provided.
 * @param docx    The `docx` module exports.
 */
export async function buildClubPlanDocument(
  config: ClubPlanConfig,
  content: ClubPlanContent,
  logo: ResolvedLogoData | null,
  docx: DocxModule
): Promise<InstanceType<DocxModule["Document"]>> {
  const {
    AlignmentType,
    Document,
    ExternalHyperlink,
    HeadingLevel,
    ImageRun,
    Paragraph,
    TextRun,
    Header,
    Footer,
    BorderStyle,
    TabStopType,
    PageNumber,
  } = docx;

  const {
    clubName,
    clubWebsite,
    clubMotto,
    primaryColor,
    secondaryColor,
    useIntermediateNets,
    isEquipmentProvided,
    equipmentProvidedAgeGroups,
    hasTeamPracticeGoalieTraining,
    hasGoalieCoachPerTeam,
    hasYoungerGoalieMentors,
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
    hasGoalieEvaluations,
    goalieEvaluationsWhen,
    hasGoalieDiscount,
    goalieDiscountDetails,
    goalieDiscountStartingAgeGroup,
    goaliesAreFree,
    includeStarterIntroduction,
    includeStarterSeasonGoals,
    includeRequiredEquipmentSection,
    includeExternalResourcesSection,
  } = config;

  const {
    introductionMd,
    seasonGoalsMd,
    benefitsForClubGoaliesMd,
    skillDevelopmentMd,
    contactInformationMd,
    equipmentMd,
    progressTrackingMd,
    resourcesMd,
  } = content;

  const cleanPrimary = cleanHexColor(primaryColor);
  const cleanSecondary = cleanHexColor(secondaryColor);
  const colorOpts = { primaryColor, secondaryColor };

  const toPrimaryRun = (text: string, options: Record<string, unknown> = {}) =>
    new TextRun({ text, color: cleanPrimary, ...options });

  const toSecondaryRun = (text: string, options: Record<string, unknown> = {}) =>
    new TextRun({ text, color: cleanSecondary, ...options });

  // ── Content selection ──────────────────────────────────────────────────────

  const selectedIntroMarkdown = includeStarterIntroduction
    ? extractLevel3Section(
        introductionMd,
        CLUB_PLAN_INTRO_OPTIONS[Math.floor(Math.random() * CLUB_PLAN_INTRO_OPTIONS.length)]
      )
    : extractLevel3Section(introductionMd, "Placeholder");

  const selectedSeasonGoalsMarkdown = includeStarterSeasonGoals
    ? extractLevel3Section(seasonGoalsMd, "Sample Content")
    : extractLevel3Section(seasonGoalsMd, "Placeholder");

  // ── Document children ──────────────────────────────────────────────────────

  const documentChildren: InstanceType<typeof Paragraph>[] = [];

  // Cover page: title
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

  // Cover page: logo image or placeholder
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

  // Cover page: website link
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

  // Cover page: motto
  if (clubMotto.trim()) {
    documentChildren.push(
      new Paragraph({
        children: [toSecondaryRun(clubMotto.trim(), { italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }

  // Page break after cover
  documentChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));

  // Main content heading
  documentChildren.push(
    new Paragraph({
      children: [toPrimaryRun("Goaltending Development Plan", { bold: true })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 200 },
    })
  );

  // Introduction section
  documentChildren.push(
    ...blocksToDocxParagraphs(
      parseMarkdown(`## Introduction\n\n${selectedIntroMarkdown}`),
      colorOpts
    )
  );

  // Contact information section
  documentChildren.push(
    ...blocksToDocxParagraphs(
      parseMarkdown(
        withSectionHeading(
          contactInformationMd.replace(
            /\[CLUB NAME\]/g,
            valueOrPlaceholder(clubName, "CLUB_NAME")
          ),
          "Goalie Coaching Contacts"
        )
      ),
      colorOpts
    )
  );

  // Season Goals section
  documentChildren.push(
    ...blocksToDocxParagraphs(
      parseMarkdown(`## Season Goals\n\n${selectedSeasonGoalsMarkdown}`),
      colorOpts
    )
  );

  // Training Details / Benefits section
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
      {
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
      },
      benefitsForClubGoaliesMd
    );
    documentChildren.push(
      ...blocksToDocxParagraphs(parseMarkdown(trainingDetailsMarkdown), colorOpts)
    );
  }

  // Skill Development section
  documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(skillDevelopmentMd), colorOpts));

  // Equipment section (optional)
  if (includeRequiredEquipmentSection) {
    documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(equipmentMd), colorOpts));
  }

  // Progress Tracking / Evaluations section
  if (hasGoalieEvaluations) {
    const progressWithValues = progressTrackingMd.replace(
      /\[GOALIE_EVALUATIONS_WHEN\]/g,
      valueOrPlaceholder(goalieEvaluationsWhen, "GOALIE_EVALUATIONS_WHEN")
    );
    documentChildren.push(
      ...blocksToDocxParagraphs(parseMarkdown(progressWithValues), colorOpts)
    );
  }

  // External Resources section (optional)
  if (includeExternalResourcesSection) {
    documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(resourcesMd), colorOpts));
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
}
