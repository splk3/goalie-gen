import type { DrillData } from "../types/drill";
import { planDedicatedProgressionCards } from "./drillPdfPaginationShared";
import {
  DRILL_PDF_FOOTER_CONTENT_GAP_MM,
  DRILL_PDF_FOOTER_LOGO_HEIGHT_MM,
  DRILL_PDF_FOOTER_SEPARATOR_GAP_MM,
  DRILL_PDF_HEADER_LOGO_BOTTOM_GAP_MM,
  DRILL_PDF_HEADER_LOGO_HEIGHT_MM,
  DRILL_PDF_HEADER_SEPARATOR_BOTTOM_GAP_MM,
  DRILL_PDF_HEADER_START_Y_MM,
  DRILL_PDF_MARGIN_MM,
  DRILL_PDF_NEW_PAGE_TOP_GAP_MM,
  DRILL_PDF_PAGE_HEIGHT_MM,
  DRILL_PDF_TAGS_HEIGHT_MM,
  DRILL_VIDEO_QR_FLOW_CLEARANCE_MM,
  DRILL_VIDEO_SECTION_TOP_GAP_MM,
  DRILL_VIDEO_SEPARATOR_TITLE_SPACING_MM,
  PROGRESSION_IMAGE_TEXT_GAP,
  PROGRESSION_TEXT_LINE_HEIGHT,
  PROGRESSION_VIDEO_NOTE_HEIGHT,
  SINGLE_COLUMN_DRILL_IMAGE_WIDTH_RATIO,
  SKILLS_FOCUS_LABEL_TO_VALUES_GAP,
  SKILLS_FOCUS_TOP_GAP,
} from "./drillPdfLayout";
import { drillMarkdownToPlainLines } from "./drillMarkdown";

export {
  PROGRESSION_IMAGE_TEXT_GAP,
  PROGRESSION_TEXT_FONT_SIZE,
  PROGRESSION_TEXT_LINE_HEIGHT,
  PROGRESSION_VIDEO_NOTE_HEIGHT,
  SINGLE_COLUMN_DRILL_IMAGE_WIDTH_RATIO,
  SKILLS_FOCUS_LABEL_TO_VALUES_GAP,
  SKILLS_FOCUS_TOP_GAP,
} from "./drillPdfLayout";

// Approximate characters per line at fontSize 9 (Helvetica):
//   - Left column (~95 mm after gap reduction + text-priority split): ~68 chars/line
//   - Full page width (~170 mm): ~124 chars/line
//   Derived from empirical calibration of 65 chars at 97 mm, scaled proportionally.
const CHARS_PER_LINE_COL = 68; // left column (description + drill steps)
const CHARS_PER_LINE_FULL = 124; // full width (coaching, shooter, progressions, video)
const CHARS_PER_LINE_PROGRESSION = 112; // progression name + description at larger font size

// Heights in mm for common layout elements
const HEADING_HEIGHT = 7.5; // section heading + compact gap
const LINE_HEIGHT = 3.2; // body text / bullet line
const SECTION_GAP = 2; // gap between sections
const VIDEO_URL_CHARS_PER_LINE = 116;

// Page layout constants (mm, A4 portrait)
const FOOTER_LOGO_Y =
  DRILL_PDF_PAGE_HEIGHT_MM - DRILL_PDF_MARGIN_MM - DRILL_PDF_FOOTER_LOGO_HEIGHT_MM;
const FOOTER_SEPARATOR_Y = FOOTER_LOGO_Y - DRILL_PDF_FOOTER_SEPARATOR_GAP_MM;
const CONTENT_BOTTOM_LIMIT = FOOTER_SEPARATOR_Y - DRILL_PDF_FOOTER_CONTENT_GAP_MM;

// Title header constants (fontSize 16, Helvetica bold)
// LOGO_HEIGHT_MM: minimum header area height set by the logo images.
// TITLE_LINE_HEIGHT_MM: conservative per-line height (actual ~6.49 mm, rounded up for safety).
// TITLE_CHARS_PER_LINE: approximate characters that fit across the title area at fontSize 16.
//   Derived from body text calibration: 54 chars / 81 mm at fontSize 9, scaled to fontSize 16
//   across the ~107 mm gap between the logos (~107 mm * 9/16 / (81/54) ≈ 40 chars/line).
const TITLE_LINE_HEIGHT_MM = 7;
const TITLE_CHARS_PER_LINE = 40;

