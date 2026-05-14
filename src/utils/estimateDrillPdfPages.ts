import type { DrillData } from "../types/drill";
import { normalizeDrillDescription } from "./normalizeDrillDescription";

// Approximate characters per line in the wider left column at fontSize 9
// (helvetica, ~97 mm wide — 29% wider than before, so ~29% more chars per line)
const CHARS_PER_LINE = 65;
const VIDEO_CHARS_PER_LINE = 110;

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
//   Derived from body text calibration: 65 chars / 97 mm at fontSize 9, scaled to fontSize 16
//   across the ~107 mm gap between the logos (~107 mm * 9/16 / (97/65) ≈ 40 chars/line).
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
const SKILLS_SECTION_HEIGHT = 30;

function estimateLines(text: string, charsPerLine = CHARS_PER_LINE): number {
  return text
    .split("\n")
    .reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
}

function estimateBulletHeight(text: string): number {
  return estimateLines(`• ${text}`) * LINE_HEIGHT + 1;
}

function estimateNumberedHeight(text: string, index: number): number {
  return estimateLines(`${index + 1}. ${text}`) * LINE_HEIGHT + 1;
}

/**
 * Estimates how many PDF pages a drill will need when rendered by generateDrillPdf.
 *
 * This is a heuristic based on approximate text measurements — not pixel-perfect — but
 * it reliably identifies drills whose left-column content and post-column sections (skills,
 * video) together exceed what fits on one page.
 *
 * Returns 1 when content is estimated to fit on a single page, 2+ otherwise.
 */
export function estimateDrillPdfPages(drillData: DrillData): number {
  const titleHeaderHeight = estimateTitleHeaderHeight(drillData.name);
  const contentStartY = MARGIN + titleHeaderHeight + HEADER_AND_TAGS_BASE;
  const availableFirstPage = CONTENT_BOTTOM_LIMIT - contentStartY;
  const availableOtherPages = CONTENT_BOTTOM_LIMIT - (MARGIN + 5);
  const normalizedDescription = normalizeDrillDescription(drillData.description);

  // Estimate left column height
  let leftColHeight = 0;

  // Description
  leftColHeight += HEADING_HEIGHT;
  leftColHeight += estimateLines(normalizedDescription) * LINE_HEIGHT;

  // Drill steps (optional, no heading)
  const hasDrillSteps = Boolean(drillData.drill_steps && drillData.drill_steps.length > 0);
  if (hasDrillSteps) {
    leftColHeight += SECTION_GAP;
    for (const [index, step] of drillData.drill_steps.entries()) {
      leftColHeight += estimateNumberedHeight(step, index);
    }
    leftColHeight += 2;
  }

  if (!hasDrillSteps) {
    leftColHeight += SECTION_GAP;
  }

  // Coaching focus points
  leftColHeight += HEADING_HEIGHT;
  for (const point of drillData.coaching_focus_points) {
    leftColHeight += estimateBulletHeight(point);
  }

  // Shooter focus points (optional)
  if (drillData.shooter_focus_points && drillData.shooter_focus_points.length > 0) {
    leftColHeight += SECTION_GAP + HEADING_HEIGHT;
    for (const point of drillData.shooter_focus_points) {
      leftColHeight += estimateBulletHeight(point);
    }
  }

  // Drill progressions (optional)
  if (drillData.drill_progressions && drillData.drill_progressions.length > 0) {
    leftColHeight += SECTION_GAP + HEADING_HEIGHT;
    for (const step of drillData.drill_progressions) {
      leftColHeight += estimateBulletHeight(step);
    }
  }

  // Sections below the two-column layout. Video is now URL-only (no thumbnail).
  const videoSectionHeight = drillData.video
    ? 9 + estimateLines(drillData.video, VIDEO_CHARS_PER_LINE) * LINE_HEIGHT
    : 0;
  const postColumnHeight = SEPARATOR_AND_GAP + SKILLS_SECTION_HEIGHT + videoSectionHeight;

  const totalNeeded = leftColHeight + postColumnHeight;

  if (totalNeeded <= availableFirstPage) {
    return 1;
  }

  return 1 + Math.ceil((totalNeeded - availableFirstPage) / availableOtherPages);
}
