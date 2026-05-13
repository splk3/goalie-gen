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

// Approximate height consumed by the page header (logos + drill name title) and tags.
// The drill name is now rendered in the header area instead of as a separate block,
// so the total is smaller than before.
const HEADER_AND_TAGS_HEIGHT = 52;

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
  const contentStartY = MARGIN + HEADER_AND_TAGS_HEIGHT;
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