/**
 * Estimates the height in mm of the PDF title header area for the given drill name.
 * The name is rendered at fontSize 16 between the USA Hockey logos.  When the name
 * wraps beyond the logo height the header expands; otherwise the logo height wins.
 */
function estimateTitleHeaderHeight(drillName: string): number {
  const estimatedLines = Math.max(1, Math.ceil(drillName.length / TITLE_CHARS_PER_LINE));
  return Math.max(DRILL_PDF_HEADER_LOGO_HEIGHT_MM, estimatedLines * TITLE_LINE_HEIGHT_MM);
}

const INLINE_PROGRESSION_IMAGE_HEIGHT = 34;
const DEDICATED_PROGRESSION_IMAGE_HEIGHT = 30;
const CHARS_PER_LINE_PROGRESSION_CARD = 40;
const PROGRESSION_CARD_GAP = 4;
const PROGRESSION_CARD_PADDING = 3;
const PROGRESSION_CARD_TEXT_TOP_OFFSET = 2;
const PROGRESSION_CARD_NAME_BOTTOM_GAP = 2;
const PROGRESSION_SECTION_TITLE_HEIGHT = 8;
const PROGRESSION_HEADER_START_Y = 15;
const PROGRESSION_HEADER_LOGO_GAP = 4;
const PROGRESSION_HEADER_TITLE_GAP = 8;
const PROGRESSION_PAGE_COLUMNS = 2;
export const PROGRESSION_SECTION_MAX_PAGES = 2;

export function estimateSkillsFocusSectionHeight(drillData: DrillData): number {
  const columns: number[] = [];

  if (drillData.tags.fundamental_skill && drillData.tags.fundamental_skill.length > 0) {
    columns.push(SKILLS_FOCUS_LABEL_TO_VALUES_GAP + drillData.tags.fundamental_skill.length * 4);
  }

  if (drillData.tags.skating_skill && drillData.tags.skating_skill.length > 0) {
    columns.push(SKILLS_FOCUS_LABEL_TO_VALUES_GAP + drillData.tags.skating_skill.length * 4);
  }

  if (drillData.tags.game_situations && drillData.tags.game_situations.length > 0) {
    columns.push(SKILLS_FOCUS_LABEL_TO_VALUES_GAP + drillData.tags.game_situations.length * 4);
  }

  return 8 + (columns.length > 0 ? Math.max(...columns) : 0);
}

function estimateLines(text: string, charsPerLine = CHARS_PER_LINE_COL): number {
  return text
    .split("\n")
    .reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
}

function estimateTextHeight(text: string, charsPerLine = CHARS_PER_LINE_COL): number {
  return estimateLines(text, charsPerLine) * LINE_HEIGHT + 1;
}

function estimateProgressionHeight(
  progressionName: string,
  progressionDescription: string,
  charsPerLine = CHARS_PER_LINE_PROGRESSION,
  hasInlineImage = false
): number {
  const nameHeight =
    estimateLines(`• ${progressionName}:`, charsPerLine) * PROGRESSION_TEXT_LINE_HEIGHT + 1;
  const descriptionHeight =
    estimateLines(progressionDescription, charsPerLine) * PROGRESSION_TEXT_LINE_HEIGHT + 1;
  const imageHeight = hasInlineImage
    ? INLINE_PROGRESSION_IMAGE_HEIGHT + PROGRESSION_IMAGE_TEXT_GAP
    : 0;
  return nameHeight + descriptionHeight + imageHeight;
}

function estimateDedicatedProgressionCardHeight(
  progressionName: string,
  progressionDescription: string,
  hasImage: boolean
): number {
  const nameHeight =
    estimateLines(progressionName, CHARS_PER_LINE_PROGRESSION_CARD) * PROGRESSION_TEXT_LINE_HEIGHT;
  const descriptionHeight =
    estimateLines(progressionDescription, CHARS_PER_LINE_PROGRESSION_CARD) *
    PROGRESSION_TEXT_LINE_HEIGHT;
  const imageHeight = hasImage
    ? DEDICATED_PROGRESSION_IMAGE_HEIGHT + PROGRESSION_IMAGE_TEXT_GAP
    : 0;
  return (
    PROGRESSION_CARD_PADDING * 2 +
    PROGRESSION_CARD_TEXT_TOP_OFFSET +
    nameHeight +
    PROGRESSION_CARD_NAME_BOTTOM_GAP +
    imageHeight +
    descriptionHeight
  );
}

