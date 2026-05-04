import * as React from "react";
import { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import { withPrefix } from "gatsby";
import { saveAs } from "file-saver";
import Logo from "./Logo";
import { trackEvent } from "../utils/analytics";
import ImageUploader from "./ImageUploader";
import FormatSelector from "./FormatSelector";
import { parseMarkdown } from "../utils/markdownParser";
import coverMd from "../content/goalie-journal/cover.md";
import seasonGoalsMd from "../content/goalie-journal/season-goals.md";
import practiceEntryMd from "../content/goalie-journal/practice-entry.md";
import endOfSeasonMd from "../content/goalie-journal/end-of-season.md";

const BLANK_LINE = "_______________________________________________";

export default function GoalieJournalButton() {
  const [showModal, setShowModal] = React.useState<boolean>(false);
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
      img.src = withPrefix("/images/logos/logo-alt-light.png");
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
    const entryLabels = entryBlocks.filter((b) => b.type === "paragraph").map((b) => b.text);

    for (let page = 0; page < 6; page++) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text(`${entryTitle} - Page ${page + 1}`, 105, 15, { align: "center" });

      const entriesPerPage = 4;
      const entryHeight = 65;

      for (let entry = 0; entry < entriesPerPage; entry++) {
        const startY = 25 + entry * entryHeight;
        const entryNum = page * entriesPerPage + entry + 1;

        doc.setLineWidth(0.5);
        doc.rect(15, startY, 180, entryHeight - 2);

        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text(`Entry ${entryNum}`, 20, startY + 7);
        doc.setFont(undefined, "normal");

        doc.setFontSize(9);
        doc.text("Date: _______________", 20, startY + 15);
        doc.text("\u25A1 Practice  \u25A1 Game", 80, startY + 15);
        doc.text("Opponent: _______________", 135, startY + 15);

        const lineSpacing = 13;
        entryLabels.forEach((label, idx) => {
          const labelY = startY + 23 + idx * lineSpacing;
          doc.text(label, 20, labelY);
          doc.line(20, labelY + 6, 190, labelY + 6);
        });
      }
    }

    // End of Season Review page
    doc.addPage();
    const eosBlocks = parseMarkdown(endOfSeasonMd);
    const eosTitle =
      eosBlocks.find((b) => b.type === "heading")?.text ?? "End of Season Review";
    const eosPrompts = eosBlocks
      .filter((b) => b.type === "paragraph")
      .map((b) => b.text);

    doc.setFontSize(20);
    doc.text(eosTitle, 105, 20, { align: "center" });

    doc.setFontSize(12);
    let eosY = 40;
    eosPrompts.forEach((prompt) => {
      doc.text(prompt, 20, eosY);
      for (let i = 0; i < 3; i++) {
        doc.line(20, eosY + 10 + i * 15, 190, eosY + 10 + i * 15);
      }
      eosY += 60;
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
          children: [
            new TextRun({ text: `${i}. ` }),
            new TextRun({ text: BLANK_LINE }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Practice & Game Log section — use markdown paragraphs as the write-in prompts
    const entryBlocks = parseMarkdown(practiceEntryMd);
    const entryTitle =
      entryBlocks.find((b) => b.type === "heading")?.text ?? "Practice & Game Log";
    const entryPrompts = entryBlocks.filter((b) => b.type === "paragraph").map((b) => b.text);

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
    const eosTitle =
      eosBlocks.find((b) => b.type === "heading")?.text ?? "End of Season Review";
    const eosPrompts = eosBlocks
      .filter((b) => b.type === "paragraph")
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
        URL.revokeObjectURL(url);
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
        onClick={() => setShowModal(true)}
        className="w-full bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-3 px-6 rounded-lg transition-colors transform hover:scale-105 shadow-lg"
      >
        Goalie Journal
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (!isGenerating && !generatedBlob) {
              handleCancel();
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
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
                disabled={!!generatedBlob}
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
                disabled={!!generatedBlob}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter team name"
              />
            </div>

            <div className="mb-4">
              <ImageUploader onImageCropped={handleImageCropped} disabled={!!generatedBlob} />
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
              disabled={!!generatedBlob}
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

            <div className="flex gap-4">
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
          </div>
        </div>
      )}
    </>
  );
}
