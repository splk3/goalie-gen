import * as React from "react";
import { withPrefix } from "gatsby";
import Logo from "./Logo";
import Modal from "./Modal";
import { trackEvent } from "../utils/analytics";
import ImageUploader from "./ImageUploader";
import TeamColorPickers from "./TeamColorPickers";
import { buildCacheBustedAssetPath, OBJECT_URL_REVOKE_DELAY_MS } from "../utils/staticAsset";
import { loadJsPdfModule } from "../utils/loadExportModules";
import {
  DEFAULT_PRIMARY_TEAM_COLOR,
  DEFAULT_SECONDARY_TEAM_COLOR,
  extractPaletteHexColorsFromDataUrl,
} from "../utils/teamColors";
import { DEFAULT_JOURNAL_ENTRY_COUNT } from "../utils/generatorDefaults";
import { buildGoalieJournalPdf } from "../utils/builders/goalieJournalBuilder";
import coverMd from "../content/goalie-journal/cover.md";
import seasonGoalsMd from "../content/goalie-journal/season-goals.md";
import practiceEntryMd from "../content/goalie-journal/practice-entry.md";
import endOfSeasonMd from "../content/goalie-journal/end-of-season.md";

export default function GoalieJournalButton({ label = "Goalie Journal" }: { label?: string }) {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [goalieName, setGoalieName] = React.useState<string>("");
  const [teamName, setTeamName] = React.useState<string>("");
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [primaryTeamColor, setPrimaryTeamColor] = React.useState<string>(
    DEFAULT_PRIMARY_TEAM_COLOR
  );
  const [secondaryTeamColor, setSecondaryTeamColor] = React.useState<string>(
    DEFAULT_SECONDARY_TEAM_COLOR
  );
  const [logoPaletteColors, setLogoPaletteColors] = React.useState<string[]>([]);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [validationError, setValidationError] = React.useState<string>("");
  const [generatedBlob, setGeneratedBlob] = React.useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = React.useState<string>("");

  const handleImageCropped = React.useCallback((_file: File | null, previewUrl: string | null) => {
    setLogoPreview(previewUrl);
  }, []);

  React.useEffect(() => {
    let isCancelled = false;

    const syncTeamColorsFromLogo = async () => {
      if (!logoPreview) {
        if (!isCancelled) {
          setLogoPaletteColors([]);
          setPrimaryTeamColor(DEFAULT_PRIMARY_TEAM_COLOR);
          setSecondaryTeamColor(DEFAULT_SECONDARY_TEAM_COLOR);
        }
        return;
      }

      const palette = await extractPaletteHexColorsFromDataUrl(logoPreview, 6);
      if (isCancelled) {
        return;
      }

      setLogoPaletteColors(palette);
      setPrimaryTeamColor(palette[0] ?? DEFAULT_PRIMARY_TEAM_COLOR);
      setSecondaryTeamColor(palette[1] ?? DEFAULT_SECONDARY_TEAM_COLOR);
    };

    void syncTeamColorsFromLogo();

    return () => {
      isCancelled = true;
    };
  }, [logoPreview]);

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

  const generatePdf = async (): Promise<void> => {
    const jsPdfModule = await loadJsPdfModule();
    const currentYear = new Date().getFullYear();
    const season = `${currentYear}-${currentYear + 1}`;

    const logoBase64 = await getLogoAsBase64();

    // Resolve logo dimensions for the builder
    let logoData: import("../types/generatorConfig").JournalLogoData | null = null;
    if (logoBase64) {
      let logoWidth = 60;
      let logoHeight = 60;
      try {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = logoBase64;
        });
        logoWidth = img.width > 0 ? img.width : 60;
        logoHeight = img.height > 0 ? img.height : 60;
      } catch (e) {
        console.error("Failed to parse logo dimensions", e);
      }
      logoData = { dataUrl: logoBase64, width: logoWidth, height: logoHeight };
    }

    const config: import("../types/generatorConfig").GoalieJournalConfig = {
      goalieName,
      teamName,
      season,
      entryCount: DEFAULT_JOURNAL_ENTRY_COUNT,
    };

    const journalContent: import("../types/generatorConfig").GoalieJournalContent = {
      coverMd,
      seasonGoalsMd,
      practiceEntryMd,
      endOfSeasonMd,
    };

    const doc = buildGoalieJournalPdf(config, journalContent, logoData, jsPdfModule);

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
      await generatePdf();

      trackEvent("generate_journal", {
        format: "pdf",
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
      const url = URL.createObjectURL(generatedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generatedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS);

      trackEvent("download_journal", {
        format: "pdf",
        team_name: teamName,
      });

      setShowModal(false);
      setGoalieName("");
      setTeamName("");
      setLogoPreview(null);
      setPrimaryTeamColor(DEFAULT_PRIMARY_TEAM_COLOR);
      setSecondaryTeamColor(DEFAULT_SECONDARY_TEAM_COLOR);
      setLogoPaletteColors([]);
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
    setPrimaryTeamColor(DEFAULT_PRIMARY_TEAM_COLOR);
    setSecondaryTeamColor(DEFAULT_SECONDARY_TEAM_COLOR);
    setLogoPaletteColors([]);
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
        className="w-full bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105 text-center"
      >
        {label}
      </button>

      <Modal
        isOpen={showModal}
        labelledBy="journal-modal-title"
        className="max-w-2xl w-full"
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

          <TeamColorPickers
            primaryColor={primaryTeamColor}
            secondaryColor={secondaryTeamColor}
            paletteColors={logoPaletteColors}
            disabled={!!generatedBlob || isGenerating}
            onPrimaryColorChange={setPrimaryTeamColor}
            onSecondaryColorChange={setSecondaryTeamColor}
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
