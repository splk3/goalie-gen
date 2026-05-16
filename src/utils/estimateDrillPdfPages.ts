import type { DrillData } from "../types/drill";
import { normalizeDrillDescription } from "./normalizeDrillDescription";

// Approximate characters per line at fontSize 9 (Helvetica):
//   - Left column (~81 mm, equal 50/50 columns): ~54 chars/line
//   - Full page width (~170 mm): ~114 chars/line
//   Derived from empirical calibration of 65 chars at 97 mm, scaled proportionally.
const CHARS_PER_LINE_COL = 54; // left column (description + drill steps)
const CHARS_PER_LINE_FULL = 114; // full width (coaching, shooter, progressions, video)

// Heights in mm for common layout elements
const HEADING_HEIGHT = 9; // section heading + smaller gap (was 10)
const LINE_HEIGHT = 4; // body text / bullet line
const SECTION_GAP = 3; // gap between sections (was 5)
const SEPARATOR_AND_GAP = 8; // horizontal rule + spacing (was 10)

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

// Fixed estimate for the Skills Focus section (separator + heading + skills list)
const SKILLS_SECTION_HEIGHT = 26;
const INLINE_PROGRESSION_IMAGE_HEIGHT = 34;

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
  charsPerLine = CHARS_PER_LINE_FULL,
  hasInlineImage = false
): number {
  const nameHeight = estimateLines(`• ${progressionName}:`, charsPerLine) * LINE_HEIGHT + 1;
  const descriptionHeight = estimateLines(progressionDescription, charsPerLine) * LINE_HEIGHT + 1;
  const imageHeight = hasInlineImage ? INLINE_PROGRESSION_IMAGE_HEIGHT : 0;
  return nameHeight + descriptionHeight + imageHeight;
}

interface EstimateOptions {
  forceInlineProgressions: boolean;
  forceSecondPageForProgressions: boolean;
}

function estimateDrillPdfPagesInternal(drillData: DrillData, options: EstimateOptions): number {
  const titleHeaderHeight = estimateTitleHeaderHeight(drillData.name);
  const contentStartY = MARGIN + titleHeaderHeight + HEADER_AND_TAGS_BASE;
  const availableFirstPage = CONTENT_BOTTOM_LIMIT - contentStartY;
  const availableOtherPages = CONTENT_BOTTOM_LIMIT - (MARGIN + 5);
  const normalizedDescription = drillData.description
    ? normalizeDrillDescription(drillData.description)
    : "";
  const progressions = drillData.drill_progressions || [];
  const hasProgressions = progressions.length > 0;

  // --- Two-column phase: Drill Information (description + steps) in left column ---
  let twoColHeight = 0;

  // "Drill Information" heading (always present)
  twoColHeight += HEADING_HEIGHT;
  // Description text (optional)
  if (normalizedDescription) {
    twoColHeight += estimateLines(normalizedDescription, CHARS_PER_LINE_COL) * LINE_HEIGHT;
  }

  // Drill steps (required)
  const hasDrillSteps = drillData.drill_steps.length > 0;
  if (hasDrillSteps) {
    twoColHeight += SECTION_GAP;
    for (const [index, step] of drillData.drill_steps.entries()) {
      twoColHeight += estimateNumberedHeight(step, index, CHARS_PER_LINE_COL);
    }
    twoColHeight += 2;
  } else {
    twoColHeight += SECTION_GAP;
  }

  // --- Full-width sections before progressions: coaching + shooter ---
  let preProgressionHeight = 0;

  // Coaching focus points (always present)
  preProgressionHeight += HEADING_HEIGHT;
  for (const point of drillData.coaching_focus_points) {
    preProgressionHeight += estimateBulletHeight(point, CHARS_PER_LINE_FULL);
  }

  // Shooter focus points (optional)
  if (drillData.shooter_focus_points && drillData.shooter_focus_points.length > 0) {
    preProgressionHeight += SECTION_GAP + HEADING_HEIGHT;
    for (const point of drillData.shooter_focus_points) {
      preProgressionHeight += estimateBulletHeight(point, CHARS_PER_LINE_FULL);
    }
  }

  // --- Progressions section ---
  let progressionHeight = 0;
  if (hasProgressions) {
    progressionHeight += SECTION_GAP + HEADING_HEIGHT;
    for (const progression of progressions) {
      const hasInlineImage = options.forceInlineProgressions && !!progression.progression_image;
      progressionHeight += estimateProgressionHeight(
        progression.progression_name,
        progression.progression_description,
        CHARS_PER_LINE_FULL,
        hasInlineImage
      );
    }
  }

  // --- Post-progression content: Skills Focus + optional Video ---
  const videoSectionHeight = drillData.video
    ? 9 + estimateLines(drillData.video, CHARS_PER_LINE_FULL) * LINE_HEIGHT
    : 0;
  const postProgressionHeight = SEPARATOR_AND_GAP + SKILLS_SECTION_HEIGHT + videoSectionHeight;

  // All content in normal flow (single continuous pagination model)
  if (!hasProgressions || !options.forceSecondPageForProgressions) {
    const totalNeeded =
      twoColHeight + preProgressionHeight + progressionHeight + postProgressionHeight;
    return totalNeeded <= availableFirstPage
      ? 1
      : 1 + Math.ceil((totalNeeded - availableFirstPage) / availableOtherPages);
  }

  // Forced page break right before progressions
  const firstSegmentHeight = twoColHeight + preProgressionHeight;
  const firstSegmentPages =
    firstSegmentHeight <= availableFirstPage
      ? 1
      : 1 + Math.ceil((firstSegmentHeight - availableFirstPage) / availableOtherPages);
  const secondSegmentHeight = progressionHeight + postProgressionHeight;
  const secondSegmentPages = Math.max(1, Math.ceil(secondSegmentHeight / availableOtherPages));

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
 * Returns 1 when content is estimated to fit on a single page, 2+ otherwise.
 */
export function estimateDrillPdfPages(drillData: DrillData): number {
  const placeOnSecondPage = shouldPlaceProgressionsOnSecondPage(drillData);
  return estimateDrillPdfPagesInternal(drillData, {
    forceInlineProgressions: !placeOnSecondPage,
    forceSecondPageForProgressions: placeOnSecondPage,
  });
}
