/**
 * Platform-agnostic Goalie Journal PDF builder.
 *
 * This builder contains the canonical jsPDF page assembly logic. Platform-specific
 * concerns (loading the logo image, resolving dimensions) are injected as pre-resolved
 * data so the same builder runs unchanged in both the browser and Node.
 */
import { parseMarkdown } from "../markdownParser";
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
import {
  GOALIE_JOURNAL_COVER_PROMOTION_LINES,
  GOALIE_JOURNAL_PROMOTION_URL,
} from "../goalieJournalPromotion";

type JsPdfModule = typeof import("jspdf");

type JournalDocument = InstanceType<JsPdfModule["jsPDF"]>;

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

function renderJournalContentPage(doc: JournalDocument, markdown: string, primary: string): void {
  const blocks = parseMarkdown(markdown);
  const title = blocks.find((block) => block.type === "heading")?.text ?? "";
  const bodyBlocks = blocks.filter(
    (block) => block.type === "paragraph" || block.type === "bullet"
  );

  doc.setTextColor(primary);
  doc.setFontSize(20);
  drawInlineText(doc, title, 105, 20, 170, 6, "center");

  doc.setTextColor("#000000");
  doc.setFontSize(11);
  let y = 42;
  bodyBlocks.forEach((block) => {
    const text = block.type === "bullet" ? `- ${block.text}` : block.text;
    const lineCount = drawInlineText(doc, text, 20, y, 170, 6);
    y += lineCount * 6 + 6;
  });
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
): void {
  const images = [teamLogo, goaliePhoto].filter(
    (image): image is JournalLogoData => image !== null
  );
  if (images.length === 0) {
    return;
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
    doc.addImage(image.dataUrl, "PNG", 105 - width / 2, 110, width, height);
    return;
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
    doc.addImage(image.dataUrl, "PNG", x, 110, widths[index], height);
    x += widths[index] + gap;
  });
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
  goaliePhoto: JournalLogoData | null = null
): InstanceType<JsPdfModule["jsPDF"]> {
  const { jsPDF } = jsPdf;
  const {
    goalieName,
    teamName,
    primaryColor,
    secondaryColor,
    season,
    entryCount,
    writeInGoalieName,
    writeInTeamName,
    writeInSeason,
  } = config;
  const {
    coverMd,
    acknowledgementsMd,
    howToUseMd,
    howToImproveEveryDayMd,
    seasonGoalsMd,
    practiceEntryMd,
    endOfSeasonMd,
  } = content;
  const primary = normalizeHexRgbColor(primaryColor) ?? DEFAULT_PRIMARY_TEAM_COLOR;
  const secondary = normalizeHexRgbColor(secondaryColor) ?? DEFAULT_SECONDARY_TEAM_COLOR;

  const doc = new jsPDF();

  // ── Cover page ─────────────────────────────────────────────────────────────

  const coverBlocks = parseMarkdown(coverMd);
  const coverTitle = coverBlocks.find((b) => b.type === "heading")?.text ?? "Goalie Journal";
  const coverSubtitle = coverBlocks.find((b) => b.type === "paragraph")?.text ?? "";

  doc.setTextColor(primary);
  doc.setFontSize(28);
  drawInlineText(doc, coverTitle, 105, 40, 170, 6, "center");
  drawCoverIdentityField(doc, "Goalie Name", goalieName, 58, secondary, writeInGoalieName);
  drawCoverIdentityField(doc, "Team Name", teamName, 72, secondary, writeInTeamName);
  drawCoverIdentityField(doc, "Season", `Season ${season}`, 86, secondary, writeInSeason);
  if (coverSubtitle) {
    doc.setFontSize(10);
    doc.setTextColor("#000000");
    drawInlineText(doc, coverSubtitle, 105, 97, 170, 5, "center");
  }

  try {
    drawCoverImages(doc, logo, goaliePhoto);
  } catch (e) {
    console.error("Error adding cover images to PDF:", e);
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

  // ── Acknowledgements page ───────────────────────────────────────────────────

  doc.addPage();
  renderJournalContentPage(doc, acknowledgementsMd, primary);

  // ── How to Use this Journal page ────────────────────────────────────────────

  doc.addPage();
  renderJournalContentPage(doc, howToUseMd, primary);

  // ── How to Improve Every Day page ───────────────────────────────────────────

  doc.addPage();
  renderJournalContentPage(doc, howToImproveEveryDayMd, primary);

  // ── Season Goals page ──────────────────────────────────────────────────────

  doc.addPage();
  const goalsBlocks = parseMarkdown(seasonGoalsMd);
  const goalsTitle = goalsBlocks.find((b) => b.type === "heading")?.text ?? "Season Goals";
  const goalsPrompt = goalsBlocks.find((b) => b.type === "paragraph")?.text ?? "";

  doc.setTextColor(primary);
  doc.setFontSize(20);
  drawInlineText(doc, goalsTitle, 105, 20, 170, 6, "center");
  doc.setFontSize(12);
  doc.setTextColor("#000000");
  if (goalsPrompt) {
    drawInlineText(doc, goalsPrompt, 20, 40, 170, 5);
  }

  for (let i = 0; i < 8; i++) {
    const y = 55 + i * 25;
    doc.text(`${i + 1}.`, 20, y);
    doc.setDrawColor(secondary);
    doc.line(30, y, 190, y);
    doc.line(30, y + 10, 190, y + 10);
  }

  // ── Practice/Game Log pages ────────────────────────────────────────────────

  const entryBlocks = parseMarkdown(practiceEntryMd);
  const entryTitle = entryBlocks.find((b) => b.type === "heading")?.text ?? "Goalie Event Log";
  const entryLabels = entryBlocks
    .filter((b) => b.type === "paragraph" || b.type === "bullet")
    .map((b) => b.text);

  // Compute entry box height accounting for label text wrapping so long
  // prompts don't collide with the underline or the next field.
  const labelMaxWidth = 165; // mm available for label text at x=20
  const labelLineHeight = 5; // mm per wrapped text line
  const labelRowGap = 8; // mm from last text line to underline + to next prompt start
  const entryHeaderHeight = 30; // mm from box top to first prompt (entry label + event rows)
  const entryBorderPadding = 2; // mm for the box border
  const entryMinHeight = 50; // mm minimum so the box is always readable

  doc.setFontSize(9);
  const labelWrapped = entryLabels.map((label) => inlineTextLines(doc, label, labelMaxWidth));
  const computedEntryHeight =
    entryHeaderHeight +
    labelWrapped.reduce((sum, lines) => sum + lines.length * labelLineHeight + labelRowGap, 0) +
    entryBorderPadding;
  const entryHeight = Math.max(entryMinHeight, computedEntryHeight);
  const journalPageHeight = doc.internal.pageSize.height;
  const availablePerPage = journalPageHeight - 58;
  const entriesPerPage = Math.max(1, Math.floor(availablePerPage / entryHeight));
  const numLogPages = Math.ceil(entryCount / entriesPerPage);

  for (let page = 0; page < numLogPages; page++) {
    doc.addPage();
    doc.setTextColor(primary);
    doc.setFontSize(16);
    doc.text(entryTitle, 105, 12, { align: "center" });
    doc.setFontSize(9);
    doc.text("Page", 165, 15);
    doc.setDrawColor(primary);
    doc.setLineWidth(0.5);
    doc.line(177, 15, 195, 15);

    const firstEntry = page * entriesPerPage;
    const lastEntry = Math.min(firstEntry + entriesPerPage, entryCount);
    for (let entry = firstEntry; entry < lastEntry; entry++) {
      const startY = 25 + (entry - firstEntry) * entryHeight;

      doc.setDrawColor(entry % 2 === 0 ? primary : secondary);
      doc.setLineWidth(0.5);
      doc.rect(15, startY, 180, entryHeight - 2);
      doc.setDrawColor("#000000");

      doc.setTextColor("#000000");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Entry #", 20, startY + 7);
      doc.line(48, startY + 7, 75, startY + 7);
      doc.setFont("helvetica", "normal");

      doc.setFontSize(9);
      doc.text("Date:", 20, startY + 15);
      doc.line(31, startY + 15, 54, startY + 15);
      doc.text("Time:", 59, startY + 15);
      doc.line(70, startY + 15, 93, startY + 15);
      doc.rect(101, startY + 11.5, 3, 3);
      doc.text("Practice", 106, startY + 15);
      doc.rect(124, startY + 11.5, 3, 3);
      doc.text("Game", 129, startY + 15);
      doc.rect(143, startY + 11.5, 3, 3);
      doc.text("Other:", 148, startY + 15);
      doc.line(161, startY + 15, 190, startY + 15);
      doc.text("Opponent:", 20, startY + 23);
      doc.line(42, startY + 23, 100, startY + 23);

      let promptY = startY + entryHeaderHeight;
      entryLabels.forEach((label) => {
        const lines = inlineTextLines(doc, label, labelMaxWidth);
        lines.forEach((line, lineIdx) => {
          let promptX = 20;
          line.forEach((segment) => {
            setInlineFont(doc, segment);
            doc.text(segment.text, promptX, promptY + lineIdx * labelLineHeight);
            promptX += doc.getTextWidth(segment.text);
          });
        });
        const underlineY = promptY + lines.length * labelLineHeight + 1;
        doc.line(20, underlineY, 190, underlineY);
        promptY += lines.length * labelLineHeight + labelRowGap;
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

  // ── End of Season Review page ──────────────────────────────────────────────

  doc.addPage();
  const eosBlocks = parseMarkdown(endOfSeasonMd);
  const eosTitle = eosBlocks.find((b) => b.type === "heading")?.text ?? "End of Season Review";
  const eosPrompts = eosBlocks
    .filter((b) => b.type === "paragraph" || b.type === "bullet")
    .map((b) => b.text);

  doc.setTextColor(primary);
  doc.setFontSize(20);
  drawInlineText(doc, eosTitle, 105, 20, 170, 6, "center");

  const eosPageHeight = doc.internal.pageSize.height - 15;
  const eosAnswerLines = 3;
  const eosAnswerLineSpacing = 15;
  const eosBlockHeight = 10 + eosAnswerLines * eosAnswerLineSpacing;
  doc.setFontSize(12);
  doc.setTextColor("#000000");
  let eosY = 40;
  eosPrompts.forEach((prompt) => {
    if (eosY + eosBlockHeight > eosPageHeight) {
      doc.addPage();
      eosY = 20;
    }
    const promptLines = inlineTextLines(doc, prompt, 170);
    promptLines.forEach((line, lineIdx) => {
      let promptX = 20;
      line.forEach((segment) => {
        setInlineFont(doc, segment);
        doc.text(segment.text, promptX, eosY + lineIdx * 6);
        promptX += doc.getTextWidth(segment.text);
      });
    });
    const eosAnswerStart = eosY + promptLines.length * 6 + 2;
    for (let i = 0; i < eosAnswerLines; i++) {
      doc.line(
        20,
        eosAnswerStart + i * eosAnswerLineSpacing,
        190,
        eosAnswerStart + i * eosAnswerLineSpacing
      );
    }
    eosY += eosBlockHeight + (promptLines.length - 1) * 6;
  });

  return doc;
}