function estimateDedicatedProgressionColumnCapacity(drillName: string): number {
  const titleHeaderHeight = estimateTitleHeaderHeight(drillName);
  const progressionContentStartY =
    PROGRESSION_HEADER_START_Y +
    titleHeaderHeight +
    PROGRESSION_HEADER_LOGO_GAP +
    PROGRESSION_HEADER_TITLE_GAP +
    PROGRESSION_SECTION_TITLE_HEIGHT;
  return CONTENT_BOTTOM_LIMIT - progressionContentStartY;
}

function estimateDedicatedProgressionPages(
  drillName: string,
  progressions: NonNullable<DrillData["drill_progressions"]>
): number {
  if (progressions.length === 0) {
    return 0;
  }

  const hasProgressionVideo = progressions.some((progression) => !!progression.progression_video);
  const columnCapacity = estimateDedicatedProgressionColumnCapacity(drillName);
  const cardMeasurements = progressions.map((progression) => {
    const preferredHeight = estimateDedicatedProgressionCardHeight(
      progression.progression_name,
      progression.progression_description,
      !!progression.progression_image
    );
    const compactHeight = progression.progression_image
      ? estimateDedicatedProgressionCardHeight(
          progression.progression_name,
          progression.progression_description,
          false
        )
      : undefined;
    return { preferredHeight, compactHeight };
  });

  return planDedicatedProgressionCards(cardMeasurements, {
    columnCapacity,
    firstPageColumnCapacity:
      columnCapacity - (hasProgressionVideo ? PROGRESSION_VIDEO_NOTE_HEIGHT : 0),
    columns: PROGRESSION_PAGE_COLUMNS,
    cardGap: PROGRESSION_CARD_GAP,
    maxPages: PROGRESSION_SECTION_MAX_PAGES,
  }).pagesUsed;
}

export function estimateDedicatedProgressionSectionPages(drillData: DrillData): number {
  const progressions = drillData.drill_progressions || [];
  return estimateDedicatedProgressionPages(drillData.name, progressions);
}

interface EstimateOptions {
  forceInlineProgressions: boolean;
  forceSecondPageForProgressions: boolean;
  accountForProgressionVideoNote: boolean;
}

type FirstPageLayoutMode = "two-column" | "full-width";

interface FirstPageEstimateOptions extends EstimateOptions {
  layoutMode: FirstPageLayoutMode;
  drillImageAspectRatio?: number;
}

const DEFAULT_DRILL_IMAGE_ASPECT_RATIO = 16 / 9;

function getFirstPageLayoutMetrics(drillName: string): {
  availableFirstPage: number;
  availableOtherPages: number;
} {
  const titleHeaderHeight = estimateTitleHeaderHeight(drillName);
  const contentStartY =
    DRILL_PDF_HEADER_START_Y_MM +
    titleHeaderHeight +
    DRILL_PDF_HEADER_LOGO_BOTTOM_GAP_MM +
    DRILL_PDF_HEADER_SEPARATOR_BOTTOM_GAP_MM +
    DRILL_PDF_TAGS_HEIGHT_MM;
  return {
    availableFirstPage: CONTENT_BOTTOM_LIMIT - contentStartY,
    availableOtherPages:
      CONTENT_BOTTOM_LIMIT - (DRILL_PDF_MARGIN_MM + DRILL_PDF_NEW_PAGE_TOP_GAP_MM),
  };
}

function chooseFirstPageLayoutMode(
  drillData: DrillData,
  normalizedDescription: string,
  availableFirstPage: number,
  options: EstimateOptions
): FirstPageLayoutMode {
  const fullWidthFirstPageHeight = estimateFirstPageSegmentHeight(
    drillData,
    normalizedDescription,
    {
      layoutMode: "full-width",
      forceInlineProgressions: options.forceInlineProgressions,
      forceSecondPageForProgressions: options.forceSecondPageForProgressions,
      accountForProgressionVideoNote: options.accountForProgressionVideoNote,
    }
  );
  return fullWidthFirstPageHeight <= availableFirstPage ? "full-width" : "two-column";
}

