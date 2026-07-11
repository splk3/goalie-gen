/**
 * Platform-agnostic Goalie Journal PDF builder.
 *
 * This builder contains the canonical jsPDF page assembly logic. Platform-specific
 * concerns (loading the logo image, resolving dimensions) are injected as pre-resolved
 * data so the same builder runs unchanged in both the browser and Node.
 */
import { parseMarkdown } from "../markdownParser";
import type {
  GoalieJournalConfig,
  GoalieJournalContent,
  JournalLogoData,
} from "../../types/generatorConfig";

type JsPdfModule = typeof import("jspdf");

/**
 * Builds a Goalie Journal PDF and returns the `jsPDF` document instance.
 *
 * The caller is responsible for:
 * - Loading the markdown content from the filesystem or Webpack imports.
 * - Resolving the logo to a base64 data URL (or passing `null` to skip the logo).
 * - Providing the `jspdf` module (either a direct import or a lazy-loaded one).
 * - Calling `doc.output("arraybuffer")` / `doc.output("blob")` for final output.
 *
 * @param config  Journal configuration (goalie name, team name, season, entry count).
 * @param content Pre-loaded markdown strings for each journal section.
 * @param logo    Pre-resolved logo data as a base64 data URL, or `null`.
 * @param jsPdf   The `jspdf` module exports.
 */
export function buildGoalieJournalPdf(
  config: GoalieJournalConfig,
  content: GoalieJournalContent,
  logo: JournalLogoData | null,
  jsPdf: JsPdfModule
): InstanceType<JsPdfModule["jsPDF"]> {
  const { jsPDF } = jsPdf;
  const { goalieName, teamName, season, entryCount } = config;
  const { coverMd, seasonGoalsMd, practiceEntryMd, endOfSeasonMd } = content;

  const doc = new jsPDF();

  // ── Cover page ─────────────────────────────────────────────────────────────

  const coverBlocks = parseMarkdown(coverMd);
  const coverTitle = coverBlocks.find((b) => b.type === "heading")?.text ?? "Goalie Journal";
  const coverSubtitle = coverBlocks.find((b) => b.type === "paragraph")?.text ?? "";

  doc.setFontSize(28);
  doc.text(coverTitle, 105, 40, { align: "center" });
  doc.setFontSize(18);
  doc.text(goalieName, 105, 58, { align: "center" });
  doc.text(teamName, 105, 72, { align: "center" });
  doc.text(`Season ${season}`, 105, 86, { align: "center" });
  if (coverSubtitle) {
    doc.setFontSize(10);
    doc.text(coverSubtitle, 105, 97, { align: "center" });
  }

  if (logo) {
    try {
      const maxW = 60;
      const maxH = 60;
      let w = logo.width > 0 ? logo.width : maxW;
      let h = logo.height > 0 ? logo.height : maxH;
      const ratio = Math.min(maxW / w, maxH / h);
      w = w * ratio;
      h = h * ratio;
      doc.addImage(logo.dataUrl, "PNG", 105 - w / 2, 110, w, h);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
    }
  }

  // ── Season Goals page ──────────────────────────────────────────────────────

  doc.addPage();
  const goalsBlocks = parseMarkdown(seasonGoalsMd);
  const goalsTitle = goalsBlocks.find((b) => b.type === "heading")?.text ?? "Season Goals";
  const goalsPrompt = goalsBlocks.find((b) => b.type === "paragraph")?.text ?? "";

  doc.setFontSize(20);
  doc.text(goalsTitle, 105, 20, { align: "center" });
  doc.setFontSize(12);
  if (goalsPrompt) {
    doc.text(goalsPrompt, 20, 40);
  }

  for (let i = 0; i < 8; i++) {
    const y = 55 + i * 25;
    doc.text(`${i + 1}.`, 20, y);
    doc.line(30, y, 190, y);
    doc.line(30, y + 10, 190, y + 10);
  }

  // ── Practice/Game Log pages ────────────────────────────────────────────────

  const entryBlocks = parseMarkdown(practiceEntryMd);
  const entryTitle = entryBlocks.find((b) => b.type === "heading")?.text ?? "Practice & Game Log";
  const entryLabels = entryBlocks
    .filter((b) => b.type === "paragraph" || b.type === "bullet")
    .map((b) => b.text);

  // Compute entry box height accounting for label text wrapping so long
  // prompts don't collide with the underline or the next field.
  const labelMaxWidth = 165; // mm available for label text at x=20
  const labelLineHeight = 5; // mm per wrapped text line
  const labelRowGap = 8; // mm from last text line to underline + to next prompt start
  const entryHeaderHeight = 23; // mm from box top to first prompt (entry label + date row)
  const entryBorderPadding = 2; // mm for the box border
  const entryMinHeight = 50; // mm minimum so the box is always readable

  doc.setFontSize(9);
  const labelWrapped = entryLabels.map(
    (label) => doc.splitTextToSize(label, labelMaxWidth) as string[]
  );
  const computedEntryHeight =
    entryHeaderHeight +
    labelWrapped.reduce((sum, lines) => sum + lines.length * labelLineHeight + labelRowGap, 0) +
    entryBorderPadding;
  const entryHeight = Math.max(entryMinHeight, computedEntryHeight);
  const journalPageHeight = doc.internal.pageSize.height;
  const availablePerPage = journalPageHeight - 40;
  const entriesPerPage = Math.max(1, Math.floor(availablePerPage / entryHeight));
  const numLogPages = Math.ceil(entryCount / entriesPerPage);

  for (let page = 0; page < numLogPages; page++) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`${entryTitle} - Page ${page + 1}`, 105, 15, { align: "center" });

    const firstEntry = page * entriesPerPage;
    const lastEntry = Math.min(firstEntry + entriesPerPage, entryCount);
    for (let entry = firstEntry; entry < lastEntry; entry++) {
      const startY = 25 + (entry - firstEntry) * entryHeight;
      const entryNum = entry + 1;

      doc.setLineWidth(0.5);
      doc.rect(15, startY, 180, entryHeight - 2);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Entry ${entryNum}`, 20, startY + 7);
      doc.setFont("helvetica", "normal");

      doc.setFontSize(9);
      doc.text("Date: _______________", 20, startY + 15);
      doc.text("\u25A1 Practice  \u25A1 Game", 80, startY + 15);
      doc.text("Opponent: _______________", 135, startY + 15);

      let promptY = startY + entryHeaderHeight;
      labelWrapped.forEach((lines) => {
        lines.forEach((line, lineIdx) => {
          doc.text(line, 20, promptY + lineIdx * labelLineHeight);
        });
        const underlineY = promptY + lines.length * labelLineHeight + 1;
        doc.line(20, underlineY, 190, underlineY);
        promptY += lines.length * labelLineHeight + labelRowGap;
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

  doc.setFontSize(20);
  doc.text(eosTitle, 105, 20, { align: "center" });

  const eosPageHeight = doc.internal.pageSize.height - 15;
  const eosAnswerLines = 3;
  const eosAnswerLineSpacing = 15;
  const eosBlockHeight = 10 + eosAnswerLines * eosAnswerLineSpacing;
  doc.setFontSize(12);
  let eosY = 40;
  eosPrompts.forEach((prompt) => {
    if (eosY + eosBlockHeight > eosPageHeight) {
      doc.addPage();
      eosY = 20;
    }
    const promptLines = doc.splitTextToSize(prompt, 170) as string[];
    promptLines.forEach((line, lineIdx) => {
      doc.text(line, 20, eosY + lineIdx * 6);
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
