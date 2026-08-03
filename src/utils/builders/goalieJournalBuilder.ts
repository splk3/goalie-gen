/**
 * Platform-agnostic Goalie Journal PDF builder.
 *
 * This builder contains the canonical jsPDF page assembly logic. Platform-specific
 * concerns (loading the logo image, resolving dimensions) are injected as pre-resolved
 * data so the same builder runs unchanged in both the browser and Node.
 */
import { parseMarkdown, type MarkdownBlock } from "../markdownParser";
import { parseInlineMarkdown, type InlineMarkdownSegment } from "../inlineMarkdown";
import type {
  GoalieJournalConfig,
  GoalieJournalContent,
  JournalLogoData,
} from "../../types/generatorConfig";
import {
  DEFAULT_PRIMARY_TEAM_COLOR,
  DEFAULT_SECONDARY_TEAM_COLOR,
  normalizeHexRgbColor,
} from "../teamColors";
import { JOURNAL_SEASON_GOAL_COUNT, normalizeJournalSeasonGoals } from "../generatorDefaults";
import { extractLevel3Section } from "../generatorDefaults";
import {
  GOALIE_JOURNAL_COVER_PROMOTION_LINES,
  GOALIE_JOURNAL_PROMOTION_URL,
} from "../goalieJournalPromotion";

type JsPdfModule = typeof import("jspdf");

type JournalDocument = InstanceType<JsPdfModule["jsPDF"]>;

const JOURNAL_CONTENT_START_Y = 31;
const JOURNAL_CONTENT_PARAGRAPH_GAP = 3;
const ACKNOWLEDGEMENTS_SECTION_GAP = 4;
const ACKNOWLEDGEMENTS_GOLD_GAP = 2;
const SEASON_GOALS_START_Y = 32;
const ENTERED_SEASON_GOAL_MIN_STEP = 10;
const ENTERED_SEASON_GOAL_TEXT_GAP = 5;
const ENTERED_SEASON_GOAL_END_TRIM = 4;
const WRITE_IN_SEASON_GOAL_STEP = 21;
const WRITE_IN_SEASON_GOAL_LINE_GAP = 8;
const END_OF_SEASON_ANSWER_LINES = 2;
const END_OF_SEASON_LINE_SPACING = 6;
const END_OF_SEASON_BLOCK_PADDING = 8;
const JOURNAL_ENTRIES_PER_PAGE = 3;
const JOURNAL_ENTRY_HEIGHT = 76;
const JOURNAL_ENTRY_COLUMN_DIVIDER_X = 105;
const JOURNAL_ENTRY_LEFT_X = 20;
const JOURNAL_ENTRY_LEFT_END_X = 101;
const JOURNAL_ENTRY_RIGHT_X = 109;
const JOURNAL_ENTRY_RIGHT_END_X = 190;
const JOURNAL_ENTRY_COLUMN_TITLE_OFFSET = 23;
const JOURNAL_ENTRY_FIRST_PROMPT_OFFSET = 27;
const JOURNAL_ENTRY_PROMPT_STEP = 16;
const JOURNAL_ENTRY_UNDERLINE_OFFSET = 5;
const JOURNAL_ENTRY_SECOND_LINE_OFFSET = 12;
const JOURNAL_ENTRY_FIELD_LINE_WIDTH = 0.2;
const JOURNAL_SECTION_BORDER_X = 15;
const JOURNAL_SECTION_BORDER_WIDTH = 180;

export const GOALIE_JOURNAL_GOLD_CERTIFICATION_TEXT =
  "The goalie journal generator was developed as part of the USA Hockey Goaltending Gold Certification Program. The goal of this journal is to help you develop into the best and most resilient goalie that you can be. Share your journal with your family and coaches so they can help you on your journey.";

function setInlineFont(doc: JournalDocument, segment: InlineMarkdownSegment): void {
  const bold = segment.bold === true;
  const italics = segment.italics === true || segment.type === "placeholder";
  const style = bold && italics ? "bolditalic" : bold ? "bold" : italics ? "italic" : "normal";
  doc.setFont("helvetica", style);
}