function estimateTopPhaseHeight(
  drillData: DrillData,
  normalizedDescription: string,
  layoutMode: FirstPageLayoutMode,
  drillImageAspectRatio?: number
): number {
  let topPhaseHeight = 0;

  if (layoutMode === "two-column") {
    // Existing layout: drill information in left column, image in right column.
    topPhaseHeight += HEADING_HEIGHT;
    if (normalizedDescription) {
      topPhaseHeight += estimateLines(normalizedDescription, CHARS_PER_LINE_COL) * LINE_HEIGHT;
    }

    const drillStepLines = drillMarkdownToPlainLines(drillData.drill_steps, {
      treatAsDrillSteps: true,
    });
    if (drillStepLines.length > 0) {
      topPhaseHeight += SECTION_GAP;
      for (const stepLine of drillStepLines) {
        topPhaseHeight += estimateTextHeight(stepLine, CHARS_PER_LINE_COL);
      }
      topPhaseHeight += 1.5;
    } else {
      topPhaseHeight += SECTION_GAP;
    }
  } else {
    // Single-column layout: diagram full width first, then drill information below.
    topPhaseHeight += HEADING_HEIGHT;
    if (normalizedDescription) {
      topPhaseHeight += estimateLines(normalizedDescription, CHARS_PER_LINE_FULL) * LINE_HEIGHT;
    }

    const drillStepLines = drillMarkdownToPlainLines(drillData.drill_steps, {
      treatAsDrillSteps: true,
    });
    if (drillStepLines.length > 0) {
      topPhaseHeight += SECTION_GAP;
      for (const stepLine of drillStepLines) {
        topPhaseHeight += estimateTextHeight(stepLine, CHARS_PER_LINE_FULL);
      }
      topPhaseHeight += 1.5;
    } else {
      topPhaseHeight += SECTION_GAP;
    }

    if (drillData.drill_image) {
      const fullWidth = (210 - 2 * DRILL_PDF_MARGIN_MM) * SINGLE_COLUMN_DRILL_IMAGE_WIDTH_RATIO;
      const aspectRatio =
        drillImageAspectRatio && drillImageAspectRatio > 0
          ? drillImageAspectRatio
          : DEFAULT_DRILL_IMAGE_ASPECT_RATIO;
      topPhaseHeight += fullWidth / aspectRatio + 4;
    }
  }

  return topPhaseHeight;
}

function estimateFirstPageSegmentHeight(
  drillData: DrillData,
  normalizedDescription: string,
  options: FirstPageEstimateOptions
): number {
  // --- Top phase: primary diagram + drill information ---
  const topPhaseHeight = estimateTopPhaseHeight(
    drillData,
    normalizedDescription,
    options.layoutMode,
    options.drillImageAspectRatio
  );

  // --- Full-width sections before progressions: coaching + shooter ---
  let preProgressionHeight = 0;
  preProgressionHeight += HEADING_HEIGHT;
  const coachingLines = drillMarkdownToPlainLines(drillData.coaching_focus_points);
  for (const line of coachingLines) {
    preProgressionHeight += estimateTextHeight(line, CHARS_PER_LINE_FULL);
  }

  if (drillData.shooter_focus_points) {
    const shooterLines = drillMarkdownToPlainLines(drillData.shooter_focus_points);
    preProgressionHeight += SECTION_GAP + HEADING_HEIGHT;
    for (const line of shooterLines) {
      preProgressionHeight += estimateTextHeight(line, CHARS_PER_LINE_FULL);
    }
  }

  // --- Progressions section ---
  const progressions = drillData.drill_progressions || [];
  const includeInlineProgressions =
    progressions.length > 0 && !options.forceSecondPageForProgressions;

  let progressionHeight = 0;
  if (includeInlineProgressions) {
    progressionHeight += SECTION_GAP + HEADING_HEIGHT;
    if (
      options.accountForProgressionVideoNote &&
      progressions.some((progression) => !!progression.progression_video)
    ) {
      progressionHeight += PROGRESSION_VIDEO_NOTE_HEIGHT;
    }
    for (const progression of progressions) {
      const hasInlineImage = options.forceInlineProgressions && !!progression.progression_image;
      progressionHeight += estimateProgressionHeight(
        drillMarkdownToPlainLines(progression.progression_name).join(" "),
        drillMarkdownToPlainLines(progression.progression_description).join(" "),
        undefined,
        hasInlineImage
      );
    }
  }

  // --- Post-progression content: Skills Focus + optional Video ---
  const videoSectionHeight = drillData.video
    ? DRILL_VIDEO_SECTION_TOP_GAP_MM +
      DRILL_VIDEO_SEPARATOR_TITLE_SPACING_MM +
      Math.max(
        estimateLines(drillData.video.trim(), VIDEO_URL_CHARS_PER_LINE) *
          PROGRESSION_TEXT_LINE_HEIGHT,
        DRILL_VIDEO_QR_FLOW_CLEARANCE_MM
      )
    : 0;
  const postProgressionHeight =
    SKILLS_FOCUS_TOP_GAP + estimateSkillsFocusSectionHeight(drillData) + videoSectionHeight;

  return topPhaseHeight + preProgressionHeight + progressionHeight + postProgressionHeight;
}

