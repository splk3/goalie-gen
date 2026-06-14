import * as React from "react";
import type { Paragraph } from "docx";
import { saveAs } from "file-saver";
import Logo from "./Logo";
import Modal from "./Modal";
import SliderToggle from "./SliderToggle";
import { trackEvent } from "../utils/analytics";
import ImageUploader from "./ImageUploader";
import TeamColorPickers from "./TeamColorPickers";
import { parseMarkdown } from "../utils/markdownParser";
import { blocksToDocxParagraphs } from "../utils/docxContent";
import { loadDocxModule } from "../utils/loadExportModules";
import { toDocxImageTypeFromMime } from "../utils/docxImageType";
import {
  DEFAULT_PRIMARY_TEAM_COLOR,
  DEFAULT_SECONDARY_TEAM_COLOR,
  extractPaletteHexColorsFromDataUrl,
} from "../utils/teamColors";
import introductionMd from "../content/club-plan/introduction.md";
import seasonGoalsMd from "../content/club-plan/season-goals.md";
import benefitsForClubGoaliesMd from "../content/club-plan/benefits-for-club-goalies.md";
import skillDevelopmentMd from "../content/club-plan/skill-development.md";
import contactInformationMd from "../content/club-plan/contact-information.md";
import equipmentMd from "../content/club-plan/equipment.md";
import progressTrackingMd from "../content/club-plan/progress-tracking.md";
import resourcesMd from "../content/club-plan/resources.md";

const INTRO_OPTIONS = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"] as const;

const DEFAULT_PROVIDED_EQUIPMENT_AGE_GROUPS = "8U and younger (mites)";
const DEFAULT_TRAINING_FREQUENCY = "2x a month";
const DEFAULT_TRAINING_SESSION_LENGTH = "1 hour";
const DEFAULT_TRAINING_WITH_WHOM = "Goalie Coach or Training Organization Name";
const DEFAULT_TRAINING_STARTING_AGE = "12U";
const DEFAULT_VIDEO_SESSION_FREQUENCY = "weekly";
const DEFAULT_VIDEO_SESSION_LENGTH = "30 minutes";
const DEFAULT_EVALUATION_WHEN =
  "at the beginning of the season, mid-season, and at the end of the season";
const DEFAULT_GOALIE_DISCOUNT = "ex. 50%, $500";

type FieldsetProps = {
  children: React.ReactNode;
};

type ToggleProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
};

type InputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled: boolean;
};

type TrainingDetailInputsProps = {
  prefix: string;
  title: string;
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
  howOften: string;
  onHowOftenChange: (value: string) => void;
  length: string;
  onLengthChange: (value: string) => void;
  withWhom?: string;
  onWithWhomChange?: (value: string) => void;
  startingAge: string;
  onStartingAgeChange: (value: string) => void;
  showWithWhom?: boolean;
  disabled: boolean;
};

const formInputClassName =
  "w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed";

const subInputClassName =
  "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed";

function Fieldset({ children }: FieldsetProps) {
  return (
    <fieldset className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      {children}
    </fieldset>
  );
}

function Toggle({ id, label, checked, onChange, disabled }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 mb-3 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 accent-usa-blue disabled:cursor-not-allowed"
      />
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}

