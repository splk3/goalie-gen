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
import {
  DEFAULT_JOURNAL_ENTRY_COUNT,
  MAX_JOURNAL_ENTRY_COUNT,
  MIN_JOURNAL_ENTRY_COUNT,
  getDefaultJournalSeason,
  normalizeJournalSeason,
  parseJournalEntryCount,
  sanitizeJournalFilenamePart,
} from "../utils/generatorDefaults";
import { buildGoalieJournalPdf } from "../utils/builders/goalieJournalBuilder";
import { GOALIE_JOURNAL_PROMOTION_URL } from "../utils/goalieJournalPromotion";
import coverMd from "../content/goalie-journal/cover.md";
import acknowledgementsMd from "../content/goalie-journal/acknowledgements.md";
import howToUseMd from "../content/goalie-journal/how-to-use.md";
import howToImproveEveryDayMd from "../content/goalie-journal/how-to-improve-every-day.md";
import seasonGoalsMd from "../content/goalie-journal/season-goals.md";
import practiceEntryMd from "../content/goalie-journal/practice-entry.md";
import endOfSeasonMd from "../content/goalie-journal/end-of-season.md";

export default function GoalieJournalButton({ label = "Goalie Journal" }: { label?: string }) {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [goalieName, setGoalieName] = React.useState<string>("");
  const [teamName, setTeamName] = React.useState<string>("");
  const [season, setSeason] = React.useState<string>(() => getDefaultJournalSeason());
  const [entryCount, setEntryCount] = React.useState<string>(String(DEFAULT_JOURNAL_ENTRY_COUNT));
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [goaliePhotoPreview, setGoaliePhotoPreview] = React.useState<string | null>(null);
  const [writeInGoalieName, setWriteInGoalieName] = React.useState<boolean>(false);
  const [writeInTeamName, setWriteInTeamName] = React.useState<boolean>(false);
  const [writeInSeason, setWriteInSeason] = React.useState<boolean>(false);
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
  const validationErrorRef = React.useRef<HTMLDivElement>(null);
  const shouldScrollValidationErrorRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (validationError && shouldScrollValidationErrorRef.current) {
      validationErrorRef.current?.scrollIntoView?.({ block: "nearest" });
      shouldScrollValidationErrorRef.current = false;
    }
  }, [validationError]);

  const handleImageCropped = React.useCallback((_file: File | null, previewUrl: string | null) => {
    setLogoPreview(previewUrl);
  }, []);

  const handleGoaliePhotoCropped = React.useCallback(
    (_file: File | null, previewUrl: string | null) => {
      setGoaliePhotoPreview(previewUrl);
    },
    []
  );

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

  const getLogoAsBase64 = (previewUrl: string | null = logoPreview): Promise<string | null> => {
    return new Promise((resolve) => {
      if (previewUrl) {
        resolve(previewUrl);
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

  const generatePdf = async (
    normalizedSeason: string,
    normalizedEntryCount: number
  ): Promise<void> => {
    const jsPdfModule = await loadJsPdfModule();
    let qrCodeDataUrl: string | null = null;
    try {
      const qrCode = await import("qrcode");
      qrCodeDataUrl = await qrCode.toDataURL(GOALIE_JOURNAL_PROMOTION_URL, {
        margin: 1,
        width: 160,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
    } catch (error) {
      console.error("Failed to generate goalie journal QR code", error);
    }
    const logoBase64 = await getLogoAsBase64();
    const footerLogoBase64 = await getLogoAsBase64(null);

    const resolveLogoData = async (
      dataUrl: string | null
    ): Promise<import("../types/generatorConfig").JournalLogoData | null> => {
      if (!dataUrl) {
        return null;
      }

      let logoWidth = 60;
      let logoHeight = 60;
      try {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = dataUrl;
        });
        logoWidth = img.width > 0 ? img.width : 60;
        logoHeight = img.height > 0 ? img.height : 60;
      } catch (e) {
        console.error("Failed to parse logo dimensions", e);
      }
      return { dataUrl, width: logoWidth, height: logoHeight };
    };

    const logoData = await resolveLogoData(logoBase64);
    const footerLogoData = await resolveLogoData(footerLogoBase64);
    const goaliePhotoData = await resolveLogoData(goaliePhotoPreview);

    const config: import("../types/generatorConfig").GoalieJournalConfig = {
      goalieName: writeInGoalieName ? "" : goalieName.trim(),
      teamName: writeInTeamName ? "" : teamName.trim(),
      primaryColor: primaryTeamColor,
      secondaryColor: secondaryTeamColor,
      season: normalizedSeason,
      entryCount: normalizedEntryCount,
      writeInGoalieName,
      writeInTeamName,
      writeInSeason,
    };

    const journalContent: import("../types/generatorConfig").GoalieJournalContent = {
      coverMd,
      acknowledgementsMd,
      howToUseMd,
      howToImproveEveryDayMd,
      seasonGoalsMd,
      practiceEntryMd,
      endOfSeasonMd,
    };

    const doc = buildGoalieJournalPdf(
      config,
      journalContent,
      logoData,
      jsPdfModule,
      qrCodeDataUrl,
      footerLogoData,
      goaliePhotoData
    );

    const sanitizedName = writeInGoalieName
      ? "Goalie"
      : sanitizeJournalFilenamePart(goalieName, "Goalie");
    const sanitizedSeason = writeInSeason
      ? "Season"
      : sanitizeJournalFilenamePart(normalizedSeason, "Season");
    const blob = doc.output("blob");
    setGeneratedBlob(blob);
    setGeneratedFileName(`${sanitizedName}_Goalie_Journal_${sanitizedSeason}.pdf`);
  };

  const generateJournal = async () => {
    setValidationError("");
    shouldScrollValidationErrorRef.current = false;

    if (!writeInGoalieName && !goalieName.trim()) {
      shouldScrollValidationErrorRef.current = true;
      setValidationError("Please enter a goalie name");
      return;
    }

    if (!writeInTeamName && !teamName.trim()) {
      shouldScrollValidationErrorRef.current = true;
      setValidationError("Please enter a team name");
      return;
    }

    const normalizedSeason = normalizeJournalSeason(season);
    if (!writeInSeason && !normalizedSeason) {
      shouldScrollValidationErrorRef.current = true;
      setValidationError("Please enter a season");
      return;
    }

    const normalizedEntryCount = parseJournalEntryCount(entryCount);
    if (normalizedEntryCount === null) {
      shouldScrollValidationErrorRef.current = true;
      setValidationError(
        `Number of journal entries must be a whole number between ${MIN_JOURNAL_ENTRY_COUNT} and ${MAX_JOURNAL_ENTRY_COUNT}`
      );
      return;
    }

    setIsGenerating(true);

    try {
      await generatePdf(normalizedSeason ?? "", normalizedEntryCount);

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
      setSeason(getDefaultJournalSeason());
      setEntryCount(String(DEFAULT_JOURNAL_ENTRY_COUNT));
      setLogoPreview(null);
      setGoaliePhotoPreview(null);
      setWriteInGoalieName(false);
      setWriteInTeamName(false);
      setWriteInSeason(false);
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
    setSeason(getDefaultJournalSeason());
    setEntryCount(String(DEFAULT_JOURNAL_ENTRY_COUNT));
    setLogoPreview(null);
    setGoaliePhotoPreview(null);
    setWriteInGoalieName(false);
    setWriteInTeamName(false);
    setWriteInSeason(false);
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
              disabled={writeInGoalieName || !!generatedBlob || isGenerating}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter goalie name"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                aria-label="Write Goalie Name in later on printed journal"
                checked={writeInGoalieName}
                onChange={(e) => setWriteInGoalieName(e.target.checked)}
                disabled={!!generatedBlob || isGenerating}
                className="h-4 w-4 accent-usa-blue dark:accent-blue-400 disabled:cursor-not-allowed"
              />
              Write in later on printed journal
            </label>
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
              disabled={writeInTeamName || !!generatedBlob || isGenerating}
              className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter team name"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                aria-label="Write Team Name in later on printed journal"
                checked={writeInTeamName}
                onChange={(e) => setWriteInTeamName(e.target.checked)}
                disabled={!!generatedBlob || isGenerating}
                className="h-4 w-4 accent-usa-blue dark:accent-blue-400 disabled:cursor-not-allowed"
              />
              Write in later on printed journal
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="journal-season"
                className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
              >
                Season
              </label>
              <input
                type="text"
                id="journal-season"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                disabled={writeInSeason || !!generatedBlob || isGenerating}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g. 2026-2027 or Spring"
              />
              <label className="mt-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  aria-label="Write Season in later on printed journal"
                  checked={writeInSeason}
                  onChange={(e) => setWriteInSeason(e.target.checked)}
                  disabled={!!generatedBlob || isGenerating}
                  className="h-4 w-4 accent-usa-blue dark:accent-blue-400 disabled:cursor-not-allowed"
                />
                Write in later on printed journal
              </label>
            </div>

            <div>
              <label
                htmlFor="journal-entry-count"
                className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
              >
                Number of Journal Entries
              </label>
              <input
                type="number"
                id="journal-entry-count"
                min={MIN_JOURNAL_ENTRY_COUNT}
                max={MAX_JOURNAL_ENTRY_COUNT}
                step="1"
                value={entryCount}
                onChange={(e) => setEntryCount(e.target.value)}
                disabled={!!generatedBlob || isGenerating}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <ImageUploader
            onImageCropped={handleGoaliePhotoCropped}
            disabled={!!generatedBlob || isGenerating}
            label="Goalie Photo (Optional)"
            inputId="journal-goalie-photo"
          />

          <div className="mb-4">
            <ImageUploader
              onImageCropped={handleImageCropped}
              disabled={!!generatedBlob || isGenerating}
              label="Team Logo (Optional)"
              inputId="journal-team-logo"
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
            <div
              ref={validationErrorRef}
              className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm"
            >
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
        <div className="px-8 pt-4 pb-8 flex gap-4 flex-shrink-0">
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