export function shouldUseFullWidthFirstPageDiagram(
  drillData: DrillData,
  drillImageAspectRatio?: number
): boolean {
  const { availableFirstPage } = getFirstPageLayoutMetrics(drillData.name);
  const normalizedDescription = drillData.description
    ? drillMarkdownToPlainLines(drillData.description).join("\n")
    : "";
  const placeProgressionsOnSecondPage = shouldPlaceProgressionsOnSecondPage(drillData);

  const fullWidthFirstPageHeight = estimateFirstPageSegmentHeight(
    drillData,
    normalizedDescription,
    {
      layoutMode: "full-width",
      drillImageAspectRatio,
      forceInlineProgressions: !placeProgressionsOnSecondPage,
      forceSecondPageForProgressions: placeProgressionsOnSecondPage,
      accountForProgressionVideoNote: !placeProgressionsOnSecondPage,
    }
  );

  return fullWidthFirstPageHeight <= availableFirstPage;
}

function estimateDrillPdfPagesInternal(drillData: DrillData, options: EstimateOptions): number {
  const { availableFirstPage, availableOtherPages } = getFirstPageLayoutMetrics(drillData.name);
  const normalizedDescription = drillData.description
    ? drillMarkdownToPlainLines(drillData.description).join("\n")
    : "";
  const progressions = drillData.drill_progressions || [];
  const hasProgressions = progressions.length > 0;
  const layoutMode = chooseFirstPageLayoutMode(
    drillData,
    normalizedDescription,
    availableFirstPage,
    options
  );

  const firstSegmentHeight = estimateFirstPageSegmentHeight(drillData, normalizedDescription, {
    layoutMode,
    forceInlineProgressions: options.forceInlineProgressions,
    forceSecondPageForProgressions: options.forceSecondPageForProgressions,
    accountForProgressionVideoNote: options.accountForProgressionVideoNote,
  });

  // All content in normal flow (single continuous pagination model)
  if (!hasProgressions || !options.forceSecondPageForProgressions) {
    return firstSegmentHeight <= availableFirstPage
      ? 1
      : 1 + Math.ceil((firstSegmentHeight - availableFirstPage) / availableOtherPages);
  }

  // Forced page break right before progressions.
  // In generateDrillPdf, Skills Focus + Video render before the dedicated
  // progression page, so they belong to the first segment estimate.
  const firstSegmentWithoutProgressions = estimateFirstPageSegmentHeight(
    { ...drillData, drill_progressions: [] },
    normalizedDescription,
    {
      layoutMode: chooseFirstPageLayoutMode(
        { ...drillData, drill_progressions: [] },
        normalizedDescription,
        availableFirstPage,
        {
          forceInlineProgressions: false,
          forceSecondPageForProgressions: true,
          accountForProgressionVideoNote: false,
        }
      ),
      forceInlineProgressions: false,
      forceSecondPageForProgressions: true,
      accountForProgressionVideoNote: false,
    }
  );
  const firstSegmentPages =
    firstSegmentWithoutProgressions <= availableFirstPage
      ? 1
      : 1 + Math.ceil((firstSegmentWithoutProgressions - availableFirstPage) / availableOtherPages);
  // Dedicated progression pages use a dynamic 2-column card layout in generateDrillPdf.
  const secondSegmentPages = estimateDedicatedProgressionPages(drillData.name, progressions);

  return firstSegmentPages + secondSegmentPages;
}

