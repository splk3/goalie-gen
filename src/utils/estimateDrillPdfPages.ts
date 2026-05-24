import type { DrillData } from "../types/drill";
import { planDedicatedProgressionCards } from "./drillPdfPaginationShared";
import { normalizeDrillDescription } from "./normalizeDrillDescription";

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
const SEPARATOR_AND_GAP = 8; // horizontal rule + spacing
export const SKILLS_FOCUS_TOP_GAP = 4;
export const PROGRESSION_TEXT_FONT_SIZE = 10;
export const PROGRESSION_TEXT_LINE_HEIGHT = 4;
export const PROGRESSION_IMAGE_TEXT_GAP = 4;

// Page layout constants (mm, A4 portrait)
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const GOLD_LOGO_HEIGHT = 16;
const FOOTER_LOGO_Y = PAGE_HEIGHT - MARGIN - GOLD_LOGO_HEIGHT;
const FOOTER_SEPARATOR_Y = FOOTER_LOGO_Y - 4;
const CONTENT_BOTTOM_LIMIT = FOOTER_SEPARATOR_Y - 8;

// Title header constants (fontSize 16, Helvetica bold)
// LOGO_HEIGHT_MM: minimum header area height set by the logo images.
// TITLE_LINE_HEIGHT_MM: conservative per-line height (actual ~6.49 mm, rounded up for safety).
// TITLE_CHARS_PER_LINE: approximate characters that fit across the title area at fontSize 16.
//   Derived from body text calibration: 54 chars / 81 mm at fontSize 9, scaled to fontSize 16
//   across the ~107 mm gap between the logos (~107 mm * 9/16 / (81/54) ≈ 40 chars/line).
const LOGO_HEIGHT_MM = 16;
const TITLE_LINE_HEIGHT_MM = 7;
const TITLE_CHARS_PER_LINE = 40;

// Fixed overhead consumed by everything EXCEPT the title area:
//   initial Y offset + gap after logos + red separator gap + tags rows.
// HEADER_AND_TAGS_BASE = LOGO_HEIGHT_MM (16) contributes the minimum title area height,
// so the overhead is the former fixed constant (52) minus that minimum (16) = 36.
const HEADER_AND_TAGS_BASE = 36;

/**
 * Estimates the height in mm of the PDF title header area for the given drill name.
 * The name is rendered at fontSize 16 between the USA Hockey logos.  When the name
 * wraps beyond the logo height the header expands; otherwise the logo height wins.
 */
function estimateTitleHeaderHeight(drillName: string): number {
  const estimatedLines = Math.max(1, Math.ceil(drillName.length / TITLE_CHARS_PER_LINE));
  return Math.max(LOGO_HEIGHT_MM, estimatedLines * TITLE_LINE_HEIGHT_MM);
}

const INLINE_PROGRESSION_IMAGE_HEIGHT = 34;
const DEDICATED_PROGRESSION_IMAGE_HEIGHT = 30;
const CHARS_PER_LINE_PROGRESSION_CARD = 52;
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
    columns.push(3 + drillData.tags.fundamental_skill.length * 3);
  }

  if (drillData.tags.skating_skill && drillData.tags.skating_skill.length > 0) {
    columns.push(3 + drillData.tags.skating_skill.length * 3);
  }

  if (drillData.tags.game_situations && drillData.tags.game_situations.length > 0) {
    columns.push(3 + drillData.tags.game_situations.length * 3);
  }

  return 7 + (columns.length > 0 ? Math.max(...columns) : 0);
}

function estimateLines(text: string, charsPerLine = CHARS_PER_LINE_COL): number {
  return text
    .split("\n")
    .reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
}

function estimateBulletHeight(text: string, charsPerLine = CHARS_PER_LINE_COL): number {
  return estimateLines(`• ${text}`, charsPerLine) * LINE_HEIGHT + 1;
}

function estimateNumberedHeight(
  text: string,
  index: number,
  charsPerLine = CHARS_PER_LINE_COL
): number {
  return estimateLines(`${index + 1}. ${text}`, charsPerLine) * LINE_HEIGHT + 1;
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
  const contentStartY = MARGIN + titleHeaderHeight + HEADER_AND_TAGS_BASE;
  return {
    availableFirstPage: CONTENT_BOTTOM_LIMIT - contentStartY,
    availableOtherPages: CONTENT_BOTTOM_LIMIT - (MARGIN + 5),
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
    }
  );
  return fullWidthFirstPageHeight <= availableFirstPage ? "full-width" : "two-column";
}