function Input({ id, label, value, onChange, placeholder, disabled }: InputProps) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={formInputClassName}
        placeholder={placeholder}
      />
    </div>
  );
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
  goaliesAreFree: boolean
): string {
  const lines: string[] = [benefitsForClubGoaliesMd.trim(), ""];

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

function TrainingDetailInputs({
  prefix,
  title,
  enabled,
  onEnabledChange,
  howOften,
  onHowOftenChange,
  length,
  onLengthChange,
  withWhom,
  onWithWhomChange,
  startingAge,
  onStartingAgeChange,
  showWithWhom = true,
  disabled,
}: TrainingDetailInputsProps) {
  return (
    <div className="mb-4">
      <Toggle
        id={`${prefix}-enabled`}
        label={title}
        checked={enabled}
        onChange={onEnabledChange}
        disabled={disabled}
      />
      {enabled && (
        <div className="ml-7 mt-2 space-y-3">
          <div>
            <label
              htmlFor={`${prefix}-how-often`}
              className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
            >
              How Often?
            </label>
            <input
              id={`${prefix}-how-often`}
              type="text"
              value={howOften}
              onChange={(e) => onHowOftenChange(e.target.value)}
              disabled={disabled}
              className={subInputClassName}
            />
          </div>
          <div>
            <label
              htmlFor={`${prefix}-session-length`}
              className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
            >
              Length of sessions
            </label>
            <input
              id={`${prefix}-session-length`}
              type="text"
              value={length}
              onChange={(e) => onLengthChange(e.target.value)}
              disabled={disabled}
              className={subInputClassName}
            />
          </div>
          {showWithWhom && (
            <div>
              <label
                htmlFor={`${prefix}-with-whom`}
                className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
              >
                With whom?
              </label>
              <input
                id={`${prefix}-with-whom`}
                type="text"
                value={withWhom}
                onChange={(e) => onWithWhomChange?.(e.target.value)}
                disabled={disabled}
                className={subInputClassName}
              />
            </div>
          )}
          <div>
            <label
              htmlFor={`${prefix}-starting-age`}
              className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
            >
              Starting Age Group
            </label>
            <input
              id={`${prefix}-starting-age`}
              type="text"
              value={startingAge}
              onChange={(e) => onStartingAgeChange(e.target.value)}
              disabled={disabled}
              className={subInputClassName}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function GenerateClubPlanButton() {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [clubName, setClubName] = React.useState<string>("");
  const [clubWebsite, setClubWebsite] = React.useState<string>("");
  const [clubMotto, setClubMotto] = React.useState<string>("");
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [primaryTeamColor, setPrimaryTeamColor] = React.useState<string>(
    DEFAULT_PRIMARY_TEAM_COLOR
  );
  const [secondaryTeamColor, setSecondaryTeamColor] = React.useState<string>(
    DEFAULT_SECONDARY_TEAM_COLOR
  );
  const [logoPaletteColors, setLogoPaletteColors] = React.useState<string[]>([]);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [validationError, setValidationError] = React.useState<string>("");
  const [generatedBlob, setGeneratedBlob] = React.useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = React.useState<string>("");

  const [isEquipmentProvided, setIsEquipmentProvided] = React.useState<boolean>(false);
  const [equipmentProvidedAgeGroups, setEquipmentProvidedAgeGroups] = React.useState<string>(
    DEFAULT_PROVIDED_EQUIPMENT_AGE_GROUPS
  );
  const [hasTeamPracticeGoalieTraining, setHasTeamPracticeGoalieTraining] =
    React.useState<boolean>(false);
  const [hasGoalieCoachPerTeam, setHasGoalieCoachPerTeam] = React.useState<boolean>(false);
  const [hasYoungerGoalieMentors, setHasYoungerGoalieMentors] = React.useState<boolean>(false);

  const [hasDedicatedGoaliePractices, setHasDedicatedGoaliePractices] =
    React.useState<boolean>(false);
  const [dedicatedGoaliePracticesHowOften, setDedicatedGoaliePracticesHowOften] =
    React.useState<string>(DEFAULT_TRAINING_FREQUENCY);
  const [dedicatedGoaliePracticesLength, setDedicatedGoaliePracticesLength] =
    React.useState<string>(DEFAULT_TRAINING_SESSION_LENGTH);
  const [dedicatedGoaliePracticesWithWhom, setDedicatedGoaliePracticesWithWhom] =
    React.useState<string>(DEFAULT_TRAINING_WITH_WHOM);
  const [dedicatedGoaliePracticesStartingAgeGroup, setDedicatedGoaliePracticesStartingAgeGroup] =
    React.useState<string>(DEFAULT_TRAINING_STARTING_AGE);

  const [hasOffIceGoalieTraining, setHasOffIceGoalieTraining] = React.useState<boolean>(false);
  const [offIceGoalieTrainingHowOften, setOffIceGoalieTrainingHowOften] = React.useState<string>(
    DEFAULT_TRAINING_FREQUENCY
  );
  const [offIceGoalieTrainingLength, setOffIceGoalieTrainingLength] = React.useState<string>(
    DEFAULT_TRAINING_SESSION_LENGTH
  );
  const [offIceGoalieTrainingWithWhom, setOffIceGoalieTrainingWithWhom] = React.useState<string>(
    DEFAULT_TRAINING_WITH_WHOM
  );
  const [offIceGoalieTrainingStartingAgeGroup, setOffIceGoalieTrainingStartingAgeGroup] =
    React.useState<string>(DEFAULT_TRAINING_STARTING_AGE);

  const [hasGoalieVideoSessions, setHasGoalieVideoSessions] = React.useState<boolean>(false);
  const [goalieVideoSessionsHowOften, setGoalieVideoSessionsHowOften] = React.useState<string>(
    DEFAULT_VIDEO_SESSION_FREQUENCY
  );
  const [goalieVideoSessionsLength, setGoalieVideoSessionsLength] = React.useState<string>(
    DEFAULT_VIDEO_SESSION_LENGTH
  );
  const [goalieVideoSessionsStartingAgeGroup, setGoalieVideoSessionsStartingAgeGroup] =
    React.useState<string>(DEFAULT_TRAINING_STARTING_AGE);

  const [hasGoalieEvaluations, setHasGoalieEvaluations] = React.useState<boolean>(false);
  const [goalieEvaluationsWhen, setGoalieEvaluationsWhen] =
    React.useState<string>(DEFAULT_EVALUATION_WHEN);

  const [hasGoalieDiscount, setHasGoalieDiscount] = React.useState<boolean>(false);
  const [goalieDiscountDetails, setGoalieDiscountDetails] =
    React.useState<string>(DEFAULT_GOALIE_DISCOUNT);
  const [goalieDiscountStartingAgeGroup, setGoalieDiscountStartingAgeGroup] =
    React.useState<string>("");
  const [goaliesAreFree, setGoaliesAreFree] = React.useState<boolean>(false);

  const [includeStarterIntroduction, setIncludeStarterIntroduction] = React.useState<boolean>(true);
  const [includeStarterSeasonGoals, setIncludeStarterSeasonGoals] = React.useState<boolean>(true);
  const [includeRequiredEquipmentSection, setIncludeRequiredEquipmentSection] =
    React.useState<boolean>(true);
  const [includeExternalResourcesSection, setIncludeExternalResourcesSection] =
    React.useState<boolean>(true);

  const handleImageCropped = React.useCallback((file: File | null, previewUrl: string | null) => {
    setSelectedImage(file);
    setImagePreview(previewUrl);
  }, []);

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

  const resetForm = React.useCallback(() => {
    setShowModal(false);
    setClubName("");
    setClubWebsite("");
    setClubMotto("");
    setSelectedImage(null);
    setImagePreview(null);
    setPrimaryTeamColor(DEFAULT_PRIMARY_TEAM_COLOR);
    setSecondaryTeamColor(DEFAULT_SECONDARY_TEAM_COLOR);
    setLogoPaletteColors([]);
    setValidationError("");
    setGeneratedBlob(null);
    setGeneratedFileName("");

    setIsEquipmentProvided(false);
    setEquipmentProvidedAgeGroups(DEFAULT_PROVIDED_EQUIPMENT_AGE_GROUPS);
    setHasTeamPracticeGoalieTraining(false);
    setHasGoalieCoachPerTeam(false);
    setHasYoungerGoalieMentors(false);

    setHasDedicatedGoaliePractices(false);
    setDedicatedGoaliePracticesHowOften(DEFAULT_TRAINING_FREQUENCY);
    setDedicatedGoaliePracticesLength(DEFAULT_TRAINING_SESSION_LENGTH);
    setDedicatedGoaliePracticesWithWhom(DEFAULT_TRAINING_WITH_WHOM);
    setDedicatedGoaliePracticesStartingAgeGroup(DEFAULT_TRAINING_STARTING_AGE);

    setHasOffIceGoalieTraining(false);
    setOffIceGoalieTrainingHowOften(DEFAULT_TRAINING_FREQUENCY);
    setOffIceGoalieTrainingLength(DEFAULT_TRAINING_SESSION_LENGTH);
    setOffIceGoalieTrainingWithWhom(DEFAULT_TRAINING_WITH_WHOM);
    setOffIceGoalieTrainingStartingAgeGroup(DEFAULT_TRAINING_STARTING_AGE);

    setHasGoalieVideoSessions(false);
    setGoalieVideoSessionsHowOften(DEFAULT_VIDEO_SESSION_FREQUENCY);
    setGoalieVideoSessionsLength(DEFAULT_VIDEO_SESSION_LENGTH);
    setGoalieVideoSessionsStartingAgeGroup(DEFAULT_TRAINING_STARTING_AGE);

    setHasGoalieEvaluations(false);
    setGoalieEvaluationsWhen(DEFAULT_EVALUATION_WHEN);

    setHasGoalieDiscount(false);
    setGoalieDiscountDetails(DEFAULT_GOALIE_DISCOUNT);
    setGoalieDiscountStartingAgeGroup("");
    setGoaliesAreFree(false);

    setIncludeStarterIntroduction(true);
    setIncludeStarterSeasonGoals(true);
    setIncludeRequiredEquipmentSection(true);
    setIncludeExternalResourcesSection(true);
  }, []);

  const generateDocx = async (): Promise<void> => {
    const {
      AlignmentType,
      Document,
      ExternalHyperlink,
      HeadingLevel,
      ImageRun,
      Packer,
      Paragraph,
      TextRun,
    } = await loadDocxModule();

    let arrayBuffer: ArrayBuffer | null = null;
    if (selectedImage) {
      arrayBuffer = await selectedImage.arrayBuffer();
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
        children: [new TextRun({ text: "Goaltending Development Plan", color: "000000" })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "for the", color: "000000" })],
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: valueOrPlaceholder(clubName, "CLUB_NAME"), color: "000000" }),
        ],
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );

    if (arrayBuffer && imagePreview) {
      const docxImageType = toDocxImageTypeFromMime(selectedImage?.type);
      let imgWidth = 320;
      let imgHeight = 320;

      try {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = imagePreview;
        });

        const ratio = img.width / img.height;
        if (ratio > 1) {
          imgWidth = 320;
          imgHeight = 320 / ratio;
        } else {
          imgHeight = 320;
          imgWidth = 320 * ratio;
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
                children: [
                  new TextRun({
                    text: normalizedWebsiteUrl,
                    color: "000000",
                    underline: { type: "single" },
                  }),
                ],
              }),
            ]
          : [
              new TextRun({
                text: valueOrPlaceholder(clubWebsite, "WEBSITE_URL"),
                color: "000000",
              }),
            ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );

    if (clubMotto.trim()) {
      documentChildren.push(
        new Paragraph({
          children: [new TextRun({ text: clubMotto.trim(), color: "000000", italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        })
      );
    }

    documentChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));

    documentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: "Goaltending Development Plan", color: "000000" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 200 },
      })
    );

    documentChildren.push(
      ...blocksToDocxParagraphs(parseMarkdown(`## Introduction\n\n${selectedIntroMarkdown}`))
    );

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
        )
      )
    );

    documentChildren.push(
      ...blocksToDocxParagraphs(parseMarkdown(`## Season Goals\n\n${selectedSeasonGoalsMarkdown}`))
    );

    const hasAnyBenefits =
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
        goaliesAreFree
      );
      documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(trainingDetailsMarkdown)));
    }
    documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(skillDevelopmentMd)));

    if (includeRequiredEquipmentSection) {
      documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(equipmentMd)));
    }

    if (hasGoalieEvaluations) {
      const progressWithValues = progressTrackingMd.replace(
        /\[GOALIE_EVALUATIONS_WHEN\]/g,
        valueOrPlaceholder(goalieEvaluationsWhen, "GOALIE_EVALUATIONS_WHEN")
      );
      documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(progressWithValues)));
    }

    if (includeExternalResourcesSection) {
      documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(resourcesMd)));
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
    const safeName = valueOrPlaceholder(clubName, "CLUB_NAME").replace(/[<>:"/\\|?*]/g, "_");
    setGeneratedBlob(blob);
    setGeneratedFileName(`${safeName}_Club_Development_Plan.docx`);
  };

  const generateDocument = async () => {
    setValidationError("");

    if (!clubName.trim()) {
      setValidationError("Please enter a club name");
      return;
    }

    setIsGenerating(true);

    try {
      await generateDocx();
      trackEvent("generate_plan", {
        type: "club",
        format: "docx",
        team_name_provided: !!clubName.trim(),
        team_name: clubName,
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
      saveAs(generatedBlob, generatedFileName);

      trackEvent("download_plan", {
        type: "club",
        format: "docx",
        team_name: clubName,
      });

      resetForm();
    }
  };

  const handleCancel = React.useCallback(() => {
    resetForm();
  }, [resetForm]);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showModal && !isGenerating && !generatedBlob) {
        handleCancel();
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showModal, isGenerating, generatedBlob, handleCancel]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setShowModal(true)}
        className="bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105 text-center"
      >
        Generate Club Development Plan
      </button>

      <Modal
        isOpen={showModal}
        labelledBy="club-plan-modal-title"
        className="max-w-2xl w-full"
        triggerRef={triggerRef}
      >
        <div className="p-8 overflow-y-auto flex-1 min-h-0">
          <div className="flex items-center gap-4 mb-6">
            <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
            <h2
              id="club-plan-modal-title"
              className="text-2xl font-bold text-usa-blue dark:text-blue-400"
            >
              Generate Club Development Plan
            </h2>
          </div>

          <Input
            id="club-name"
            label="Club Name"
            value={clubName}
            onChange={setClubName}
            placeholder="Enter your club name"
            disabled={!!generatedBlob || isGenerating}
          />

          <Input
            id="club-website"
            label="Club Website"
            value={clubWebsite}
            onChange={setClubWebsite}
            placeholder="Enter your club website"
            disabled={!!generatedBlob || isGenerating}
          />

          <Input
            id="club-motto"
            label="Club Motto/Mission"
            value={clubMotto}
            onChange={setClubMotto}
            placeholder="Enter your club motto or mission (optional)"
            disabled={!!generatedBlob || isGenerating}
          />

          <ImageUploader
            onImageCropped={handleImageCropped}
            disabled={!!generatedBlob || isGenerating}
          />

          <TeamColorPickers
            primaryColor={primaryTeamColor}
            secondaryColor={secondaryTeamColor}
            paletteColors={logoPaletteColors}
            disabled={!!generatedBlob || isGenerating}
            onPrimaryColorChange={setPrimaryTeamColor}
            onSecondaryColorChange={setSecondaryTeamColor}
          />

          <Fieldset>
            <legend className="px-2 text-lg font-bold text-usa-blue dark:text-blue-400">
              Club Training Details
            </legend>

            <Toggle
              id="equipment-provided"
              label="Is goalie equipment provided?"
              checked={isEquipmentProvided}
              onChange={setIsEquipmentProvided}
              disabled={!!generatedBlob || isGenerating}
            />
            {isEquipmentProvided && (
              <div className="ml-7 mb-4">
                <label
                  htmlFor="equipment-age-groups"
                  className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
                >
                  Which Age Groups?
                </label>
                <input
                  id="equipment-age-groups"
                  type="text"
                  value={equipmentProvidedAgeGroups}
                  onChange={(e) => setEquipmentProvidedAgeGroups(e.target.value)}
                  disabled={!!generatedBlob || isGenerating}
                  className={subInputClassName}
                />
              </div>
            )}

            <Toggle
              id="team-goalie-training"
              label="Do teams have goalie training during team practices?"
              checked={hasTeamPracticeGoalieTraining}
              onChange={setHasTeamPracticeGoalieTraining}
              disabled={!!generatedBlob || isGenerating}
            />

            <Toggle
              id="goalie-coach-per-team"
              label="Does each team have a goalie coach?"
              checked={hasGoalieCoachPerTeam}
              onChange={setHasGoalieCoachPerTeam}
              disabled={!!generatedBlob || isGenerating}
            />

            <Toggle
              id="younger-goalie-mentors"
              label="Do younger goalies have goalie mentors from older teams?"
              checked={hasYoungerGoalieMentors}
              onChange={setHasYoungerGoalieMentors}
              disabled={!!generatedBlob || isGenerating}
            />

            <TrainingDetailInputs
              prefix="dedicated-goalie-practices"
              title="Does your club have dedicated goalie practices?"
              enabled={hasDedicatedGoaliePractices}
              onEnabledChange={setHasDedicatedGoaliePractices}
              howOften={dedicatedGoaliePracticesHowOften}
              onHowOftenChange={setDedicatedGoaliePracticesHowOften}
              length={dedicatedGoaliePracticesLength}
              onLengthChange={setDedicatedGoaliePracticesLength}
              withWhom={dedicatedGoaliePracticesWithWhom}
              onWithWhomChange={setDedicatedGoaliePracticesWithWhom}
              startingAge={dedicatedGoaliePracticesStartingAgeGroup}
              onStartingAgeChange={setDedicatedGoaliePracticesStartingAgeGroup}
              disabled={!!generatedBlob || isGenerating}
            />

            <TrainingDetailInputs
              prefix="off-ice-goalie-training"
              title="Does your club have off-ice goalie training?"
              enabled={hasOffIceGoalieTraining}
              onEnabledChange={setHasOffIceGoalieTraining}
              howOften={offIceGoalieTrainingHowOften}
              onHowOftenChange={setOffIceGoalieTrainingHowOften}
              length={offIceGoalieTrainingLength}
              onLengthChange={setOffIceGoalieTrainingLength}
              withWhom={offIceGoalieTrainingWithWhom}
              onWithWhomChange={setOffIceGoalieTrainingWithWhom}
              startingAge={offIceGoalieTrainingStartingAgeGroup}
              onStartingAgeChange={setOffIceGoalieTrainingStartingAgeGroup}
              disabled={!!generatedBlob || isGenerating}
            />

            <TrainingDetailInputs
              prefix="goalie-video-sessions"
              title="Does your club have goalie-specific video sessions?"
              enabled={hasGoalieVideoSessions}
              onEnabledChange={setHasGoalieVideoSessions}
              howOften={goalieVideoSessionsHowOften}
              onHowOftenChange={setGoalieVideoSessionsHowOften}
              length={goalieVideoSessionsLength}
              onLengthChange={setGoalieVideoSessionsLength}
              startingAge={goalieVideoSessionsStartingAgeGroup}
              onStartingAgeChange={setGoalieVideoSessionsStartingAgeGroup}
              showWithWhom={false}
              disabled={!!generatedBlob || isGenerating}
            />

            <Toggle
              id="goalie-evaluations"
              label="Do goalies receive evaluations?"
              checked={hasGoalieEvaluations}
              onChange={setHasGoalieEvaluations}
              disabled={!!generatedBlob || isGenerating}
            />
            {hasGoalieEvaluations && (
              <div className="ml-7 mb-4">
                <label
                  htmlFor="goalie-evaluations-when"
                  className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
                >
                  When?
                </label>
                <input
                  id="goalie-evaluations-when"
                  type="text"
                  value={goalieEvaluationsWhen}
                  onChange={(e) => setGoalieEvaluationsWhen(e.target.value)}
                  disabled={!!generatedBlob || isGenerating}
                  className={subInputClassName}
                />
              </div>
            )}

            <Toggle
              id="goalie-discount"
              label="Does your club offer a goalie discount?"
              checked={hasGoalieDiscount}
              onChange={setHasGoalieDiscount}
              disabled={!!generatedBlob || isGenerating}
            />
            {hasGoalieDiscount && (
              <div className="ml-7 mb-4">
                <label
                  htmlFor="goalie-discount-details"
                  className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
                >
                  Goalie Discount
                </label>
                <input
                  id="goalie-discount-details"
                  type="text"
                  value={goalieDiscountDetails}
                  onChange={(e) => setGoalieDiscountDetails(e.target.value)}
                  disabled={goaliesAreFree || !!generatedBlob || isGenerating}
                  className={subInputClassName}
                />
                <label
                  htmlFor="goalie-discount-starting-age-group"
                  className="block text-gray-700 dark:text-gray-300 font-medium mt-3 mb-1"
                >
                  Starting Age Group
                </label>
                <textarea
                  id="goalie-discount-starting-age-group"
                  value={goalieDiscountStartingAgeGroup}
                  onChange={(e) => setGoalieDiscountStartingAgeGroup(e.target.value)}
                  disabled={!!generatedBlob || isGenerating}
                  className={subInputClassName}
                  rows={2}
                />
                <label
                  htmlFor="goalies-are-free"
                  className="flex items-center gap-2 mt-2 text-gray-700 dark:text-gray-300"
                >
                  <input
                    id="goalies-are-free"
                    type="checkbox"
                    checked={goaliesAreFree}
                    onChange={(e) => setGoaliesAreFree(e.target.checked)}
                    disabled={!!generatedBlob || isGenerating}
                    className="h-4 w-4 accent-usa-blue"
                  />
                  Goalies are Free!
                </label>
              </div>
            )}
          </Fieldset>

          <Fieldset>
            <legend className="px-2 text-lg font-bold text-usa-blue dark:text-blue-400">
              Content Sections
            </legend>
            <SliderToggle
              id="include-starter-intro"
              label="Add starter content for introduction?"
              enabled={includeStarterIntroduction}
              onChange={setIncludeStarterIntroduction}
              disabled={!!generatedBlob || isGenerating}
            />
            <SliderToggle
              id="include-starter-season-goals"
              label="Add starter content for Season Goals?"
              enabled={includeStarterSeasonGoals}
              onChange={setIncludeStarterSeasonGoals}
              disabled={!!generatedBlob || isGenerating}
            />
            <SliderToggle
              id="include-required-equipment"
              label="Include a required equipment section?"
              enabled={includeRequiredEquipmentSection}
              onChange={setIncludeRequiredEquipmentSection}
              disabled={!!generatedBlob || isGenerating}
            />
            <SliderToggle
              id="include-external-resources"
              label="Include a section for helpful external goaltending resources?"
              enabled={includeExternalResourcesSection}
              onChange={setIncludeExternalResourcesSection}
              disabled={!!generatedBlob || isGenerating}
            />
          </Fieldset>

          {validationError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {validationError}
            </div>
          )}

          {generatedBlob && !validationError && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg text-sm">
              Club plan generated successfully! Click Download to save it.
            </div>
          )}
        </div>

        <div className="px-8 pb-8 flex gap-4 flex-shrink-0">
          {!generatedBlob ? (
            <>
              <button
                onClick={generateDocument}
                disabled={isGenerating}
                className={`flex-1 bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors ${
                  isGenerating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isGenerating ? "Generating..." : "Generate DOCX"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isGenerating}
                className="flex-1 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
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
    </>
  );
}
