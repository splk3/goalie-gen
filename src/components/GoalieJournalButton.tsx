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
  JOURNAL_SEASON_GOAL_COUNT,
  MAX_JOURNAL_ENTRY_COUNT,
  MIN_JOURNAL_ENTRY_COUNT,
  getDefaultJournalSeason,
  normalizeJournalSeason,
  normalizeJournalSeasonGoals,
  parseJournalEntryCount,
  sanitizeJournalFilenamePart,
} from "../utils/generatorDefaults";
import { buildGoalieJournalPdf } from "../utils/builders/goalieJournalBuilder";
import { GOALIE_JOURNAL_PROMOTION_URL } from "../utils/goalieJournalPromotion";
import coverMd from "../content/goalie-journal/cover.md";
import acknowledgementsMd from "../content/goalie-journal/acknowledgements.md";
import howToUseMd from "../content/goalie-journal/how-to-use.md";
import howToImproveEveryDayMd from "../content/goalie-journal/how-to-improve-every-day.md";
import helpfulResourcesMd from "../content/goalie-journal/helpful-resources.md";
import eventEntryMd from "../content/goalie-journal/event-entry.md";
import endOfSeasonMd from "../content/goalie-journal/end-of-season.md";

const DEFAULT_LOGO_PATH = "/images/logos/logo-alt-light.png";
const GOLD_CERTIFICATION_BADGE_PATH = "/images/usahockey/usahockey-gold-certification.png";
const SKILLS_CYCLE_IMAGE_PATH = "/images/drill-design/goaltending-skills-cycle.png";
const SKILLS_PYRAMID_IMAGE_PATH = "/images/drill-design/goaltending-skills-pyramid.png";
const COACH_Z_ZONE_MAP_IMAGE_PATH = "/diagrams/coach-z-zone-map.png";

type GoalieJournalButtonProps = {
  label?: string;
  className?: string;
};