function inlineTextLines(
  doc: JournalDocument,
  text: string,
  maxWidth: number
): InlineMarkdownSegment[][] {
  const lines: InlineMarkdownSegment[][] = [[]];
  let lineWidth = 0;

  parseInlineMarkdown(text).forEach((segment) => {
    const words = segment.text.split(/(\s+)/);
    words.forEach((word) => {
      if (!word) return;
      setInlineFont(doc, segment);
      const wordWidth = doc.getTextWidth(word);
      if (lineWidth > 0 && !/^\s+$/.test(word) && lineWidth + wordWidth > maxWidth) {
        lines.push([]);
        lineWidth = 0;
      }
      const currentLine = lines[lines.length - 1];
      const previous = currentLine[currentLine.length - 1];
      if (
        previous &&
        previous.type === segment.type &&
        previous.url === segment.url &&
        previous.bold === segment.bold &&
        previous.italics === segment.italics
      ) {
        previous.text += word;
      } else {
        currentLine.push({ ...segment, text: word });
      }
      lineWidth += wordWidth;
    });
  });

  return lines.filter((line) => line.length > 0);
}

function drawInlineText(
  doc: JournalDocument,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: "left" | "center" = "left"
): number {
  const lines = inlineTextLines(doc, text, maxWidth);
  lines.forEach((line, lineIndex) => {
    const totalWidth = line.reduce((width, segment) => {
      setInlineFont(doc, segment);
      return width + doc.getTextWidth(segment.text);
    }, 0);
    let currentX = align === "center" ? x - totalWidth / 2 : x;
    line.forEach((segment) => {
      setInlineFont(doc, segment);
      doc.text(segment.text, currentX, y + lineIndex * lineHeight);
      currentX += doc.getTextWidth(segment.text);
    });
  });
  doc.setFont("helvetica", "normal");
  return lines.length;
}

function renderJournalContentSection(
  doc: JournalDocument,
  markdown: string,
  primary: string,
  titleY: number,
  contentStartY: number,
  titleFontSize = 20
): number {
  const blocks = parseMarkdown(markdown);
  const titleIndex = blocks.findIndex((block) => block.type === "heading");
  const titleBlock = titleIndex >= 0 ? blocks[titleIndex] : null;
  const title = titleBlock?.type === "heading" ? titleBlock.text : "";
  const bodyBlocks = blocks.filter(
    (block, index): block is Extract<MarkdownBlock, { type: "heading" | "paragraph" | "bullet" }> =>
      index !== titleIndex &&
      (block.type === "paragraph" ||
        block.type === "bullet" ||
        (block.type === "heading" && block.level === 3))
  );

  doc.setTextColor(primary);
  doc.setFontSize(titleFontSize);
  drawInlineText(doc, title, 105, titleY, 170, 6, "center");

  doc.setTextColor("#000000");
  doc.setFontSize(11);
  let y = contentStartY;
  bodyBlocks.forEach((block, index) => {
    if (block.type === "heading") {
      y += 4;
      doc.setTextColor(primary);
      doc.setFontSize(14);
      const lineCount = drawInlineText(doc, `**${block.text}**`, 20, y, 170, 6);
      y += lineCount * 6 + 4;
      doc.setTextColor("#000000");
      doc.setFontSize(11);
      return;
    }

    if (block.type === "paragraph" && bodyBlocks[index - 1]?.type === "bullet") {
      y += JOURNAL_CONTENT_PARAGRAPH_GAP;
    }

    const text = block.type === "bullet" ? `- ${block.text}` : block.text;
    const lineCount = drawInlineText(doc, text, 20, y, 170, 6);
    y += lineCount * 6 + (block.type === "paragraph" ? JOURNAL_CONTENT_PARAGRAPH_GAP : 0);
  });

  return y;
}