function estimateFirstPageSegmentHeight(
  drillData: DrillData,
  normalizedDescription: string,
  options: FirstPageEstimateOptions
): number {
  // --- Top phase: primary diagram + drill information (single-column) ---
  let topPhaseHeight = 0;

  if (options.layoutMode === "two-column") {
    // Existing layout: drill information in left column, image in right column.
    topPhaseHeight += HEADING_HEIGHT;
    if (normalizedDescription) {
      topPhaseHeight += estimateLines(normalizedDescription, CHARS_PER_LINE_COL) * LINE_HEIGHT;
    }

    if (drillData.drill_steps.length > 0) {
      topPhaseHeight += SECTION_GAP;
      for (const [index, step] of drillData.drill_steps.entries()) {
        topPhaseHeight += estimateNumberedHeight(step, index, CHARS_PER_LINE_COL);
      }
      topPhaseHeight += 1.5;
    } else {
      topPhaseHeight += SECTION_GAP;
    }
  } else {
    // New mode: diagram full width first, then drill information full width below.
    topPhaseHeight += HEADING_HEIGHT;
    if (normalizedDescription) {
      topPhaseHeight += estimateLines(normalizedDescription, CHARS_PER_LINE_FULL) * LINE_HEIGHT;
    }

    if (drillData.drill_steps.length > 0) {
      topPhaseHeight += SECTION_GAP;
      for (const [index, step] of drillData.drill_steps.entries()) {
        topPhaseHeight += estimateNumberedHeight(step, index, CHARS_PER_LINE_FULL);
      }
      topPhaseHeight += 1.5;
    } else {
      topPhaseHeight += SECTION_GAP;
    }

    if (drillData.drill_image) {
      const fullWidth = 210 - 2 * MARGIN;
      const aspectRatio =
        options.drillImageAspectRatio && options.drillImageAspectRatio > 0
          ? options.drillImageAspectRatio
          : DEFAULT_DRILL_IMAGE_ASPECT_RATIO;
      topPhaseHeight += fullWidth / aspectRatio + 4;
    }
  }

  // --- Full-width sections before progressions: coaching + shooter ---
  let preProgressionHeight = 0;
  preProgressionHeight += HEADING_HEIGHT;
  for (const point of drillData.coaching_focus_points) {
    preProgressionHeight += estimateBulletHeight(point, CHARS_PER_LINE_FULL);
  }

  if (drillData.shooter_focus_points && drillData.shooter_focus_points.length > 0) {
    preProgressionHeight += SECTION_GAP + HEADING_HEIGHT;
    for (const point of drillData.shooter_focus_points) {
      preProgressionHeight += estimateBulletHeight(point, CHARS_PER_LINE_FULL);
    }
  }

  // --- Progressions section ---
  const progressions = drillData.drill_progressions || [];
  const includeInlineProgressions =
    progressions.length > 0 && !options.forceSecondPageForProgressions;

  let progressionHeight = 0;
  if (includeInlineProgressions) {
    progressionHeight += SECTION_GAP + HEADING_HEIGHT;
    for (const progression of progressions) {
      const hasInlineImage = options.forceInlineProgressions && !!progression.progression_image;
      progressionHeight += estimateProgressionHeight(
        progression.progression_name,
        progression.progression_description,
        undefined,
        hasInlineImage
      );
    }
  }

  // --- Post-progression content: Skills Focus + optional Video ---
  const videoSectionHeight = drillData.video
    ? 7 + estimateLines(drillData.video, CHARS_PER_LINE_FULL) * LINE_HEIGHT
    : 0;
  const postProgressionHeight =
    SEPARATOR_AND_GAP + estimateSkillsFocusSectionHeight(drillData) + videoSectionHeight;

  return topPhaseHeight + preProgressionHeight + progressionHeight + postProgressionHeight;
}

export function shouldUseFullWidthFirstPageDiagram(
  drillData: DrillData,
  drillImageAspectRatio?: number
): boolean {
  const { availableFirstPage } = getFirstPageLayoutMetrics(drillData.name);
  const normalizedDescription = drillData.description
    ? normalizeDrillDescription(drillData.description)
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
    }
  );

  return fullWidthFirstPageHeight <= availableFirstPage;
}

function estimateDrillPdfPagesInternal(drillData: DrillData, options: EstimateOptions): number {
  const { availableFirstPage, availableOtherPages } = getFirstPageLayoutMetrics(drillData.name);
  const normalizedDescription = drillData.description
    ? normalizeDrillDescription(drillData.description)
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
        }
      ),
      forceInlineProgressions: false,
      forceSecondPageForProgressions: true,
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
 *   - mainContentPages: pages used by drill description, steps, coaching focus, and video (excluding dedicated progressions)
 *   - dedicatedProgressionPages: pages used exclusively for dedicated progression cards
 *   - totalPages: mainContentPages + dedicatedProgressionPages
 */
export function estimateDrillPdfPages(drillData: DrillData): DrillPageEstimate {
  const placeOnSecondPage = shouldPlaceProgressionsOnSecondPage(drillData);
  const progressions = drillData.drill_progressions || [];
  const normalizedDescription = drillData.description
    ? normalizeDrillDescription(drillData.description)
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
        }
      ),
      forceInlineProgressions: false,
      forceSecondPageForProgressions: true,
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
