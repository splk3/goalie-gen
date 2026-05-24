import * as React from "react";
import type { Paragraph } from "docx";
import { saveAs } from "file-saver";
import Logo from "./Logo";
import Modal from "./Modal";
import { trackEvent } from "../utils/analytics";
import ImageUploader from "./ImageUploader";
import FormatSelector from "./FormatSelector";
import { parseMarkdown } from "../utils/markdownParser";
import { blocksToDocxParagraphs } from "../utils/docxContent";
import { loadDocxModule, loadJsPdfModule } from "../utils/loadExportModules";
import { toDocxImageTypeFromMime } from "../utils/docxImageType";
import introductionMd from "../content/club-plan/introduction.md";
import seasonGoalsMd from "../content/club-plan/season-goals.md";
import trainingScheduleMd from "../content/club-plan/training-schedule.md";
import skillDevelopmentMd from "../content/club-plan/skill-development.md";
import equipmentMd from "../content/club-plan/equipment.md";
import progressTrackingMd from "../content/club-plan/progress-tracking.md";
import resourcesMd from "../content/club-plan/resources.md";
import contactInfoMd from "../content/club-plan/contact-information.md";

const CLUB_PLAN_SECTIONS = [
  introductionMd,
  seasonGoalsMd,
  trainingScheduleMd,
  skillDevelopmentMd,
  equipmentMd,
  progressTrackingMd,
  resourcesMd,
  contactInfoMd,
];

