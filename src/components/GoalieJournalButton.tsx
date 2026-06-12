import * as React from "react";
import type { Paragraph } from "docx";
import { withPrefix } from "gatsby";
import { saveAs } from "file-saver";
import Logo from "./Logo";
import Modal from "./Modal";
import { trackEvent } from "../utils/analytics";
import ImageUploader from "./ImageUploader";
import FormatSelector from "./FormatSelector";
import { parseMarkdown } from "../utils/markdownParser";
import { buildCacheBustedAssetPath, OBJECT_URL_REVOKE_DELAY_MS } from "../utils/staticAsset";
import { toDocxImageTypeFromDataUrl } from "../utils/docxImageType";
import { loadDocxModule, loadJsPdfModule } from "../utils/loadExportModules";
import coverMd from "../content/goalie-journal/cover.md";
import seasonGoalsMd from "../content/goalie-journal/season-goals.md";
import practiceEntryMd from "../content/goalie-journal/practice-entry.md";
import endOfSeasonMd from "../content/goalie-journal/end-of-season.md";

const BLANK_LINE = "_______________________________________________";

export default function GoalieJournalButton() {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [goalieName, setGoalieName] = React.useState<string>("");
  const [teamName, setTeamName] = React.useState<string>("");
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [outputFormat, setOutputFormat] = React.useState<"pdf" | "docx">("pdf");
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [validationError, setValidationError] = React.useState<string>("");
  const [generatedBlob, setGeneratedBlob] = React.useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = React.useState<string>("");

  const handleImageCropped = React.useCallback((_file: File | null, previewUrl: string | null) => {
    setLogoPreview(previewUrl);
  }, []);

  const getLogoAsBase64 = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (logoPreview) {
        resolve(logoPreview);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          console.error(
            "GoalieJournalButton: Failed to obtain 2D canvas context for default logo. The journal will be generated without a logo."
          );
          resolve(null);
        }
      };
      img.onerror = () => {
        console.warn(
          "GoalieJournalButton: Failed to load default logo. The journal will be generated without a logo."
        );
        resolve(null);
      };
      img.src = withPrefix(buildCacheBustedAssetPath("/images/logos/logo-alt-light.png"));
    });
  };

  const dataUrlToArrayBuffer = (dataUrl: string): ArrayBuffer => {
    const base64 = dataUrl.split(",")[1] ?? dataUrl;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const generatePdf = async (): Promise<void> => {
    const { jsPDF } = await loadJsPdfModule();
    const doc = new jsPDF();
    const currentYear = new Date().getFullYear();
    const season = `${currentYear}-${currentYear + 1}`;

    const logoBase64 = await getLogoAsBase64();

    // Cover page
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

    if (logoBase64) {
      try {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = logoBase64;
        });

        const maxW = 60;
        const maxH = 60;
        let w = img.width > 0 ? img.width : maxW;
        let h = img.height > 0 ? img.height : maxH;
        const ratio = Math.min(maxW / w, maxH / h);
        w = w * ratio;
        h = h * ratio;

        doc.addImage(logoBase64, "PNG", 105 - w / 2, 110, w, h);
      } catch (e) {
        console.error("Error adding logo:", e);
      }
    }

    // Season Goals page
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

    // Practice/Game Log pages
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

    // Set font size before splitTextToSize so measurements are accurate
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
    const availablePerPage = journalPageHeight - 40; // top header + bottom margin
    const entriesPerPage = Math.max(1, Math.floor(availablePerPage / entryHeight));
    const totalEntries = 24;
    const numLogPages = Math.ceil(totalEntries / entriesPerPage);

    for (let page = 0; page < numLogPages; page++) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text(`${entryTitle} - Page ${page + 1}`, 105, 15, { align: "center" });

      const firstEntry = page * entriesPerPage;
      const lastEntry = Math.min(firstEntry + entriesPerPage, totalEntries);
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

    // End of Season Review page
    doc.addPage();
    const eosBlocks = parseMarkdown(endOfSeasonMd);
    const eosTitle = eosBlocks.find((b) => b.type === "heading")?.text ?? "End of Season Review";
    // All non-heading blocks (paragraphs and bullets) become review prompts
    const eosPrompts = eosBlocks
      .filter((b) => b.type === "paragraph" || b.type === "bullet")
      .map((b) => b.text);

    doc.setFontSize(20);
    doc.text(eosTitle, 105, 20, { align: "center" });

    const eosPageHeight = doc.internal.pageSize.height - 15;
    // Each EOS prompt block = prompt text line + 3 answer lines with spacing
    const eosAnswerLines = 3;
    const eosAnswerLineSpacing = 15; // mm between answer lines
    const eosBlockHeight = 10 + eosAnswerLines * eosAnswerLineSpacing; // text(10) + 3×15
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

    const sanitizedName =
      goalieName
        .replace(/[<>:"/\\|?*]+/g, "_")
        .replace(/^\.+|\.+$/g, "")
        .replace(/\s+/g, "_")
        .trim() || "Goalie";
    const blob = doc.output("blob");
    setGeneratedBlob(blob);
    setGeneratedFileName(`${sanitizedName}_Goalie_Journal_${season}.pdf`);
  };

  const generateDocx = async (): Promise<void> => {
    const { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } =
      await loadDocxModule();
    const currentYear = new Date().getFullYear();
    const season = `${currentYear}-${currentYear + 1}`;

    const documentChildren: Paragraph[] = [];

    // Cover: heading, optional logo, name/team/season/subtitle
    const coverBlocks = parseMarkdown(coverMd);
    const coverTitle = coverBlocks.find((b) => b.type === "heading")?.text ?? "Goalie Journal";
    const coverSubtitle = coverBlocks.find((b) => b.type === "paragraph")?.text ?? "";

    documentChildren.push(
      new Paragraph({
        text: coverTitle,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );

    // Embed logo in DOCX cover if available
    const logoBase64 = await getLogoAsBase64();
    if (logoBase64) {
      try {
        const logoBuffer = dataUrlToArrayBuffer(logoBase64);
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = logoBase64;
        });
        const maxW = 150;
        const maxH = 150;
        let lw = img.width > 0 ? img.width : maxW;
        let lh = img.height > 0 ? img.height : maxH;
        const ratio = Math.min(maxW / lw, maxH / lh);
        lw = Math.round(lw * ratio);
        lh = Math.round(lh * ratio);
        documentChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                type: toDocxImageTypeFromDataUrl(logoBase64),
                data: logoBuffer,
                transformation: { width: lw, height: lh },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          })
        );
      } catch (e) {
        console.error("Failed to embed logo in DOCX:", e);
      }
    }

    documentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: goalieName, bold: true, size: 36 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: teamName, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Season ${season}`, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: coverSubtitle ? 200 : 600 },
      })
    );

    if (coverSubtitle) {
      documentChildren.push(
        new Paragraph({
          children: [new TextRun({ text: coverSubtitle, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        })
      );
    }

    // Season Goals section
    const goalsBlocks = parseMarkdown(seasonGoalsMd);
    const goalsTitle = goalsBlocks.find((b) => b.type === "heading")?.text ?? "Season Goals";
    const goalsPrompt = goalsBlocks.find((b) => b.type === "paragraph")?.text ?? "";

    documentChildren.push(
      new Paragraph({
        text: goalsTitle,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    if (goalsPrompt) {
      documentChildren.push(
        new Paragraph({
          children: [new TextRun({ text: goalsPrompt })],
          spacing: { after: 200 },
        })
      );
    }

    for (let i = 1; i <= 8; i++) {
      documentChildren.push(
        new Paragraph({
          children: [new TextRun({ text: `${i}. ` }), new TextRun({ text: BLANK_LINE })],
          spacing: { after: 200 },
        })
      );
    }

    // Practice & Game Log section — use markdown paragraphs as the write-in prompts
    const entryBlocks = parseMarkdown(practiceEntryMd);
    const entryTitle = entryBlocks.find((b) => b.type === "heading")?.text ?? "Practice & Game Log";
    const entryPrompts = entryBlocks
      .filter((b) => b.type === "paragraph" || b.type === "bullet")
      .map((b) => b.text);

    documentChildren.push(
      new Paragraph({
        text: entryTitle,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    for (let i = 1; i <= 24; i++) {
      documentChildren.push(
        new Paragraph({
          children: [new TextRun({ text: `Entry ${i}`, bold: true })],
          spacing: { before: 300, after: 100 },
        }),
        // The date/type/opponent row is structural layout for each entry,
        // rendered separately from the editable markdown prompts.
        new Paragraph({
          children: [
            new TextRun({ text: "Date: " }),
            new TextRun({ text: BLANK_LINE }),
            new TextRun({ text: "   \u25A1 Practice  \u25A1 Game   Opponent: " }),
            new TextRun({ text: BLANK_LINE }),
          ],
          spacing: { after: 100 },
        })
      );

      entryPrompts.forEach((prompt) => {
        documentChildren.push(
          new Paragraph({
            children: [new TextRun({ text: prompt })],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [new TextRun({ text: BLANK_LINE })],
            spacing: { after: 100 },
          })
        );
      });
    }

    // End of Season Review section
    const eosBlocks = parseMarkdown(endOfSeasonMd);
    const eosTitle = eosBlocks.find((b) => b.type === "heading")?.text ?? "End of Season Review";
    const eosPrompts = eosBlocks
      .filter((b) => b.type === "paragraph" || b.type === "bullet")
      .map((b) => b.text);

    documentChildren.push(
      new Paragraph({
        text: eosTitle,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    eosPrompts.forEach((prompt) => {
      documentChildren.push(
        new Paragraph({
          children: [new TextRun({ text: prompt })],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: BLANK_LINE })],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: BLANK_LINE })],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: BLANK_LINE })],
          spacing: { after: 300 },
        })
      );
    });

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
    const sanitizedName =
      goalieName
        .replace(/[<>:"/\\|?*]+/g, "_")
        .replace(/^\.+|\.+$/g, "")
        .replace(/\s+/g, "_")
        .trim() || "Goalie";
    setGeneratedBlob(blob);
    setGeneratedFileName(`${sanitizedName}_Goalie_Journal_${season}.docx`);
  };

  const generateJournal = async () => {
    setValidationError("");

    if (!goalieName.trim()) {
      setValidationError("Please enter a goalie name");
      return;
    }

    if (!teamName.trim()) {
      setValidationError("Please enter a team name");
      return;
    }

    setIsGenerating(true);

    try {
      if (outputFormat === "pdf") {
        await generatePdf();
      } else {
        await generateDocx();
      }

      trackEvent("generate_journal", {
        format: outputFormat,
        team_name: teamName,
      });
    } catch (error) {
      console.error("Error generating journal:", error);
      setValidationError("There was an error generating the journal. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedBlob && generatedFileName) {
      if (outputFormat === "pdf") {
        const url = URL.createObjectURL(generatedBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = generatedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS);
      } else {
        saveAs(generatedBlob, generatedFileName);
      }

      trackEvent("download_journal", {
        format: outputFormat,
        team_name: teamName,
      });

      setShowModal(false);
      setGoalieName("");
      setTeamName("");
      setLogoPreview(null);
      setOutputFormat("pdf");
      setValidationError("");
      setGeneratedBlob(null);
      setGeneratedFileName("");
    }
  };

  const handleCancel = React.useCallback(() => {
    setShowModal(false);
    setGoalieName("");
    setTeamName("");
    setLogoPreview(null);
    setOutputFormat("pdf");
    setValidationError("");
    setGeneratedBlob(null);
    setGeneratedFileName("");
  }, []);

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
        className="w-full bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-3 px-6 rounded-lg transition-colors transform hover:scale-105 shadow-lg"
      >
        Goalie Journal
      </button>

      <Modal
        isOpen={showModal}
        labelledBy="journal-modal-title"
        className="max-w-md w-full"
        triggerRef={triggerRef}
      >
        {/* Scrollable content */}
        <div className="p-8 overflow-y-auto flex-1 min-h-0">
          <div className="flex items-center gap-4 mb-6">
            <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
            <h2
              id="journal-modal-title"
              className="text-2xl font-bold text-usa-blue dark:text-blue-400"
            >
              Generate Goalie Journal
            </h2>
          </div>

          <div className="mb-4">
            <label
              htmlFor="goalieName"
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Goalie Name
            </label>
            <input
              type="text"
              id="goalieName"
              value={goalieName}
              onChange={(e) => setGoalieName(e.target.value)}
              disabled={!!generatedBlob || isGenerating}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter goalie name"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="journal-team-name"
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Team Name
            </label>
            <input
              type="text"
              id="journal-team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!!generatedBlob || isGenerating}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter team name"
            />
          </div>

          <div className="mb-4">
            <ImageUploader
              onImageCropped={handleImageCropped}
              disabled={!!generatedBlob || isGenerating}
            />
            {!logoPreview && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                If no logo is provided, the Goalie Gen logo will be used
              </p>
            )}
          </div>

          <FormatSelector
            format={outputFormat}
            onChange={setOutputFormat}
            name="journal-output-format"
            disabled={!!generatedBlob || isGenerating}
          />

          {validationError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {validationError}
            </div>
          )}

          {generatedBlob && !validationError && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg text-sm">
              Journal generated successfully! Click Download to save it.
            </div>
          )}
        </div>

        {/* Non-scrolling footer — action buttons always visible */}
        <div className="px-8 pb-8 flex gap-4 flex-shrink-0">
          {!generatedBlob ? (
            <>
              <button
                onClick={generateJournal}
                disabled={isGenerating}
                className={`flex-1 bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors ${
                  isGenerating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isGenerating ? "Generating..." : "Generate"}
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