export function shouldPlaceProgressionsOnSecondPage(drillData: DrillData): boolean {
  const hasProgressions = !!drillData.drill_progressions && drillData.drill_progressions.length > 0;
  if (!hasProgressions) {
    return false;
  }

  return (
    estimateDrillPdfPagesInternal(drillData, {
      forceInlineProgressions: true,
      forceSecondPageForProgressions: false,
      // The aggregate note participates in normal pagination, but a progression
      // video alone must not switch the drill to dedicated progression pages.
      accountForProgressionVideoNote: false,
    }) > 1
  );
}

export interface DrillPageEstimate {
  mainContentPages: number;
  dedicatedProgressionPages: number;
  totalPages: number;
}

/**
 * Estimates how many PDF pages a drill will need when rendered by generateDrillPdf.
 *
 * This is a heuristic based on approximate text measurements — not pixel-perfect — but
 * it reliably identifies drills whose content exceeds what fits on one page.
 *
 * Layout model:
 *   1. Two-column phase (equal ~81 mm columns): left = Drill Information (desc + steps),
 *      right = image. Height = left column text height (image is bounded by page height).
 *   2. Full-width sections (~170 mm): Coaching Focus Points, Shooter Focus Points,
 *      Drill Progressions. Each uses a wider chars-per-line estimate.
 *   3. Post-column: Skills Focus + optional Video (full width, unchanged).
 *
 * Returns a breakdown of page usage:
 *   - mainContentPages: pages used by non-dedicated main-flow content, including inline
 *     progressions when they remain on the main flow
 *   - dedicatedProgressionPages: pages used exclusively for dedicated progression cards
 *   - totalPages: mainContentPages + dedicatedProgressionPages
 */
export function estimateDrillPdfPages(drillData: DrillData): DrillPageEstimate {
  const placeOnSecondPage = shouldPlaceProgressionsOnSecondPage(drillData);
  const progressions = drillData.drill_progressions || [];
  if (!placeOnSecondPage) {
    const inlinePages = estimateDrillPdfPagesInternal(drillData, {
      forceInlineProgressions: true,
      forceSecondPageForProgressions: false,
      accountForProgressionVideoNote: true,
    });

    return {
      mainContentPages: inlinePages,
      dedicatedProgressionPages: 0,
      totalPages: inlinePages,
    };
  }

  const normalizedDescription = drillData.description
    ? drillMarkdownToPlainLines(drillData.description).join("\n")
    : "";
  const { availableFirstPage, availableOtherPages } = getFirstPageLayoutMetrics(drillData.name);

  // Calculate main content pages (first segment without progressions)
  const firstSegmentWithoutProgressions = estimateFirstPageSegmentHeight(
    { ...drillData, drill_progressions: [] },
    normalizedDescription,
    {
      layoutMode: chooseFirstPageLayoutMode(
        { ...drillData, drill_progressions: [] },
        normalizedDescription,
        availableFirstPage,
        {
          forceInlineProgressions: false,
          forceSecondPageForProgressions: true,
          accountForProgressionVideoNote: false,
        }
      ),
      forceInlineProgressions: false,
      forceSecondPageForProgressions: true,
      accountForProgressionVideoNote: false,
    }
  );

  const mainContentPages =
    firstSegmentWithoutProgressions <= availableFirstPage
      ? 1
      : 1 + Math.ceil((firstSegmentWithoutProgressions - availableFirstPage) / availableOtherPages);

  // Calculate dedicated progression pages
  const dedicatedProgressionPages = placeOnSecondPage
    ? estimateDedicatedProgressionPages(drillData.name, progressions)
    : 0;

  return {
    mainContentPages,
    dedicatedProgressionPages,
    totalPages: mainContentPages + dedicatedProgressionPages,
  };
}