export default function GenerateClubPlanButton() {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [teamName, setTeamName] = React.useState<string>("");
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [outputFormat, setOutputFormat] = React.useState<"docx" | "pdf">("docx");
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [validationError, setValidationError] = React.useState<string>("");
  const [generatedBlob, setGeneratedBlob] = React.useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = React.useState<string>("");

  const handleImageCropped = React.useCallback((file: File | null, previewUrl: string | null) => {
    setSelectedImage(file);
    setImagePreview(previewUrl);
  }, []);

  const generateDocx = async (): Promise<void> => {
    const { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph } =
      await loadDocxModule();

    let arrayBuffer: ArrayBuffer | null = null;
    if (selectedImage) {
      arrayBuffer = await selectedImage.arrayBuffer();
    }

    const documentChildren: Paragraph[] = [
      new Paragraph({
        text: `${teamName} - Goaltending Development Plan`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ];

    if (arrayBuffer && imagePreview) {
      const docxImageType = toDocxImageTypeFromMime(selectedImage?.type);
      let imgWidth = 400;
      let imgHeight = 400;

      try {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = imagePreview;
        });

        const ratio = img.width / img.height;
        if (ratio > 1) {
          imgWidth = 400;
          imgHeight = 400 / ratio;
        } else {
          imgHeight = 400;
          imgWidth = 400 * ratio;
        }
      } catch (e) {
        console.error("Failed to parse image dimensions", e);
      }

      documentChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: docxImageType,
              data: arrayBuffer,
              transformation: { width: imgWidth, height: imgHeight },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    for (const sectionMd of CLUB_PLAN_SECTIONS) {
      documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(sectionMd)));
    }

    const doc = new Document({
      sections: [{ properties: {}, children: documentChildren }],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = teamName.replace(/[<>:"/\\|?*]/g, "_");
    setGeneratedBlob(blob);
    setGeneratedFileName(`${safeName}_Goaltending_Development_Plan.docx`);
  };

  const generatePdf = async (): Promise<void> => {
    const { jsPDF } = await loadJsPdfModule();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const nameFontSize = 24;
    // jsPDF uses pt for font sizes but mm for coordinates; ~0.4 converts pt to mm line spacing
    const ptToMmLineSpacing = 0.4;
    const nameLineHeight = nameFontSize * ptToMmLineSpacing;

    doc.setFontSize(nameFontSize);
    const nameLines = doc.splitTextToSize(teamName, contentWidth) as string[];
    let nameY = 30;
    nameLines.forEach((line) => {
      doc.text(line, 105, nameY, { align: "center" });
      nameY += nameLineHeight;
    });
    const subtitleFontSize = 18;
    const subtitleLineHeight = subtitleFontSize * ptToMmLineSpacing;
    doc.setFontSize(subtitleFontSize);
    doc.text("Goaltending Development Plan", 105, nameY + 5, { align: "center" });
    const imageStartY = nameY + 5 + subtitleLineHeight + 5;

    if (imagePreview) {
      try {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = imagePreview;
        });

        const maxW = 80;
        const maxH = 80;
        let w = img.width > 0 ? img.width : maxW;
        let h = img.height > 0 ? img.height : maxH;
        const ratio = Math.min(maxW / w, maxH / h);
        w = w * ratio;
        h = h * ratio;

        doc.addImage(imagePreview, "PNG", 105 - w / 2, imageStartY, w, h);
      } catch (error) {
        console.error("Error adding image to PDF:", error);
      }
    }

    doc.addPage();
    let currentY = 20;
    const pageHeight = doc.internal.pageSize.height - 20;

    for (const sectionMd of CLUB_PLAN_SECTIONS) {
      const blocks = parseMarkdown(sectionMd);
      for (const block of blocks) {
        if (block.type === "heading") {
          const fontSize = block.level === 1 ? 18 : block.level === 2 ? 14 : 12;
          if (currentY + 10 > pageHeight) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFontSize(fontSize);
          doc.text(block.text, margin, currentY);
          currentY += 9;
        } else if (block.type === "paragraph") {
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(block.text, contentWidth) as string[];
          if (currentY + lines.length * 6 > pageHeight) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(lines, margin, currentY);
          currentY += lines.length * 6 + 4;
        } else if (block.type === "bullet") {
          doc.setFontSize(10);
          const bulletLines = doc.splitTextToSize(
            `\u2022 ${block.text}`,
            contentWidth - 5
          ) as string[];
          if (currentY + bulletLines.length * 6 > pageHeight) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(bulletLines, margin + 5, currentY);
          currentY += bulletLines.length * 6 + 2;
        }
      }
      currentY += 4;
    }

    const safeName = teamName.replace(/[<>:"/\\|?*]/g, "_");
    setGeneratedBlob(doc.output("blob"));
    setGeneratedFileName(`${safeName}_Goaltending_Development_Plan.pdf`);
  };

  const generateDocument = async () => {
    setValidationError("");

    if (!teamName.trim()) {
      setValidationError("Please enter a team name");
      return;
    }

    setIsGenerating(true);

    try {
      if (outputFormat === "docx") {
        await generateDocx();
      } else {
        await generatePdf();
      }

      trackEvent("generate_plan", {
        type: "club",
        format: outputFormat,
        team_name_provided: !!teamName,
        team_name: teamName,
      });
    } catch (error) {
      console.error("Error generating document:", error);
      setValidationError("There was an error generating the document. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedBlob && generatedFileName) {
      saveAs(generatedBlob, generatedFileName);

      trackEvent("download_plan", {
        type: "club",
        format: outputFormat,
        team_name: teamName,
      });

      setShowModal(false);
      setTeamName("");
      setSelectedImage(null);
      setImagePreview(null);
      setOutputFormat("docx");
      setValidationError("");
      setGeneratedBlob(null);
      setGeneratedFileName("");
    }
  };

  const handleCancel = React.useCallback(() => {
    setShowModal(false);
    setTeamName("");
    setSelectedImage(null);
    setImagePreview(null);
    setOutputFormat("docx");
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
        className="bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105 text-center"
      >
        Generate Club Development Plan
      </button>

      <Modal
        isOpen={showModal}
        labelledBy="club-plan-modal-title"
        className="max-w-md w-full"
        triggerRef={triggerRef}
      >
        {/* Scrollable content */}
        <div className="p-8 overflow-y-auto flex-1 min-h-0">
          <div className="flex items-center gap-4 mb-6">
            <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
            <h2
              id="club-plan-modal-title"
              className="text-2xl font-bold text-usa-blue dark:text-blue-400"
            >
              Generate Development Plan
            </h2>
          </div>

          <div className="mb-4">
            <label
              htmlFor="club-team-name"
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Team Name
            </label>
            <input
              type="text"
              id="club-team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!!generatedBlob || isGenerating}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your team name"
            />
          </div>

          <ImageUploader
            onImageCropped={handleImageCropped}
            disabled={!!generatedBlob || isGenerating}
          />

          <FormatSelector
            format={outputFormat}
            onChange={setOutputFormat}
            name="club-output-format"
            disabled={!!generatedBlob || isGenerating}
          />

          {validationError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {validationError}
            </div>
          )}

          {generatedBlob && !validationError && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg text-sm">
              Document generated successfully! Click Download to save it.
            </div>
          )}
        </div>

        {/* Non-scrolling footer — action buttons always visible */}
        <div className="px-8 pb-8 flex gap-4 flex-shrink-0">
          {!generatedBlob ? (
            <>
              <button
                onClick={generateDocument}
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