function renderEndOfSeasonReview(
  doc: JournalDocument,
  markdown: string,
  primary: string,
  titleY: number,
  contentStartY: number
): number {
  const eosBlocks = parseMarkdown(markdown);
  const eosTitle =
    eosBlocks.find((block) => block.type === "heading")?.text ?? "End of Season Review";
  const eosPrompts = eosBlocks
    .filter((block) => block.type === "paragraph" || block.type === "bullet")
    .map((block) => block.text);

  doc.setTextColor(primary);
  doc.setFontSize(20);
  drawInlineText(doc, eosTitle, 105, titleY, 170, 6, "center");

  const eosBlockHeight =
    END_OF_SEASON_BLOCK_PADDING + END_OF_SEASON_ANSWER_LINES * END_OF_SEASON_LINE_SPACING;
  doc.setFontSize(12);
  doc.setTextColor("#000000");
  doc.setDrawColor("#000000");
  doc.setLineWidth(JOURNAL_ENTRY_FIELD_LINE_WIDTH);
  let eosY = contentStartY;
  eosPrompts.forEach((prompt) => {
    const promptLines = inlineTextLines(doc, prompt, 170);
    promptLines.forEach((line, lineIndex) => {
      let promptX = 20;
      line.forEach((segment) => {
        setInlineFont(doc, segment);
        doc.text(segment.text, promptX, eosY + lineIndex * 6);
        promptX += doc.getTextWidth(segment.text);
      });
    });
    const eosAnswerStart = eosY + promptLines.length * 6 + 2;
    for (let index = 0; index < END_OF_SEASON_ANSWER_LINES; index++) {
      doc.line(
        20,
        eosAnswerStart + index * END_OF_SEASON_LINE_SPACING,
        190,
        eosAnswerStart + index * END_OF_SEASON_LINE_SPACING
      );
    }
    eosY += eosBlockHeight + (promptLines.length - 1) * 6;
  });

  return eosY;
}

function drawJournalSectionBorder(
  doc: JournalDocument,
  color: string,
  topY: number,
  bottomY: number
): void {
  doc.setDrawColor(color);
  doc.setLineWidth(0.5);
  doc.rect(JOURNAL_SECTION_BORDER_X, topY, JOURNAL_SECTION_BORDER_WIDTH, bottomY - topY);
}

