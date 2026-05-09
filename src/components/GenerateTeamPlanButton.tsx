import * as React from "react";
import type { Paragraph } from "docx";
import Logo from "./Logo";
import { trackEvent } from "../utils/analytics";
import ImageUploader from "./ImageUploader";
import FormatSelector from "./FormatSelector";
import { parseMarkdown } from "../utils/markdownParser";
import { blocksToDocxParagraphs } from "../utils/docxContent";
import { loadDocxModule, loadJsPdfModule } from "../utils/loadExportModules";
import { OBJECT_URL_REVOKE_DELAY_MS } from "../utils/staticAsset";
import seasonOverviewMd from "../content/team-plan/season-overview.md";
import keyDevelopmentGoalsMd from "../content/team-plan/key-development-goals.md";
import practiceTemplateMd from "../content/team-plan/practice-template.md";
import notesMd from "../content/team-plan/notes.md";

type AgeGroup = "8u" | "10u" | "12u" | "14u+";
type SkillLevel = "beginner" | "intermediate" | "advanced";

interface GenerateTeamPlanButtonProps {
  variant?: "blue" | "red";
}

export default function GenerateTeamPlanButton({ variant = "blue" }: GenerateTeamPlanButtonProps) {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [teamName, setTeamName] = React.useState<string>("");
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [ageGroup, setAgeGroup] = React.useState<string>("");
  const [skillLevel, setSkillLevel] = React.useState<string>("");
  const [numberOfPractices, setNumberOfPractices] = React.useState<string>("");
  const [outputFormat, setOutputFormat] = React.useState<"docx" | "pdf">("docx");
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [validationError, setValidationError] = React.useState<string>("");
  const [generatedBlob, setGeneratedBlob] = React.useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = React.useState<string>("");

  const ageGroups: AgeGroup[] = ["8u", "10u", "12u", "14u+"];
  const skillLevels: SkillLevel[] = ["beginner", "intermediate", "advanced"];

  const handleImageChange = (file: File | null, previewUrl: string | null) => {
    setSelectedImage(file);
    setImagePreview(previewUrl);
  };

  const validateInputs = (): boolean => {
    setValidationError("");

    if (!teamName.trim()) {
      setValidationError("Please enter a team name");
      return false;
    }

    if (!ageGroup) {
      setValidationError("Please select an age group");
      return false;
    }

    if (!skillLevel) {
      setValidationError("Please select a skill level");
      return false;
    }

    if (!numberOfPractices.trim()) {
      setValidationError("Please enter the number of practices");
      return false;
    }

    if (numberOfPractices.includes(".") || numberOfPractices.includes(",")) {
      setValidationError("Number of practices must be a whole number between 0 and 50");
      return false;
    }

    const practicesNum = parseInt(numberOfPractices, 10);
    if (
      isNaN(practicesNum) ||
      practicesNum < 0 ||
      practicesNum > 50 ||
      practicesNum.toString() !== numberOfPractices.trim()
    ) {
      setValidationError("Number of practices must be a whole number between 0 and 50");
      return false;
    }

    return true;
  };

  const generateDocx = async (): Promise<void> => {
    const { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } =
      await loadDocxModule();
    const practicesNum = parseInt(numberOfPractices, 10);

    let arrayBuffer: ArrayBuffer | null = null;
    if (selectedImage) {
      arrayBuffer = await selectedImage.arrayBuffer();
    }

    const documentChildren: Paragraph[] = [
      new Paragraph({
        text: teamName,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: "Team-Level Goaltending Development Plan",
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ];

    if (arrayBuffer && imagePreview) {
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
              data: arrayBuffer,
              transformation: { width: imgWidth, height: imgHeight },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    documentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: `Age Group: ${ageGroup}` })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Experience Level: ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}`,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Number of Practices: ${practicesNum}` })],
        spacing: { after: 400 },
      })
    );

    documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(seasonOverviewMd)));
    documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(keyDevelopmentGoalsMd)));

    documentChildren.push(
      new Paragraph({
        text: "Practice Plans",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const allTemplateBlocks = parseMarkdown(practiceTemplateMd);
    // Skip only the first heading (section title) so the "Practice N" label
    // above each practice isn't duplicated, but any sub-headings in the
    // template (e.g. "### Warm-Up") are still rendered in each practice.
    const firstHeadingIdx = allTemplateBlocks.findIndex((b) => b.type === "heading");
    const templateBlocks =
      firstHeadingIdx >= 0
        ? allTemplateBlocks.filter((_, i) => i !== firstHeadingIdx)
        : allTemplateBlocks;
    for (let i = 1; i <= practicesNum; i++) {
      documentChildren.push(
        new Paragraph({
          text: `Practice ${i}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );
      documentChildren.push(...blocksToDocxParagraphs(templateBlocks));
    }

    documentChildren.push(...blocksToDocxParagraphs(parseMarkdown(notesMd)));

    const doc = new Document({
      sections: [{ properties: {}, children: documentChildren }],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = teamName.replace(/[<>:"/\\|?*]/g, "_");
    setGeneratedBlob(blob);
    setGeneratedFileName(`${safeName}_Team_Development_Plan.docx`);
  };

  const generatePdf = async (): Promise<void> => {
    const { jsPDF } = await loadJsPdfModule();
    const doc = new jsPDF();
    const practicesNum = parseInt(numberOfPractices, 10);

    doc.setFontSize(24);
    doc.text(`${teamName}`, 105, 30, { align: "center" });
    doc.setFontSize(18);
    doc.text("Team-Level Goaltending Development Plan", 105, 45, { align: "center" });

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

        doc.addImage(imagePreview, "PNG", 105 - w / 2, 55, w, h);
      } catch (error) {
        console.error("Error adding image to PDF:", error);
      }
    }

    doc.setFontSize(12);
    const metadataY = imagePreview ? 145 : 60;
    doc.text(`Age Group: ${ageGroup}`, 20, metadataY);
    doc.text(
      `Experience Level: ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}`,
      20,
      metadataY + 10
    );
    doc.text(`Number of Practices: ${practicesNum}`, 20, metadataY + 20);

    const pdfPageHeight = doc.internal.pageSize.height - 15;
    let pdfY = metadataY + 40;

    const addPageIfNeeded = (neededHeight: number) => {
      if (pdfY + neededHeight > pdfPageHeight) {
        doc.addPage();
        pdfY = 20;
      }
    };

    for (const block of parseMarkdown(seasonOverviewMd)) {
      if (block.type === "heading") {
        addPageIfNeeded(10);
        doc.setFontSize(16);
        doc.text(block.text, 20, pdfY);
        pdfY += 10;
      } else if (block.type === "paragraph") {
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(block.text, 170) as string[];
        addPageIfNeeded(lines.length * 7);
        lines.forEach((line) => {
          doc.text(line, 20, pdfY);
          pdfY += 7;
        });
      }
    }

    pdfY += 8;
    for (const block of parseMarkdown(keyDevelopmentGoalsMd)) {
      if (block.type === "heading") {
        addPageIfNeeded(8);
        doc.setFontSize(14);
        doc.text(block.text, 20, pdfY);
        pdfY += 8;
      } else if (block.type === "bullet") {
        const bulletLines = doc.splitTextToSize(`- ${block.text}`, 165) as string[];
        addPageIfNeeded(bulletLines.length * 7);
        doc.setFontSize(10);
        bulletLines.forEach((bLine) => {
          doc.text(bLine, 25, pdfY);
          pdfY += 7;
        });
      }
    }

    doc.addPage();
    doc.setFontSize(18);
    doc.text("Practice Plans", 105, 20, { align: "center" });

    let currentY = 35;
    const pageHeight = doc.internal.pageSize.height;
    const allPdfTemplateBlocks = parseMarkdown(practiceTemplateMd);
    // Skip only the first heading (section title) so each practice's own
    // "Practice N" label isn't duplicated, but sub-headings are preserved.
    const firstPdfHeadingIdx = allPdfTemplateBlocks.findIndex((b) => b.type === "heading");
    const pdfTemplateBlocks =
      firstPdfHeadingIdx >= 0
        ? allPdfTemplateBlocks.filter((_, i) => i !== firstPdfHeadingIdx)
        : allPdfTemplateBlocks;

    for (let i = 1; i <= practicesNum; i++) {
      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text(`Practice ${i}`, 20, currentY);
      doc.setFontSize(10);
      currentY += 8;

      for (const block of pdfTemplateBlocks) {
        if (block.type === "paragraph") {
          const lines = doc.splitTextToSize(block.text, 165) as string[];
          lines.forEach((line) => {
            if (currentY > pageHeight - 15) {
              doc.addPage();
              currentY = 20;
            }
            doc.text(line, 25, currentY);
            currentY += 6;
          });
        } else if (block.type === "heading") {
          if (currentY > pageHeight - 15) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFontSize(12);
          doc.text(block.text, 25, currentY);
          doc.setFontSize(10);
          currentY += 7;
        } else if (block.type === "bullet") {
          const lines = doc.splitTextToSize(`\u2022 ${block.text}`, 160) as string[];
          lines.forEach((line) => {
            if (currentY > pageHeight - 15) {
              doc.addPage();
              currentY = 20;
            }
            doc.text(line, 25, currentY);
            currentY += 6;
          });
        }
      }
      currentY += 6;
    }

    doc.addPage();
    let notesY = 20;
    const notesPageHeight = doc.internal.pageSize.height - 15;
    for (const block of parseMarkdown(notesMd)) {
      if (block.type === "heading") {
        if (notesY + 10 > notesPageHeight) {
          doc.addPage();
          notesY = 20;
        }
        const fontSize = block.level === 1 ? 16 : 12;
        doc.setFontSize(fontSize);
        doc.text(block.text, 20, notesY);
        notesY += 10;
      } else if (block.type === "paragraph") {
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(block.text, 170) as string[];
        if (notesY + lines.length * 7 > notesPageHeight) {
          doc.addPage();
          notesY = 20;
        }
        lines.forEach((line) => {
          doc.text(line, 25, notesY);
          notesY += 7;
        });
      }
    }

    const safeName = teamName.replace(/[<>:"/\\|?*]/g, "_");
    setGeneratedBlob(doc.output("blob"));
    setGeneratedFileName(`${safeName}_Team_Development_Plan.pdf`);
  };

  const handleGenerate = async () => {
    if (!validateInputs()) {
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
        type: "team",
        format: outputFormat,
        team_name: teamName,
        age_group: ageGroup,
        skill_level: skillLevel,
        practices_count: parseInt(numberOfPractices, 10),
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
      const url = URL.createObjectURL(generatedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generatedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS);

      trackEvent("download_plan", {
        type: "team",
        format: outputFormat,
        team_name: teamName,
      });

      setShowModal(false);
      setTeamName("");
      setSelectedImage(null);
      setImagePreview(null);
      setAgeGroup("");
      setSkillLevel("");
      setNumberOfPractices("");
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
    setAgeGroup("");
    setSkillLevel("");
    setNumberOfPractices("");
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

  const variantClasses = {
    blue: "bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700",
    red: "bg-usa-red hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800",
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${variantClasses[variant]} text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105 text-center`}
      >
        Generate Team Development Plan
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
            aria-labelledby="team-plan-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
              <h2
                id="team-plan-modal-title"
                className="text-2xl font-bold text-usa-blue dark:text-blue-400"
              >
                Generate Team Plan
              </h2>
            </div>

            <div className="mb-4">
              <label
                htmlFor="team-name"
                className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
              >
                Team Name
              </label>
              <input
                type="text"
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={!!generatedBlob || isGenerating}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your team name"
              />
            </div>

            <div className="mb-4">
              <ImageUploader
                onImageCropped={handleImageChange}
                disabled={!!generatedBlob || isGenerating}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="ageGroup"
                className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
              >
                Age Group
              </label>
              <select
                id="ageGroup"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                disabled={!!generatedBlob || isGenerating}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select age group</option>
                {ageGroups.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="skillLevel"
                className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
              >
                Skill Level
              </label>
              <select
                id="skillLevel"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                disabled={!!generatedBlob || isGenerating}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select skill level</option>
                {skillLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="numberOfPractices"
                className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
              >
                Number of Practices (0-50)
              </label>
              <input
                type="number"
                id="numberOfPractices"
                value={numberOfPractices}
                onChange={(e) => setNumberOfPractices(e.target.value)}
                min="0"
                max="50"
                disabled={!!generatedBlob || isGenerating}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter number (0-50)"
              />
            </div>

            <FormatSelector
              format={outputFormat}
              onChange={setOutputFormat}
              name="team-output-format"
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

            <div className="flex gap-4">
              {!generatedBlob ? (
                <>
                  <button
                    onClick={handleGenerate}
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
                    className={`flex-1 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors ${
                      isGenerating ? "opacity-50 cursor-not-allowed" : ""
                    }`}
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