export default function GoalieJournalButton({
  label = "Goalie Journal",
  className = "",
}: GoalieJournalButtonProps) {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [goalieName, setGoalieName] = React.useState<string>("");
  const [teamName, setTeamName] = React.useState<string>("");
  const [season, setSeason] = React.useState<string>(() => getDefaultJournalSeason());
  const [entryCount, setEntryCount] = React.useState<string>(String(DEFAULT_JOURNAL_ENTRY_COUNT));
  const [seasonGoals, setSeasonGoals] = React.useState<string[]>(() =>
    Array(JOURNAL_SEASON_GOAL_COUNT).fill("")
  );
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [goaliePhotoPreview, setGoaliePhotoPreview] = React.useState<string | null>(null);
  const [writeInGoalieName, setWriteInGoalieName] = React.useState<boolean>(false);
  const [writeInTeamName, setWriteInTeamName] = React.useState<boolean>(false);
  const [writeInSeason, setWriteInSeason] = React.useState<boolean>(false);
  const [writeInSeasonGoals, setWriteInSeasonGoals] = React.useState<boolean>(false);
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

  const getStaticImageAsBase64 = (assetPath: string, label: string): Promise<string | null> => {
    return new Promise((resolve) => {
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
            `GoalieJournalButton: Failed to obtain 2D canvas context for ${label}. The journal will be generated without it.`
          );
          resolve(null);
        }
      };
      img.onerror = () => {
        console.warn(
          `GoalieJournalButton: Failed to load ${label}. The journal will be generated without it.`
        );
        resolve(null);
      };
      img.src = withPrefix(buildCacheBustedAssetPath(assetPath));
    });
  };

  const getLogoAsBase64 = (): Promise<string | null> =>
    logoPreview
      ? Promise.resolve(logoPreview)
      : getStaticImageAsBase64(DEFAULT_LOGO_PATH, "default logo");

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
    const [logoBase64, footerLogoBase64, goldCertificationBadgeBase64, skillsCycleBase64, skillsPyramidBase64, coachZZoneMapBase64] = await Promise.all([
      getLogoAsBase64(),
      getStaticImageAsBase64(DEFAULT_LOGO_PATH, "footer logo"),
      getStaticImageAsBase64(GOLD_CERTIFICATION_BADGE_PATH, "Gold Certification badge"),
      getStaticImageAsBase64(SKILLS_CYCLE_IMAGE_PATH, "Skills Cycle"),
      getStaticImageAsBase64(SKILLS_PYRAMID_IMAGE_PATH, "Skills Pyramid"),
      getStaticImageAsBase64(COACH_Z_ZONE_MAP_IMAGE_PATH, "Coach Z Zone Map"),
    ]);

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
    const goldCertificationBadgeData = await resolveLogoData(goldCertificationBadgeBase64);
    const skillsCycleData = await resolveLogoData(skillsCycleBase64);
    const skillsPyramidData = await resolveLogoData(skillsPyramidBase64);
    const coachZZoneMapData = await resolveLogoData(coachZZoneMapBase64);
    const normalizedSeasonGoals = normalizeJournalSeasonGoals(seasonGoals);

    const config: import("../types/generatorConfig").GoalieJournalConfig = {
      goalieName: writeInGoalieName ? "" : goalieName.trim(),
      teamName: writeInTeamName ? "" : teamName.trim(),
      primaryColor: primaryTeamColor,
      secondaryColor: secondaryTeamColor,
      season: normalizedSeason,
      entryCount: normalizedEntryCount,
      seasonGoals: normalizedSeasonGoals,
      writeInGoalieName,
      writeInTeamName,
      writeInSeason,
      writeInSeasonGoals: writeInSeasonGoals || normalizedSeasonGoals.length === 0,
    };

    const journalContent: import("../types/generatorConfig").GoalieJournalContent = {
      coverMd,
      acknowledgementsMd,
      howToUseMd,
      howToImproveEveryDayMd,
      helpfulResourcesMd,
      eventEntryMd,
      endOfSeasonMd,
    };

    const doc = buildGoalieJournalPdf(
      config,
      journalContent,
      logoData,
      jsPdfModule,
      qrCodeDataUrl,
      footerLogoData,
      goaliePhotoData,
      goldCertificationBadgeData,
      { skillsCycle: skillsCycleData, skillsPyramid: skillsPyramidData, coachZZoneMap: coachZZoneMapData }
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
        team_name: teamName.trim(),
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
        team_name: teamName.trim(),
      });

      setShowModal(false);
      setGoalieName("");
      setTeamName("");
      setSeason(getDefaultJournalSeason());
      setEntryCount(String(DEFAULT_JOURNAL_ENTRY_COUNT));
      setSeasonGoals(Array(JOURNAL_SEASON_GOAL_COUNT).fill(""));
      setLogoPreview(null);
      setGoaliePhotoPreview(null);
      setWriteInGoalieName(false);
      setWriteInTeamName(false);
      setWriteInSeason(false);
      setWriteInSeasonGoals(false);
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
    setSeasonGoals(Array(JOURNAL_SEASON_GOAL_COUNT).fill(""));
    setLogoPreview(null);
    setGoaliePhotoPreview(null);
    setWriteInGoalieName(false);
    setWriteInTeamName(false);
    setWriteInSeason(false);
    setWriteInSeasonGoals(false);
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
        className={`w-full bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105 text-center ${className}`.trim()}
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

          <fieldset className="mb-4">
            <legend className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
              Season Goals
            </legend>
            <label className="mb-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                aria-label="Write Season Goals in later on printed journal"
                checked={writeInSeasonGoals}
                onChange={(e) => setWriteInSeasonGoals(e.target.checked)}
                disabled={!!generatedBlob || isGenerating}
                className="h-4 w-4 accent-usa-blue dark:accent-blue-400 disabled:cursor-not-allowed"
              />
              Write in later on printed journal
            </label>
            <div className="space-y-3">
              {seasonGoals.map((goal, index) => (
                <div key={index}>
                  <label
                    htmlFor={`journal-season-goal-${index + 1}`}
                    className="block text-sm text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Goal {index + 1}
                  </label>
                  <input
                    type="text"
                    id={`journal-season-goal-${index + 1}`}
                    value={goal}
                    onChange={(e) => {
                      const nextGoals = [...seasonGoals];
                      nextGoals[index] = e.target.value;
                      setSeasonGoals(nextGoals);
                    }}
                    disabled={writeInSeasonGoals || !!generatedBlob || isGenerating}
                    className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={`Enter season goal ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </fieldset>

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