function drawGoldCertificationBlock(
  doc: JournalDocument,
  badge: JournalLogoData | null,
  y: number
): void {
  const imageMaxSize = 24;
  const gap = 8;
  const textX = badge ? 20 + imageMaxSize + gap : 20;
  const textWidth = badge ? 170 - imageMaxSize - gap : 170;

  if (badge) {
    const sourceWidth = badge.width > 0 ? badge.width : imageMaxSize;
    const sourceHeight = badge.height > 0 ? badge.height : imageMaxSize;
    const scale = Math.min(imageMaxSize / sourceWidth, imageMaxSize / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    doc.addImage(
      badge.dataUrl,
      "PNG",
      20 + (imageMaxSize - width) / 2,
      y + (imageMaxSize - height) / 2,
      width,
      height
    );
  }

  doc.setTextColor("#000000");
  doc.setFontSize(10);
  drawInlineText(doc, GOALIE_JOURNAL_GOLD_CERTIFICATION_TEXT, textX, y + 4, textWidth, 6);
}

function drawCoverIdentityField(
  doc: JournalDocument,
  label: string,
  value: string,
  y: number,
  secondary: string,
  writeIn: boolean
): void {
  doc.setTextColor(secondary);
  if (!writeIn) {
    doc.setFontSize(18);
    doc.text(value, 105, y, { align: "center" });
    return;
  }

  doc.setFontSize(12);
  const labelText = `${label}:`;
  const fieldStartX = 40;
  doc.text(labelText, fieldStartX, y);
  const lineStartX = fieldStartX + doc.getTextWidth(labelText) + 3;
  doc.setDrawColor(secondary);
  doc.setLineWidth(0.5);
  doc.line(lineStartX, y + 1, 170, y + 1);
}

function drawCoverImages(
  doc: JournalDocument,
  teamLogo: JournalLogoData | null,
  goaliePhoto: JournalLogoData | null
): number | null {
  const images = [teamLogo, goaliePhoto].filter(
    (image): image is JournalLogoData => image !== null
  );
  if (images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    const image = images[0];
    const maxWidth = 60;
    const maxHeight = 60;
    const sourceWidth = image.width > 0 ? image.width : maxWidth;
    const sourceHeight = image.height > 0 ? image.height : maxHeight;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    const format =
      image.dataUrl.startsWith("data:image/jpeg") || image.dataUrl.startsWith("data:image/jpg")
        ? "JPEG"
        : "PNG";
    doc.addImage(image.dataUrl, format, 105 - width / 2, 110, width, height);
    return 110 + height;
  }

  const gap = 8;
  const maxCombinedWidth = 160;
  const maxHeight = 60;
  const aspectRatios = images.map((image) => {
    const sourceWidth = image.width > 0 ? image.width : maxHeight;
    const sourceHeight = image.height > 0 ? image.height : maxHeight;
    return sourceWidth / sourceHeight;
  });
  const height = Math.min(
    maxHeight,
    (maxCombinedWidth - gap) / aspectRatios.reduce((sum, ratio) => sum + ratio, 0)
  );
  const widths = aspectRatios.map((ratio) => ratio * height);
  const combinedWidth = widths.reduce((sum, width) => sum + width, 0) + gap;
  let x = 105 - combinedWidth / 2;

  images.forEach((image, index) => {
    const format =
      image.dataUrl.startsWith("data:image/jpeg") || image.dataUrl.startsWith("data:image/jpg")
        ? "JPEG"
        : "PNG";
    doc.addImage(image.dataUrl, format, x, 110, widths[index], height);
    x += widths[index] + gap;
  });

  return 110 + height;
}

/**
 * Builds a Goalie Journal PDF and returns the `jsPDF` document instance.
 *
 * The caller is responsible for:
 * - Loading the markdown content from the filesystem or Webpack imports.
 * - Resolving the logo to a base64 data URL (or passing `null` to skip the logo).
 * - Providing the `jspdf` module (either a direct import or a lazy-loaded one).
 * - Calling `doc.output("arraybuffer")` / `doc.output("blob")` for final output.
 *
 * @param config  Journal configuration (identity, colors, season, entry count).
 * @param content Pre-loaded markdown strings for each journal section.
 * @param logo    Pre-resolved logo data as a base64 data URL, or `null`.
 * @param jsPdf   The `jspdf` module exports.
 */
export function buildGoalieJournalPdf(
  config: GoalieJournalConfig,
  content: GoalieJournalContent,
  logo: JournalLogoData | null,
  jsPdf: JsPdfModule,
  qrCodeDataUrl: string | null = null,
  footerLogo: JournalLogoData | null = null,
  goaliePhoto: JournalLogoData | null = null,
  goldCertificationBadge: JournalLogoData | null = null
): InstanceType<JsPdfModule["jsPDF"]> {
  const { jsPDF } = jsPdf;
  const {
    goalieName,
    teamName,
    primaryColor,
    secondaryColor,
    season,
    entryCount,
    seasonGoals,
    writeInGoalieName,
    writeInTeamName,
    writeInSeason,
    writeInSeasonGoals,
  } = config;
  const {
    coverMd,
    acknowledgementsMd,
    howToUseMd,
    howToImproveEveryDayMd,
    eventEntryMd,
    endOfSeasonMd,
  } = content;
  const primary = normalizeHexRgbColor(primaryColor) ?? DEFAULT_PRIMARY_TEAM_COLOR;
  const secondary = normalizeHexRgbColor(secondaryColor) ?? DEFAULT_SECONDARY_TEAM_COLOR;

  const doc = new jsPDF();

  // ── Cover page ─────────────────────────────────────────────────────────────

  const coverBlocks = parseMarkdown(coverMd);
  const coverTitle = coverBlocks.find((b) => b.type === "heading")?.text ?? "Goalie Journal";
  const coverSubtitle =
    extractLevel3Section(coverMd, "Subtitle") ||
    coverBlocks.find((b) => b.type === "paragraph")?.text ||
    "";
  const coverQuotation = extractLevel3Section(coverMd, "Quotation");

  doc.setTextColor(primary);
  doc.setFontSize(28);
  drawInlineText(doc, coverTitle, 105, 40, 170, 6, "center");
  drawCoverIdentityField(doc, "Goalie Name", goalieName, 58, secondary, writeInGoalieName);
  drawCoverIdentityField(doc, "Team Name", teamName, 72, secondary, writeInTeamName);
  drawCoverIdentityField(doc, "Season", `Season: ${season}`, 86, secondary, writeInSeason);
  if (coverSubtitle) {
    doc.setFontSize(10);
    doc.setTextColor(primary);
    drawInlineText(doc, coverSubtitle, 105, 97, 170, 5, "center");
  }

  let coverImagesBottom: number | null = null;
  try {
    coverImagesBottom = drawCoverImages(doc, logo, goaliePhoto);
  } catch (e) {
    console.error("Error adding cover images to PDF:", e);
  }

  if (coverQuotation) {
    const quotationBlocks = parseMarkdown(coverQuotation).filter(
      (block): block is Extract<MarkdownBlock, { type: "paragraph" }> => block.type === "paragraph"
    );
    let quotationY = coverImagesBottom === null ? 125 : coverImagesBottom + 12;
    doc.setFontSize(11);
    doc.setTextColor(secondary);
    quotationBlocks.forEach((block) => {
      const lineCount = drawInlineText(doc, block.text, 105, quotationY, 150, 5.5, "center");
      quotationY += lineCount * 5.5 + 2;
    });
  }

  const coverPageHeight = doc.internal.pageSize.height;
  const coverFooterImageSize = 18;
  const coverFooterImageY = coverPageHeight - 28;
  if (footerLogo) {
    const logoWidth = footerLogo.width > 0 ? footerLogo.width : coverFooterImageSize;
    const logoHeight = footerLogo.height > 0 ? footerLogo.height : coverFooterImageSize;
    const logoScale = Math.min(coverFooterImageSize / logoWidth, coverFooterImageSize / logoHeight);
    const renderedLogoWidth = logoWidth * logoScale;
    const renderedLogoHeight = logoHeight * logoScale;
    doc.addImage(
      footerLogo.dataUrl,
      "PNG",
      20 + (coverFooterImageSize - renderedLogoWidth) / 2,
      coverFooterImageY + (coverFooterImageSize - renderedLogoHeight) / 2,
      renderedLogoWidth,
      renderedLogoHeight
    );
  }
  doc.setFontSize(8);
  doc.setTextColor("#000000");
  GOALIE_JOURNAL_COVER_PROMOTION_LINES.forEach((line, index) => {
    drawInlineText(doc, line, 105, coverPageHeight - 21 + index * 4.5, 120, 4.5, "center");
  });
  doc.link(45, coverPageHeight - 25, 120, 12, { url: GOALIE_JOURNAL_PROMOTION_URL });
  if (qrCodeDataUrl) {
    doc.addImage(
      qrCodeDataUrl,
      "PNG",
      172,
      coverFooterImageY,
      coverFooterImageSize,
      coverFooterImageSize
    );
    doc.link(172, coverFooterImageY, coverFooterImageSize, coverFooterImageSize, {
      url: GOALIE_JOURNAL_PROMOTION_URL,
    });
  }

  // ── How to Use this Journal and Acknowledgements page ───────────────────────

  doc.addPage();
  const howToUseEndY = renderJournalContentSection(
    doc,
    howToUseMd,
    primary,
    20,
    JOURNAL_CONTENT_START_Y
  );
  const acknowledgementsTitleY = howToUseEndY + ACKNOWLEDGEMENTS_SECTION_GAP;
  const acknowledgementsEndY = renderJournalContentSection(
    doc,
    acknowledgementsMd,
    primary,
    acknowledgementsTitleY,
    acknowledgementsTitleY + 10,
    16
  );
  drawGoldCertificationBlock(
    doc,
    goldCertificationBadge,
    acknowledgementsEndY + ACKNOWLEDGEMENTS_GOLD_GAP
  );

  // ── How to Improve Every Day page ───────────────────────────────────────────

  doc.addPage();
  renderJournalContentSection(doc, howToImproveEveryDayMd, primary, 20, JOURNAL_CONTENT_START_Y);

  // ── Season Goals and End of Season Review page ──────────────────────────────

  doc.addPage();
  doc.setTextColor(primary);
  doc.setFontSize(20);
  drawInlineText(doc, "Season Goals", 105, 20, 170, 6, "center");

  const normalizedSeasonGoals = normalizeJournalSeasonGoals(seasonGoals);
  let seasonGoalsEndY = SEASON_GOALS_START_Y;
  doc.setFontSize(12);
  doc.setTextColor("#000000");
  doc.setDrawColor("#000000");
  if (writeInSeasonGoals || normalizedSeasonGoals.length === 0) {
    for (let i = 0; i < JOURNAL_SEASON_GOAL_COUNT; i++) {
      const y = SEASON_GOALS_START_Y + i * WRITE_IN_SEASON_GOAL_STEP;
      doc.text(`${i + 1}.`, 20, y);
      doc.line(30, y, 190, y);
      doc.line(30, y + WRITE_IN_SEASON_GOAL_LINE_GAP, 190, y + WRITE_IN_SEASON_GOAL_LINE_GAP);
      seasonGoalsEndY = y + WRITE_IN_SEASON_GOAL_LINE_GAP;
    }
  } else {
    let goalY = SEASON_GOALS_START_Y;
    normalizedSeasonGoals.forEach((goal, index) => {
      doc.text(`${index + 1}.`, 20, goalY);
      const lineCount = drawInlineText(doc, goal, 30, goalY, 160, 5);
      goalY += Math.max(ENTERED_SEASON_GOAL_MIN_STEP, lineCount * 5 + ENTERED_SEASON_GOAL_TEXT_GAP);
    });
    seasonGoalsEndY = goalY - ENTERED_SEASON_GOAL_END_TRIM;
  }
  const seasonGoalsBoxBottomY = seasonGoalsEndY + 3;
  drawJournalSectionBorder(doc, primary, 12, seasonGoalsBoxBottomY);
  const endOfSeasonTitleY = seasonGoalsBoxBottomY + 10;
  const endOfSeasonEndY = renderEndOfSeasonReview(
    doc,
    endOfSeasonMd,
    primary,
    endOfSeasonTitleY,
    endOfSeasonTitleY + 12
  );
  drawJournalSectionBorder(doc, secondary, endOfSeasonTitleY - 8, endOfSeasonEndY + 3);

  // ── Practice/Game Log pages ────────────────────────────────────────────────

  const entryBlocks = parseMarkdown(eventEntryMd);
  const entryTitle = entryBlocks.find((b) => b.type === "heading")?.text ?? "Goalie Event Log";
  const getEntryColumnPrompts = (heading: string): string[] =>
    parseMarkdown(extractLevel3Section(eventEntryMd, heading))
      .filter((block) => block.type === "paragraph" || block.type === "bullet")
      .map((block) => block.text)
      .slice(0, 3);
  const beforePrompts = getEntryColumnPrompts("Before");
  const afterPrompts = getEntryColumnPrompts("After");

  const journalPageHeight = doc.internal.pageSize.height;
  const numLogPages = Math.ceil(entryCount / JOURNAL_ENTRIES_PER_PAGE);

  for (let page = 0; page < numLogPages; page++) {
    doc.addPage();
    doc.setTextColor(primary);
    doc.setFontSize(16);
    doc.text(entryTitle, 105, 12, { align: "center" });
    doc.setFontSize(9);
    doc.text("Page", 165, 15);
    doc.setDrawColor(primary);
    doc.setLineWidth(JOURNAL_ENTRY_FIELD_LINE_WIDTH);
    doc.line(177, 15, 195, 15);

    const firstEntry = page * JOURNAL_ENTRIES_PER_PAGE;
    const lastEntry = Math.min(firstEntry + JOURNAL_ENTRIES_PER_PAGE, entryCount);
    for (let entry = firstEntry; entry < lastEntry; entry++) {
      const startY = 25 + (entry - firstEntry) * JOURNAL_ENTRY_HEIGHT;

      doc.setDrawColor(entry % 2 === 0 ? primary : secondary);
      doc.setLineWidth(0.5);
      doc.rect(15, startY, 180, JOURNAL_ENTRY_HEIGHT - 2);
      doc.setDrawColor("#000000");

      doc.setTextColor("#000000");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Entry #", 20, startY + 7);
      doc.setLineWidth(JOURNAL_ENTRY_FIELD_LINE_WIDTH);
      const entryNumberLineStart = 20 + doc.getTextWidth("Entry #") + 3;
      doc.line(entryNumberLineStart, startY + 7, entryNumberLineStart + 27, startY + 7);
      doc.setFont("helvetica", "normal");

      doc.setFontSize(9);
      doc.text("Date:", 20, startY + 15);
      doc.setLineWidth(JOURNAL_ENTRY_FIELD_LINE_WIDTH);
      doc.line(31, startY + 15, 54, startY + 15);
      doc.text("Time:", 59, startY + 15);
      doc.line(70, startY + 15, 93, startY + 15);
      doc.text("Opponent:", 109, startY + 15);
      doc.line(109 + doc.getTextWidth("Opponent:") + 3, startY + 15, 190, startY + 15);

      doc.rect(101, startY + 3.5, 3, 3);
      doc.text("Practice", 106, startY + 7);
      doc.rect(124, startY + 3.5, 3, 3);
      doc.text("Game", 129, startY + 7);
      doc.rect(143, startY + 3.5, 3, 3);
      doc.text("Other:", 148, startY + 7);
      doc.line(148 + doc.getTextWidth("Other:") + 3, startY + 7, 190, startY + 7);

      doc.setDrawColor("#B0B0B0");
      doc.setLineWidth(0.2);
      doc.line(
        JOURNAL_ENTRY_COLUMN_DIVIDER_X,
        startY + 27,
        JOURNAL_ENTRY_COLUMN_DIVIDER_X,
        startY + JOURNAL_ENTRY_HEIGHT - 5
      );

      doc.setTextColor("#000000");
      doc.setLineWidth(JOURNAL_ENTRY_FIELD_LINE_WIDTH);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(
        "Before",
        (JOURNAL_ENTRY_LEFT_X + JOURNAL_ENTRY_LEFT_END_X) / 2,
        startY + JOURNAL_ENTRY_COLUMN_TITLE_OFFSET,
        { align: "center" }
      );
      doc.text(
        "After",
        (JOURNAL_ENTRY_RIGHT_X + JOURNAL_ENTRY_RIGHT_END_X) / 2,
        startY + JOURNAL_ENTRY_COLUMN_TITLE_OFFSET,
        { align: "center" }
      );
      doc.setFont("helvetica", "normal");
      doc.setDrawColor("#000000");

      [
        {
          prompts: beforePrompts,
          x: JOURNAL_ENTRY_LEFT_X,
          endX: JOURNAL_ENTRY_LEFT_END_X,
        },
        {
          prompts: afterPrompts,
          x: JOURNAL_ENTRY_RIGHT_X,
          endX: JOURNAL_ENTRY_RIGHT_END_X,
        },
      ].forEach(({ prompts, x, endX }) => {
        prompts.forEach((prompt, promptIndex) => {
          const promptY =
            startY + JOURNAL_ENTRY_FIRST_PROMPT_OFFSET + promptIndex * JOURNAL_ENTRY_PROMPT_STEP;
          drawInlineText(doc, prompt, x, promptY, endX - x, 4);
          doc.line(
            x,
            promptY + JOURNAL_ENTRY_UNDERLINE_OFFSET,
            endX,
            promptY + JOURNAL_ENTRY_UNDERLINE_OFFSET
          );
          doc.line(
            x,
            promptY + JOURNAL_ENTRY_SECOND_LINE_OFFSET,
            endX,
            promptY + JOURNAL_ENTRY_SECOND_LINE_OFFSET
          );
        });
      });
    }

    const footerText =
      "If you need more space, make copies of this page or download the PDF at goaliegen.com";
    doc.setFontSize(7);
    doc.setTextColor("#000000");
    if (footerLogo) {
      doc.addImage(footerLogo.dataUrl, "PNG", 20, journalPageHeight - 24, 14, 14);
    }
    doc.text(footerText, footerLogo ? 106 : 98, journalPageHeight - 10, { align: "center" });
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, "PNG", 178, journalPageHeight - 24, 14, 14);
      doc.link(178, journalPageHeight - 24, 14, 14, {
        url: GOALIE_JOURNAL_PROMOTION_URL,
      });
    }
  }

  return doc;
}
