import * as React from "react";
import { Link } from "gatsby";
import Seo from "../components/SEO";
import Logo from "../components/Logo";
import DarkModeToggle from "../components/DarkModeToggle";
import HamburgerMenu from "../components/HamburgerMenu";
import DownloadDrillPdfButton from "../components/DownloadDrillPdfButton";
import ShareButton from "../components/ShareButton";
import BackLinkButton from "../components/BackLinkButton";
import { getEmbedUrl, getVideoThumbnail } from "../utils/videoUtils";
import { normalizeDrillDescription } from "../utils/normalizeDrillDescription";
import { shouldPlaceProgressionsOnSecondPage } from "../utils/estimateDrillPdfPages";
import UsaHockeyGoldBanner from "../components/UsaHockeyGoldBanner";
import { buildCacheBustedAssetPath, OBJECT_URL_REVOKE_DELAY_MS } from "../utils/staticAsset";
import type { DrillData } from "../types/drill";
import { normalizeCoachingFocusPoints } from "../utils/coachingFocusPoints";

interface DrillPageContext {
  slug: string;
  drillData: DrillData;
  drillFolder: string;
}

interface DrillTemplateProps {
  pageContext: DrillPageContext;
}

const formatTag = (tag: string): string => {
  return tag
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function DrillTemplate({ pageContext }: DrillTemplateProps) {
  const { drillData, drillFolder } = pageContext;
  const coachingFocusBlocks = React.useMemo(
    () => normalizeCoachingFocusPoints(drillData.coaching_focus_points || []),
    [drillData.coaching_focus_points]
  );

  const [isPrinting, setIsPrinting] = React.useState(false);
  const [drillsBackUrl, setDrillsBackUrl] = React.useState("/goalie-drills");

  React.useEffect(() => {
    if (document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.pathname === "/goalie-drills") {
          setDrillsBackUrl(ref.pathname + ref.search);
        }
      } catch {
        // ignore malformed referrer
      }
    }
  }, []);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const { generateDrillPdf } = await import("../utils/generateDrillPdf");
      const doc = await generateDrillPdf(drillData, drillFolder);
      doc.autoPrint();
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Revoke the object URL after the window has had time to load,
      // or after a delay even if the window could not be opened
      setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS);
    } catch (error) {
      console.error("Error generating print PDF:", error);
      // Fallback to native browser print
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const embedUrl = drillData.video ? getEmbedUrl(drillData.video) : "";
  const videoThumbnail = drillData.video ? getVideoThumbnail(drillData.video) : "";
  const normalizedDescription = drillData.description
    ? normalizeDrillDescription(drillData.description)
    : "";
  const shouldMoveProgressionsToSecondPage = shouldPlaceProgressionsOnSecondPage(drillData);
  const actionButtonClasses =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold text-white transition-colors sm:w-auto sm:px-6";

  // Calculate the last updated date (use updated date if available, otherwise creation date)
  const lastUpdatedDate = drillData.drill_updated_date || drillData.drill_creation_date;

  const drillImageUrl = React.useMemo(
    () =>
      drillData.drill_image
        ? buildCacheBustedAssetPath(`/drills/${drillFolder}/${drillData.drill_image}`)
        : "",
    [drillData.drill_image, drillFolder]
  );
  const progressionImageUrls = React.useMemo(
    () =>
      (drillData.drill_progressions || []).map((progression) =>
        progression.progression_image
          ? buildCacheBustedAssetPath(`/drills/${drillFolder}/${progression.progression_image}`)
          : ""
      ),
    [drillData.drill_progressions, drillFolder]
  );

  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 transition-colors">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print:mb-6">
        <div className="flex justify-between items-center border-b-4 border-usa-red pb-4">
          <img
            src={buildCacheBustedAssetPath("/images/usahockey/usahockey-goaltending.jpg")}
            alt="USA Hockey Goaltending"
            className="object-contain print-header-logo"
            style={{ maxHeight: "0.4in", width: "auto", height: "auto" }}
            loading="eager"
            decoding="async"
          />
          <h1 className="text-3xl font-bold text-usa-blue text-center">DRILLS</h1>
          <img
            src={buildCacheBustedAssetPath("/images/usahockey/usahockey-gold-certification.png")}
            alt="USA Hockey Goaltending Gold Certification"
            className="object-contain print-header-logo"
            style={{ maxHeight: "0.4in", width: "auto", height: "auto" }}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      {/* Screen Header - Hidden when printing */}
      <header className="bg-usa-blue dark:bg-gray-800 text-usa-white py-6 print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <HamburgerMenu />
              <Link to="/">
                <Logo variant="full" format="png" className="w-24 md:w-32 lg:w-48" />
              </Link>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 print:py-0 print:px-0">
        {/* Drill Name + Share + Back to Drills button on same row */}
        <div className="mb-6 flex flex-col gap-4 print:mb-2 md:flex-row md:items-start md:justify-between">
          <h1 className="min-w-0 text-3xl font-bold text-usa-blue dark:text-blue-400 print:mb-2 print:text-2xl print:text-usa-blue md:text-4xl">
            {drillData.name}
          </h1>
          <div className="flex w-full flex-col gap-2 print:hidden sm:flex-row sm:flex-wrap sm:justify-end md:ml-4 md:w-auto md:flex-shrink-0 md:items-center">
            <ShareButton
              label="Share Drill"
              title={drillData.name}
              className={`${actionButtonClasses} bg-usa-red hover:bg-red-700`}
            />
            <BackLinkButton to={drillsBackUrl}>Back to Drills</BackLinkButton>
          </div>
        </div>

        {/* Last Updated Date */}
        <div className="mb-6 print:mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-700">
            <span className="font-semibold">Last Updated: </span>
            {lastUpdatedDate}
          </span>
        </div>

        {/* Age Group, Skill Level, Equipment */}
        <div className="mb-6 print:mb-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {drillData.tags.age_level && drillData.tags.age_level.length > 0 && (
              <div>
                <span className="font-bold text-gray-700 dark:text-gray-300 print:text-gray-900">
                  Age Group:{" "}
                </span>
                <span className="text-gray-600 dark:text-gray-400 print:text-gray-800">
                  {drillData.tags.age_level.map(formatTag).join(", ")}
                </span>
              </div>
            )}
            {drillData.tags.skill_level && drillData.tags.skill_level.length > 0 && (
              <div>
                <span className="font-bold text-gray-700 dark:text-gray-300 print:text-gray-900">
                  Skill Level:{" "}
                </span>
                <span className="text-gray-600 dark:text-gray-400 print:text-gray-800">
                  {drillData.tags.skill_level.map(formatTag).join(", ")}
                </span>
              </div>
            )}
            {drillData.tags.equipment && drillData.tags.equipment.length > 0 && (
              <div>
                <span className="font-bold text-gray-700 dark:text-gray-300 print:text-gray-900">
                  Equipment Needed:{" "}
                </span>
                <span className="text-gray-600 dark:text-gray-400 print:text-gray-800">
                  {drillData.tags.equipment.map(formatTag).join(", ")}
                </span>
              </div>
            )}
            {drillData.tags.space_required && drillData.tags.space_required.length > 0 && (
              <div className="print:hidden">
                <span className="font-bold text-gray-700 dark:text-gray-300">Space Required: </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {drillData.tags.space_required.map(formatTag).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Two-column: Drill Information (left) + Image (right) */}
        <div className="grid md:grid-cols-2 gap-8 mb-8 print:grid-cols-2 print:gap-4 print:mb-4">
          {/* Left Column: Drill Information (description + steps) */}
          <div>
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3 print:text-lg print:mb-2 print:text-usa-blue">
              Drill Information
            </h2>
            {normalizedDescription && (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line print:text-sm print:text-gray-900">
                {normalizedDescription}
              </p>
            )}
            <ol className="mt-4 list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 print:text-sm print:text-gray-900">
              {drillData.drill_steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Right Column: Image */}
          <div>
            {drillImageUrl && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden print:bg-white">
                <img
                  src={drillImageUrl}
                  alt="Drill diagram"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
          </div>
        </div>

        {/* Full-width sections: Coaching Focus Points, Shooter Focus Points, Drill Progressions */}
        <div className="mb-6 print:mb-3">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3 print:text-lg print:mb-2 print:text-usa-blue">
            Coaching Focus Points
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300 print:text-sm print:text-gray-900">
            {coachingFocusBlocks.map((block, blockIndex) => (
              <div key={`${block.heading || "point"}-${blockIndex}`}>
                {block.heading && (
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 print:text-gray-900">
                    {block.heading}
                  </h3>
                )}
                <ul className="list-disc list-inside space-y-2">
                  {block.bullets.map((point, pointIndex) => (
                    <li key={`${blockIndex}-${pointIndex}`}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {drillData.shooter_focus_points && drillData.shooter_focus_points.length > 0 && (
          <div className="mb-6 print:mb-3">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3 print:text-lg print:mb-2 print:text-usa-blue">
              Shooter Focus Points
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 print:text-sm print:text-gray-900">
              {drillData.shooter_focus_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {drillData.drill_progressions && drillData.drill_progressions.length > 0 && (
          <div
            className={`mb-6 print:mb-3 ${shouldMoveProgressionsToSecondPage ? "print-break-before-page" : ""}`}
          >
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3 print:text-lg print:mb-2 print:text-usa-blue">
              Drill Progressions
            </h2>
            <div className="space-y-4">
              {drillData.drill_progressions.map((progression, index) => {
                const progressionImageUrl = progressionImageUrls[index];
                const hasProgressionImage = progressionImageUrl.length > 0;
                return (
                  <div key={`${progression.progression_name}-${index}`}>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 print:text-base print:text-gray-900">
                      {progression.progression_name}
                    </h3>
                    {hasProgressionImage ? (
                      <div className="grid md:grid-cols-2 gap-4 mt-2 items-start print:grid-cols-2">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line print:text-[9pt] print:text-gray-900">
                          {progression.progression_description}
                        </p>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden print:bg-white">
                          <img
                            src={progressionImageUrl}
                            alt={`${progression.progression_name} diagram`}
                            className="w-full h-auto object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line print:text-[9pt] print:text-gray-900">
                        {progression.progression_description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Section */}
        {drillData.video && (
          <div className="mb-8 print:mb-4">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4 print:text-lg print:mb-2 print:text-usa-blue">
              Video Demonstration
            </h2>
            {embedUrl ? (
              <>
                {/* Embedded player - hidden when printing */}
                <div className="relative w-full print:hidden" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={embedUrl}
                    title="Video Demonstration"
                    className="absolute inset-0 w-full h-full rounded-lg"
                    loading="lazy"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
                  />
                </div>
                {/* Thumbnail + link - only visible when printing */}
                <div className="hidden print:flex items-center gap-4">
                  {videoThumbnail && (
                    <img
                      src={videoThumbnail}
                      alt="Video thumbnail"
                      className="w-32 h-24 object-cover rounded"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <span className="text-usa-blue font-semibold print:text-sm break-all">
                    Video: {drillData.video}
                  </span>
                </div>
              </>
            ) : (
              /* Fallback link for non-YouTube/Vimeo video URLs */
              <a
                href={drillData.video}
                target="_blank"
                rel="noopener noreferrer"
                className="text-usa-blue dark:text-blue-400 hover:underline font-semibold break-all"
              >
                Watch Video →
              </a>
            )}
          </div>
        )}

        {/* Skills Focus Section */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 print:border-gray-400 print:pt-3">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4 print:text-lg print:mb-2 print:text-usa-blue">
            Skills Focus
          </h2>
          {(() => {
            const hasGameSituations =
              drillData.tags.game_situations !== undefined &&
              drillData.tags.game_situations.length > 0;
            const gridClass = hasGameSituations
              ? "grid md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-3"
              : "grid md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-3";
            return (
              <div className={gridClass}>
                {drillData.tags.fundamental_skill &&
                  drillData.tags.fundamental_skill.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 print:text-xs print:text-gray-900">
                        Fundamental Skills:
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 print:text-xs print:text-gray-800">
                        {drillData.tags.fundamental_skill.map((skill, index) => (
                          <li key={index}>{formatTag(skill)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                {drillData.tags.skating_skill && drillData.tags.skating_skill.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 print:text-xs print:text-gray-900">
                      Skating Skills:
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 print:text-xs print:text-gray-800">
                      {drillData.tags.skating_skill.map((skill, index) => (
                        <li key={index}>{formatTag(skill)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasGameSituations && (
                  <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 print:text-xs print:text-gray-900">
                      Game Situations:
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 print:text-xs print:text-gray-800">
                      {drillData.tags.game_situations!.map((situation, index) => (
                        <li key={index}>{formatTag(situation)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Gold Certification Footer - Only visible when printing */}
        <div className="hidden print:block print:mt-3 print:pt-2 print:border-t-2 print:border-gray-400 break-before-avoid">
          <div className="flex items-center gap-3">
            <img
              src={buildCacheBustedAssetPath("/images/usahockey/usahockey-gold-certification.png")}
              alt="USA Hockey Goaltending Gold Level Coach Certification"
              className="object-contain"
              style={{ maxHeight: "0.5in", width: "auto", height: "auto" }}
              loading="lazy"
              decoding="async"
            />
            <p className="text-[10px] text-gray-700">
              This drill and the website on which it is hosted were developed as part of USA
              Hockey&apos;s Goaltending Gold certification program. For more drills and goaltending
              content, visit GoalieGen.com. All drills created and organized in CoachThem.
            </p>
          </div>
        </div>

        {/* Print and Back Buttons - Hidden in print */}
        <div className="mt-8 flex flex-col gap-4 print:hidden sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className={`${actionButtonClasses} bg-usa-red hover:bg-red-700 ${
              isPrinting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isPrinting ? "Generating..." : "Print Drill"}
          </button>
          <DownloadDrillPdfButton
            drillData={drillData}
            drillFolder={drillFolder}
            className={actionButtonClasses}
          />
          <ShareButton
            label="Share Drill"
            title={drillData.name}
            className={`${actionButtonClasses} bg-usa-red hover:bg-red-700`}
          />
          <BackLinkButton to={drillsBackUrl}>Back to Drills</BackLinkButton>
        </div>

        <div className="mt-8 print:hidden">
          <a
            href="https://coachthem.com/sports/ice-hockey"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/images/coachthem/ct-banner.png" alt="CoachThem" className="w-full h-auto" />
          </a>
        </div>
      </main>

      {/* Gold Certification Footer - Hidden in print */}
      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-8 mt-12 print:hidden">
        <div className="container mx-auto px-4">
          <UsaHockeyGoldBanner showCopyright showTerms />
        </div>
      </footer>
    </div>
  );
}

export const Head = ({ pageContext }: DrillTemplateProps) => (
  <Seo title={pageContext.drillData.name} />
);
