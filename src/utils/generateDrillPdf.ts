import type { jsPDF } from "jspdf";
import type { DrillData } from "../types/drill";
import { normalizeDrillDescription } from "./normalizeDrillDescription";
import {
  PROGRESSION_IMAGE_TEXT_GAP,
  PROGRESSION_SECTION_MAX_PAGES,
  PROGRESSION_TEXT_FONT_SIZE,
  PROGRESSION_TEXT_LINE_HEIGHT,
  SKILLS_FOCUS_TOP_GAP,
  estimateSkillsFocusSectionHeight,
  shouldPlaceProgressionsOnSecondPage,
} from "./estimateDrillPdfPages";
import { planDedicatedProgressionCards } from "./drillPdfPaginationShared";
import {
  buildCacheBustedAssetPath,
  DRILL_EXPORT_IMAGE_CACHE_TTL_MS,
  DRILL_EXPORT_PDF_CACHE_TTL_MS,
} from "./staticAsset";

export type { DrillData };

/**
 * Progress callback invoked at each stage of PDF generation.
 * @param message - Human-readable stage description shown to the user.
 */
export type DrillPdfProgressCallback = (message: string) => void;

interface CachedImageEntry {
  expiresAt: number;
  promise: Promise<{ dataURL: string; width: number; height: number }>;
}

const imageDataCache = new Map<string, CachedImageEntry>();
const drillPdfBlobCache = new Map<string, { expiresAt: number; blob: Blob }>();
const MAX_IMAGE_CACHE_ENTRIES = 32;
const MAX_PDF_CACHE_ENTRIES = 12;
const PROGRESSION_COLUMN_GAP = 8;
const PROGRESSION_CARD_GAP = 4;
const PROGRESSION_CARD_PADDING = 3;
const PROGRESSION_CARD_TEXT_TOP_OFFSET = 2;
const PROGRESSION_CARD_NAME_BOTTOM_GAP = 2;
const PROGRESSION_SECTION_TITLE_HEIGHT = 8;
const PROGRESSION_MAX_IMAGE_HEIGHT = 30;

/**
 * Maximum pixel dimension (width or height) for canvas-encoded images.
 * Images larger than this are downscaled before conversion to keep peak
 * memory usage predictable across all browsers.
 */
const MAX_CANVAS_DIMENSION = 2048;

const pruneExpiredPdfCacheEntries = (now: number): void => {
  for (const [cacheKey, entry] of drillPdfBlobCache.entries()) {
    if (entry.expiresAt <= now) {
      drillPdfBlobCache.delete(cacheKey);
    }
  }
};

const formatTag = (tag: string): string => {
  return tag
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const loadImageAsDataURL = (
  imagePath: string
): Promise<{ dataURL: string; width: number; height: number }> => {
  const now = Date.now();
  const cached = imageDataCache.get(imagePath);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }
  if (cached) {
    imageDataCache.delete(imagePath);
  }

  const promise = new Promise<{ dataURL: string; width: number; height: number }>(
    (resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        // Downscale oversized images to keep peak canvas memory predictable.
        const scale = Math.min(
          1,
          MAX_CANVAS_DIMENSION / img.width,
          MAX_CANVAS_DIMENSION / img.height
        );
        const canvasWidth = Math.round(img.width * scale);
        const canvasHeight = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        try {
          const dataURL = canvas.toDataURL("image/png");
          resolve({ dataURL, width: canvasWidth, height: canvasHeight });
        } catch (error) {
          // Translate quota/memory-pressure errors into a clear OOM message.
          // DOMException `SecurityError` (tainted canvas / CORS) is intentionally
          // excluded so it propagates with its original message instead of the
          // misleading "try a smaller image" copy.
          const isOomDomException =
            error instanceof DOMException &&
            (error.name === "QuotaExceededError" ||
              error.message.toLowerCase().includes("memory") ||
              error.message.toLowerCase().includes("quota"));
          const isOomError =
            !(error instanceof DOMException) &&
            error instanceof Error &&
            (error.message.toLowerCase().includes("memory") ||
              error.message.toLowerCase().includes("quota"));
          if (isOomDomException || isOomError) {
            reject(
              new Error(
                `Image too large to process (out of memory): ${imagePath}. Try a smaller image.`
              )
            );
          } else {
            reject(error);
          }
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imagePath}`));
      };

      img.src = imagePath;
    }
  );

  imageDataCache.set(imagePath, {
    expiresAt: now + DRILL_EXPORT_IMAGE_CACHE_TTL_MS,
    promise,
  });

  promise.catch(() => {
    imageDataCache.delete(imagePath);
  });

  if (imageDataCache.size > MAX_IMAGE_CACHE_ENTRIES) {
    const oldestKey = imageDataCache.keys().next().value;
    if (oldestKey) {
      imageDataCache.delete(oldestKey);
    }
  }

  return promise;
};

export const generateDrillPdf = async (
  drillData: DrillData,
  drillFolder: string,
  onProgress?: DrillPdfProgressCallback
): Promise<jsPDF> => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const usaBlue = [0, 32, 91] as const; // #00205B
  const usaRed = [175, 39, 47] as const; // #AF272F

  // Footer (gold logo) dimensions — fixed at the bottom of every page
  const goldLogoHeight = 16;
  const footerLogoY = pageHeight - margin - goldLogoHeight;
  const footerSeparatorY = footerLogoY - 4;
  // Content must not exceed this Y value on any page
  const contentBottomLimit = footerSeparatorY - 8;

  // Pre-load all static header/footer images in parallel so none of the
  // network round-trips blocks the others.
  onProgress?.("Loading images...");
  const [goldLogoResult, leftLogoResult, rightLogoResult, ggLogoResult] = await Promise.allSettled([
    loadImageAsDataURL(
      buildCacheBustedAssetPath("/images/usahockey/usahockey-gold-certification.png")
    ),
    loadImageAsDataURL(buildCacheBustedAssetPath("/images/usahockey/usahockey-goaltending.jpg")),
    loadImageAsDataURL(buildCacheBustedAssetPath("/images/usahockey/51-in-30.jpg")),
    loadImageAsDataURL(buildCacheBustedAssetPath("/images/logos/logo-alt-light-whitebg.png")),
  ]);

  const goldLogoInfo = goldLogoResult.status === "fulfilled" ? goldLogoResult.value : null;
  if (goldLogoResult.status === "rejected") {
    console.error("Error loading gold certification logo:", goldLogoResult.reason);
  }

  const ggLogoInfo = ggLogoResult.status === "fulfilled" ? ggLogoResult.value : null;

  const goldText =
    "This drill and the website on which it is hosted were developed as part of USA Hockey's Goaltending Gold certification program. For more drills and goaltending content, visit GoalieGen.com";

  // Draw the gold certification footer on the current page
  const drawPageFooter = () => {
    if (!goldLogoInfo) return;
    const goldLogoWidth = (goldLogoInfo.width / goldLogoInfo.height) * goldLogoHeight;

    // GG logo (right side) — sized to the same height as the gold cert logo
    const ggLogoWidth = ggLogoInfo ? (ggLogoInfo.width / ggLogoInfo.height) * goldLogoHeight : 0;
    const ggLogoX = pageWidth - margin - ggLogoWidth;

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, footerSeparatorY, pageWidth - margin, footerSeparatorY);
    doc.addImage(goldLogoInfo.dataURL, "PNG", margin, footerLogoY, goldLogoWidth, goldLogoHeight);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont(undefined, "normal");

    // Gold text spans between the two logos
    const textRightEdge = ggLogoInfo ? ggLogoX - 4 : pageWidth - margin;
    const goldTextLines = doc.splitTextToSize(goldText, textRightEdge - margin - goldLogoWidth - 4);
    doc.text(goldTextLines, margin + goldLogoWidth + 4, footerLogoY + 5);

    // GG logo with white circular background
    if (ggLogoInfo) {
      const cx = ggLogoX + ggLogoWidth / 2;
      const cy = footerLogoY + goldLogoHeight / 2;
      const r = Math.max(ggLogoWidth, goldLogoHeight) / 2 + 1;
      doc.setFillColor(255, 255, 255);
      doc.circle(cx, cy, r, "F");
      doc.addImage(ggLogoInfo.dataURL, "PNG", ggLogoX, footerLogoY, ggLogoWidth, goldLogoHeight);
    }
  };

  // Track which page we are on so callers can detect multi-page output
  let currentPageNum = 1;

  const startNewPage = (): number => {
    drawPageFooter();
    doc.addPage();
    currentPageNum++;
    return margin + 5;
  };

  // If `neededHeight` mm of content won't fit below `currentY`, draw the footer on the
  // current page, add a new page, and return the Y position at the top of the new page.
  const ensureSpace = (currentY: number, neededHeight: number): number => {
    if (currentY + neededHeight > contentBottomLimit) {
      return startNewPage();
    }
    return currentY;
  };

  const drawPageHeader = (title: string): number => {
    let headerY = 15;

    // Header with USA Hockey logos and title — use the already-loaded results.
    if (leftLogoResult.status === "fulfilled" && rightLogoResult.status === "fulfilled") {
      const leftLogoInfo = leftLogoResult.value;
      const rightLogoInfo = rightLogoResult.value;

      const logoHeight = 16;
      const leftLogoWidth = (leftLogoInfo.width / leftLogoInfo.height) * logoHeight;
      const rightLogoWidth = (rightLogoInfo.width / rightLogoInfo.height) * logoHeight;

      doc.addImage(leftLogoInfo.dataURL, "JPEG", margin, headerY, leftLogoWidth, logoHeight);
      doc.addImage(
        rightLogoInfo.dataURL,
        "JPEG",
        pageWidth - margin - rightLogoWidth,
        headerY,
        rightLogoWidth,
        logoHeight
      );

      const titleHorizontalPaddingMm = 4; // gap between each logo edge and the title text
      doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      const titleAvailableWidth =
        pageWidth - 2 * margin - leftLogoWidth - rightLogoWidth - 2 * titleHorizontalPaddingMm;
      const titleCenterX =
        margin + leftLogoWidth + titleHorizontalPaddingMm + titleAvailableWidth / 2;
      const titleLines = doc.splitTextToSize(title, titleAvailableWidth);
      const titleDimensions = doc.getTextDimensions(title, {
        maxWidth: titleAvailableWidth,
      });
      const titleTotalHeight = titleDimensions.h;
      const titleCharHeight = doc.getFontSize() / doc.internal.scaleFactor;
      const effectiveHeaderHeight = Math.max(logoHeight, titleTotalHeight);
      const titleFirstLineY =
        headerY + (effectiveHeaderHeight - titleTotalHeight) / 2 + titleCharHeight;
      doc.text(titleLines, titleCenterX, titleFirstLineY, { align: "center" });

      headerY += effectiveHeaderHeight + 4;
    } else {
      if (leftLogoResult.status === "rejected") {
        console.error("Error loading header images:", leftLogoResult.reason);
      } else if (rightLogoResult.status === "rejected") {
        console.error("Error loading header images:", rightLogoResult.reason);
      }
      doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      const fallbackTitleWidth = pageWidth - 2 * margin;
      const fallbackTitleLines = doc.splitTextToSize(title, fallbackTitleWidth);
      const fallbackDimensions = doc.getTextDimensions(title, {
        maxWidth: fallbackTitleWidth,
      });
      doc.text(fallbackTitleLines, pageWidth / 2, headerY, { align: "center" });
      headerY += fallbackDimensions.h + 4;
    }

    doc.setDrawColor(usaRed[0], usaRed[1], usaRed[2]);
    doc.setLineWidth(2);
    doc.line(margin, headerY, pageWidth - margin, headerY);

    return headerY + 8;
  };

  let currentY = drawPageHeader(drillData.name);
  const rightColumnStartY = currentY;

  // Tags section - bold labels, normal values, equipment on separate line
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  let firstLineX = margin;

  if (drillData.tags.age_level && drillData.tags.age_level.length > 0) {
    doc.setFont(undefined, "bold");
    doc.text("Age Group: ", firstLineX, currentY);
    const labelWidth = doc.getTextWidth("Age Group: ");
    doc.setFont(undefined, "normal");
    const ageValues = drillData.tags.age_level.map(formatTag).join(", ");
    doc.text(ageValues, firstLineX + labelWidth, currentY);
    firstLineX += labelWidth + doc.getTextWidth(ageValues) + 5;
  }

  if (drillData.tags.skill_level && drillData.tags.skill_level.length > 0) {
    doc.setFont(undefined, "bold");
    doc.text("Skill Level: ", firstLineX, currentY);
    const labelWidth = doc.getTextWidth("Skill Level: ");
    doc.setFont(undefined, "normal");
    const skillValues = drillData.tags.skill_level.map(formatTag).join(", ");
    doc.text(skillValues, firstLineX + labelWidth, currentY);
  }

  currentY += 4;

  if (drillData.tags.equipment && drillData.tags.equipment.length > 0) {
    doc.setFont(undefined, "bold");
    doc.text("Equipment Needed: ", margin, currentY);
    const labelWidth = doc.getTextWidth("Equipment Needed: ");
    doc.setFont(undefined, "normal");
    const equipmentValues = drillData.tags.equipment.map(formatTag).join(", ");
    doc.text(equipmentValues, margin + labelWidth, currentY);
    currentY += 4;
  }

  currentY += 2;
  const fullWidth = pageWidth - 2 * margin;

  // Column layout: slightly text-prioritized split for better one-page fit.
  // A tighter 6 mm inter-column gap plus a modest wider left column reduces
  // line wraps in Drill Information while preserving overall visual balance.
  const interColumnGap = 6;
  const twoColumnContentWidth = pageWidth - 2 * margin - interColumnGap;
  const leftColumnWidth = twoColumnContentWidth * 0.58;
  const rightColumnWidth = twoColumnContentWidth - leftColumnWidth;
  const rightColumnX = margin + leftColumnWidth + interColumnGap;
  const contentStartY = currentY;

  // --- RIGHT COLUMN: Image (rendered first so it always lands on page 1) ---
  let drillImageInfo: { dataURL: string; width: number; height: number } | null = null;

  if (drillData.drill_image) {
    const imagePath = `/drills/${drillFolder}/${drillData.drill_image}`;
    const result = await Promise.allSettled([
      loadImageAsDataURL(buildCacheBustedAssetPath(imagePath)),
    ]);
    if (result[0].status === "fulfilled") {
      drillImageInfo = result[0].value;
    } else {
      console.error(`Error loading drill image (${drillData.drill_image}):`, result[0].reason);
    }
  }

  const progressions = drillData.drill_progressions || [];
  const shouldMoveProgressionsToSecondPage = shouldPlaceProgressionsOnSecondPage(drillData);
  const hasProgressionImages = progressions.some(
    (progression) =>
      progression.progression_image !== undefined && progression.progression_image.trim().length > 0
  );
  const progressionImageInfoByIndex = new Map<
    number,
    { dataURL: string; width: number; height: number }
  >();

  if (hasProgressionImages) {
    const progressionImagePromises = progressions.map((progression, index) => {
      if (!progression.progression_image || progression.progression_image.trim().length === 0) {
        return Promise.resolve({
          index,
          result: null as Awaited<ReturnType<typeof loadImageAsDataURL>> | null,
        });
      }
      const imagePath = `/drills/${drillFolder}/${progression.progression_image}`;
      return loadImageAsDataURL(buildCacheBustedAssetPath(imagePath))
        .then((result) => ({ index, result }))
        .catch((error: unknown) => {
          console.error(
            `Error loading progression image (${progression.progression_image}):`,
            error
          );
          return { index, result: null };
        });
    });
    const progressionImageResults = await Promise.all(progressionImagePromises);
    progressionImageResults.forEach(({ index, result }) => {
      if (result) {
        progressionImageInfoByIndex.set(index, result);
      }
    });
  }

  onProgress?.("Generating PDF...");

  const mainLineHeight = 3.2;
  const SINGLE_COLUMN_IMAGE_WIDTH_RATIO = 0.75;
  type MainLayoutMode = "single-column" | "two-column";

  const renderMainSection = (
    layoutMode: MainLayoutMode,
    draw: boolean
  ): { endPageNum: number; endSectionY: number } => {
    let simulatedPageNum = currentPageNum;
    const startNewPageForPass = (): number => {
      if (draw) {
        return startNewPage();
      }
      simulatedPageNum += 1;
      return margin + 5;
    };
    const ensureSpaceForPass = (currentYForPass: number, neededHeight: number): number => {
      if (currentYForPass + neededHeight > contentBottomLimit) {
        return startNewPageForPass();
      }
      return currentYForPass;
    };
    const drawLine = (x1: number, y1: number, x2: number, y2: number): void => {
      if (draw) {
        doc.line(x1, y1, x2, y2);
      }
    };
    const drawText = (text: string | string[], x: number, y: number): void => {
      if (draw) {
        doc.text(text, x, y);
      }
    };
    const drawImage = (
      dataURL: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number
    ): void => {
      if (draw) {
        doc.addImage(dataURL, format, x, y, width, height);
      }
    };

    let sectionY: number;
    if (layoutMode === "single-column") {
      let fullWidthY = contentStartY;
      if (drillImageInfo) {
        const aspectRatio = drillImageInfo.width / drillImageInfo.height;
        const imgWidth = fullWidth * SINGLE_COLUMN_IMAGE_WIDTH_RATIO;
        const imgHeight = imgWidth / aspectRatio;
        const imgX = margin + (fullWidth - imgWidth) / 2;
        fullWidthY = ensureSpaceForPass(fullWidthY, imgHeight + 4);
        drawImage(drillImageInfo.dataURL, "PNG", imgX, fullWidthY, imgWidth, imgHeight);
        fullWidthY += imgHeight + 4;
      }

      fullWidthY = ensureSpaceForPass(fullWidthY, 16);
      doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      drawText("Drill Information", margin, fullWidthY);
      fullWidthY += 3.5;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      if (drillData.description) {
        const normalizedDescription = normalizeDrillDescription(drillData.description);
        const descriptionLines = doc.splitTextToSize(normalizedDescription, fullWidth);
        fullWidthY = ensureSpaceForPass(fullWidthY, descriptionLines.length * mainLineHeight);
        drawText(descriptionLines, margin, fullWidthY);
        fullWidthY += descriptionLines.length * mainLineHeight + 2.5;
      }

      for (const [index, step] of drillData.drill_steps.entries()) {
        const stepLines = doc.splitTextToSize(`${index + 1}. ${step}`, fullWidth - 5);
        fullWidthY = ensureSpaceForPass(fullWidthY, stepLines.length * mainLineHeight + 1);
        drawText(stepLines, margin + 3, fullWidthY);
        fullWidthY += stepLines.length * mainLineHeight + 1;
      }
      fullWidthY += 1.5;

      sectionY = fullWidthY + 3;
    } else {
      let rightY = rightColumnStartY;

      if (drillImageInfo) {
        const maxImageWidth = rightColumnWidth;
        const reservedBelowImage = shouldMoveProgressionsToSecondPage
          ? estimateSkillsFocusSectionHeight(drillData)
          : 0;
        const maxImageHeight = Math.max(
          0,
          contentBottomLimit - rightColumnStartY - reservedBelowImage
        );
        const aspectRatio = drillImageInfo.width / drillImageInfo.height;
        let imgWidth = maxImageWidth;
        let imgHeight = imgWidth / aspectRatio;

        if (imgHeight > maxImageHeight) {
          imgHeight = maxImageHeight;
          imgWidth = imgHeight * aspectRatio;
        }

        const imgX = rightColumnX + rightColumnWidth - imgWidth;
        drawImage(drillImageInfo.dataURL, "PNG", imgX, rightY, imgWidth, imgHeight);
        rightY += imgHeight + 4;
      }

      let leftY = contentStartY;
      leftY = ensureSpaceForPass(leftY, 16);
      doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      drawText("Drill Information", margin, leftY);
      leftY += 3.5;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      if (drillData.description) {
        const normalizedDescription = normalizeDrillDescription(drillData.description);
        const descriptionLines = doc.splitTextToSize(normalizedDescription, leftColumnWidth);
        leftY = ensureSpaceForPass(leftY, descriptionLines.length * mainLineHeight);
        drawText(descriptionLines, margin, leftY);
        leftY += descriptionLines.length * mainLineHeight + 2.5;
      }

      for (const [index, step] of drillData.drill_steps.entries()) {
        const stepLines = doc.splitTextToSize(`${index + 1}. ${step}`, leftColumnWidth - 5);
        leftY = ensureSpaceForPass(leftY, stepLines.length * mainLineHeight + 1);
        drawText(stepLines, margin + 3, leftY);
        leftY += stepLines.length * mainLineHeight + 1;
      }
      leftY += 1.5;

      const pageNumForPass = draw ? currentPageNum : simulatedPageNum;
      if (pageNumForPass > 1) {
        sectionY = leftY + 3;
      } else {
        sectionY = Math.max(leftY, rightY) + 3;
      }
    }

    sectionY = ensureSpaceForPass(sectionY, 12);
    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    drawText("Coaching Focus Points", margin, sectionY);
    sectionY += 3.5;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    if (drillData.coaching_focus_points && drillData.coaching_focus_points.length > 0) {
      for (const point of drillData.coaching_focus_points) {
        const pointLines = doc.splitTextToSize(`• ${point}`, fullWidth - 5);
        sectionY = ensureSpaceForPass(sectionY, pointLines.length * mainLineHeight + 1);
        drawText(pointLines, margin + 3, sectionY);
        sectionY += pointLines.length * mainLineHeight + 1;
      }
    }

    if (drillData.shooter_focus_points && drillData.shooter_focus_points.length > 0) {
      sectionY += 1.5;
      sectionY = ensureSpaceForPass(sectionY, 12);
      doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      drawText("Shooter Focus Points", margin, sectionY);
      sectionY += 3.5;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      for (const point of drillData.shooter_focus_points) {
        const pointLines = doc.splitTextToSize(`• ${point}`, fullWidth - 5);
        sectionY = ensureSpaceForPass(sectionY, pointLines.length * mainLineHeight + 1);
        drawText(pointLines, margin + 3, sectionY);
        sectionY += pointLines.length * mainLineHeight + 1;
      }
    }

    if (progressions.length > 0 && !shouldMoveProgressionsToSecondPage) {
      sectionY += 2;
      sectionY = ensureSpaceForPass(sectionY, 12);
      doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      drawText("Drill Progressions", margin, sectionY);
      sectionY += 4;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      for (const [index, progression] of progressions.entries()) {
        const progressionName = `• ${progression.progression_name}:`;
        const nameLines = doc.splitTextToSize(progressionName, fullWidth - 5);
        sectionY = ensureSpaceForPass(
          sectionY,
          nameLines.length * PROGRESSION_TEXT_LINE_HEIGHT + 1
        );
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        drawText(nameLines, margin + 3, sectionY);
        sectionY += nameLines.length * PROGRESSION_TEXT_LINE_HEIGHT + 1;

        const progressionImageInfo = progressionImageInfoByIndex.get(index);
        if (progressionImageInfo) {
          const maxImageWidth = Math.min(fullWidth - 12, 80);
          const maxImageHeight = 34;
          const aspectRatio = progressionImageInfo.width / progressionImageInfo.height;
          let imgWidth = maxImageWidth;
          let imgHeight = imgWidth / aspectRatio;
          if (imgHeight > maxImageHeight) {
            imgHeight = maxImageHeight;
            imgWidth = imgHeight * aspectRatio;
          }

          sectionY = ensureSpaceForPass(sectionY, imgHeight + 3);
          const imgX = margin + (fullWidth - imgWidth) / 2;
          drawImage(progressionImageInfo.dataURL, "PNG", imgX, sectionY, imgWidth, imgHeight);
          sectionY += imgHeight + PROGRESSION_IMAGE_TEXT_GAP;
        }

        const descriptionLines = doc.splitTextToSize(
          progression.progression_description,
          fullWidth - 5
        );
        sectionY = ensureSpaceForPass(
          sectionY,
          descriptionLines.length * PROGRESSION_TEXT_LINE_HEIGHT + 1
        );
        doc.setFont(undefined, "normal");
        drawText(descriptionLines, margin + 6, sectionY);
        sectionY += descriptionLines.length * PROGRESSION_TEXT_LINE_HEIGHT + 1;
      }
    }

    sectionY += 4;

    sectionY = ensureSpaceForPass(sectionY, estimateSkillsFocusSectionHeight(drillData));
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    drawLine(margin, sectionY, pageWidth - margin, sectionY);
    sectionY += SKILLS_FOCUS_TOP_GAP;

    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    drawText("Skills Focus", margin, sectionY);
    sectionY += 4;

    const hasGameSituations =
      drillData.tags.game_situations !== undefined && drillData.tags.game_situations.length > 0;
    const colWidth = (pageWidth - 2 * margin) / (hasGameSituations ? 3 : 2);
    const skillsLeftX = margin;
    const skillsRightX = margin + colWidth;
    let skillsLeftY = sectionY;
    let skillsRightY = sectionY;
    const skillsThirdX = margin + 2 * colWidth;
    let skillsThirdY = sectionY;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(PROGRESSION_TEXT_FONT_SIZE);

    if (drillData.tags.fundamental_skill && drillData.tags.fundamental_skill.length > 0) {
      doc.setFont(undefined, "bold");
      drawText("Fundamental Skills:", skillsLeftX, skillsLeftY);
      doc.setFont(undefined, "normal");
      skillsLeftY += 3;
      drillData.tags.fundamental_skill.forEach((skill) => {
        drawText(`• ${formatTag(skill)}`, skillsLeftX + 3, skillsLeftY);
        skillsLeftY += 4;
      });
    }

    if (drillData.tags.skating_skill && drillData.tags.skating_skill.length > 0) {
      doc.setFont(undefined, "bold");
      drawText("Skating Skills:", skillsRightX, skillsRightY);
      doc.setFont(undefined, "normal");
      skillsRightY += 3;
      drillData.tags.skating_skill.forEach((skill) => {
        drawText(`• ${formatTag(skill)}`, skillsRightX + 3, skillsRightY);
        skillsRightY += 4;
      });
    }

    if (hasGameSituations) {
      doc.setFont(undefined, "bold");
      drawText("Game Situations:", skillsThirdX, skillsThirdY);
      doc.setFont(undefined, "normal");
      skillsThirdY += 3;
      drillData.tags.game_situations!.forEach((situation) => {
        drawText(`• ${formatTag(situation)}`, skillsThirdX + 3, skillsThirdY);
        skillsThirdY += 4;
      });
    }

    if (drillData.video) {
      sectionY = Math.max(skillsLeftY, skillsRightY, skillsThirdY) + 3;
      const videoLines = doc.splitTextToSize(drillData.video, pageWidth - 2 * margin);
      sectionY = ensureSpaceForPass(sectionY, 9 + videoLines.length * mainLineHeight);

      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      drawLine(margin, sectionY, pageWidth - margin, sectionY);
      sectionY += 3;

      doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      drawText("Video Demonstration", margin, sectionY);
      sectionY += 4;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(PROGRESSION_TEXT_FONT_SIZE);
      doc.setFont(undefined, "normal");
      drawText(videoLines, margin, sectionY);
      sectionY += videoLines.length * PROGRESSION_TEXT_LINE_HEIGHT;
    }

    return {
      endPageNum: draw ? currentPageNum : simulatedPageNum,
      endSectionY: sectionY,
    };
  };

  const singleColumnProbe = renderMainSection("single-column", false);
  const useSingleColumnMainLayout = singleColumnProbe.endPageNum === currentPageNum;
  renderMainSection(useSingleColumnMainLayout ? "single-column" : "two-column", true);

  // Dedicated progression pages are triggered by overall inline overflow. When used,
  // keep a dynamic two-column grid and pack full progression cards without splitting.
  if (progressions.length > 0 && shouldMoveProgressionsToSecondPage) {
    interface ProgressionCardLayout {
      boxHeight: number;
      nameLines: string[];
      descriptionLines: string[];
      imageDataURL?: string;
      imageWidth?: number;
      imageHeight?: number;
    }

    const progressionColumnWidth = (pageWidth - 2 * margin - PROGRESSION_COLUMN_GAP) / 2;
    const leftColumnX = margin;
    const rightColumnX = margin + progressionColumnWidth + PROGRESSION_COLUMN_GAP;
    const cardContentWidth = progressionColumnWidth - PROGRESSION_CARD_PADDING * 2;
    const progressionLayouts = progressions.map((progression, index) => {
      const progressionImageInfo = progressionImageInfoByIndex.get(index);
      const buildLayout = (includeImage: boolean): ProgressionCardLayout => {
        const nameLines = doc.splitTextToSize(progression.progression_name, cardContentWidth);
        const descriptionLines = doc.splitTextToSize(
          progression.progression_description,
          cardContentWidth
        );
        let imageDataURL: string | undefined;
        let imageWidth: number | undefined;
        let imageHeight: number | undefined;

        if (includeImage && progressionImageInfo) {
          const imageAspectRatio = progressionImageInfo.width / progressionImageInfo.height;
          let plannedImageWidth = cardContentWidth;
          let plannedImageHeight = plannedImageWidth / imageAspectRatio;
          if (plannedImageHeight > PROGRESSION_MAX_IMAGE_HEIGHT) {
            plannedImageHeight = PROGRESSION_MAX_IMAGE_HEIGHT;
            plannedImageWidth = plannedImageHeight * imageAspectRatio;
          }
          imageDataURL = progressionImageInfo.dataURL;
          imageWidth = plannedImageWidth;
          imageHeight = plannedImageHeight;
        }

        const imageBlockHeight =
          imageHeight && imageHeight > 0 ? imageHeight + PROGRESSION_IMAGE_TEXT_GAP : 0;
        const boxHeight =
          PROGRESSION_CARD_PADDING * 2 +
          PROGRESSION_CARD_TEXT_TOP_OFFSET +
          nameLines.length * PROGRESSION_TEXT_LINE_HEIGHT +
          PROGRESSION_CARD_NAME_BOTTOM_GAP +
          imageBlockHeight +
          descriptionLines.length * PROGRESSION_TEXT_LINE_HEIGHT;

        return {
          boxHeight,
          nameLines,
          descriptionLines,
          imageDataURL,
          imageWidth,
          imageHeight,
        };
      };

      return {
        withImage: buildLayout(true),
        withoutImage: buildLayout(false),
      };
    });

    const drawProgressionCard = (
      layout: ProgressionCardLayout,
      boxX: number,
      boxY: number
    ): void => {
      doc.setDrawColor(usaBlue[0], usaBlue[1], usaBlue[2]);
      doc.setLineWidth(0.7);
      doc.rect(boxX, boxY, progressionColumnWidth, layout.boxHeight);

      const contentX = boxX + PROGRESSION_CARD_PADDING;
      let contentY = boxY + PROGRESSION_CARD_PADDING + PROGRESSION_CARD_TEXT_TOP_OFFSET;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(PROGRESSION_TEXT_FONT_SIZE);
      doc.setFont(undefined, "bold");
      doc.text(layout.nameLines, contentX, contentY);
      contentY +=
        layout.nameLines.length * PROGRESSION_TEXT_LINE_HEIGHT + PROGRESSION_CARD_NAME_BOTTOM_GAP;

      if (
        layout.imageDataURL &&
        layout.imageWidth !== undefined &&
        layout.imageHeight !== undefined &&
        layout.imageHeight > 0
      ) {
        const imgX = contentX + (cardContentWidth - layout.imageWidth) / 2;
        doc.addImage(
          layout.imageDataURL,
          "PNG",
          imgX,
          contentY,
          layout.imageWidth,
          layout.imageHeight
        );
        contentY += layout.imageHeight + PROGRESSION_IMAGE_TEXT_GAP;
      }

      doc.setFont(undefined, "normal");
      doc.text(layout.descriptionLines, contentX, contentY);
    };

    const drawProgressionPageHeader = (): {
      columnStartY: number;
      leftY: number;
      rightY: number;
    } => {
      let progressionsY = drawPageHeader(drillData.name);
      progressionsY = ensureSpace(progressionsY, PROGRESSION_SECTION_TITLE_HEIGHT);
      doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Drill Progressions", margin, progressionsY);
      const columnStartY = progressionsY + 6;
      return { columnStartY, leftY: columnStartY, rightY: columnStartY };
    };

    startNewPage();
    let { columnStartY, leftY, rightY } = drawProgressionPageHeader();
    const columnCapacity = contentBottomLimit - columnStartY;
    const progressionPlan = planDedicatedProgressionCards(
      progressionLayouts.map((layouts) => {
        const hasImageVariant =
          !!layouts.withImage.imageDataURL &&
          layouts.withImage.boxHeight !== layouts.withoutImage.boxHeight;
        return {
          preferredHeight: hasImageVariant
            ? layouts.withImage.boxHeight
            : layouts.withoutImage.boxHeight,
          compactHeight: hasImageVariant ? layouts.withoutImage.boxHeight : undefined,
        };
      }),
      {
        columnCapacity,
        columns: 2,
        cardGap: PROGRESSION_CARD_GAP,
        maxPages: PROGRESSION_SECTION_MAX_PAGES,
      }
    );

    const placementsByCardIndex = new Map(
      progressionPlan.placements.map((placement) => [placement.cardIndex, placement])
    );
    const compactedCardIndices = new Set(progressionPlan.compactedCardIndices);
    let renderedProgressionPageIndex = 0;

    for (let progressionIndex = 0; progressionIndex < progressions.length; progressionIndex++) {
      const progression = progressions[progressionIndex];
      const placement = placementsByCardIndex.get(progressionIndex);
      if (!placement) {
        console.error(
          `Progression '${progression.progression_name}' exceeded progression pagination limits; content may be clipped.`
        );
        continue;
      }

      while (renderedProgressionPageIndex < placement.pageIndex) {
        startNewPage();
        ({ columnStartY, leftY, rightY } = drawProgressionPageHeader());
        renderedProgressionPageIndex += 1;
      }

      const layouts = progressionLayouts[progressionIndex];
      const usesImageLayout =
        !placement.usesCompactLayout &&
        !!layouts.withImage.imageDataURL &&
        layouts.withImage.boxHeight !== layouts.withoutImage.boxHeight;
      const selectedLayout = usesImageLayout ? layouts.withImage : layouts.withoutImage;
      const boxX = placement.columnIndex === 0 ? leftColumnX : rightColumnX;
      const columnY = placement.columnIndex === 0 ? leftY : rightY;
      const gap = columnY > columnStartY ? PROGRESSION_CARD_GAP : 0;
      const boxY = columnY + gap;

      drawProgressionCard(selectedLayout, boxX, boxY);
      if (placement.columnIndex === 0) {
        leftY = boxY + selectedLayout.boxHeight;
      } else {
        rightY = boxY + selectedLayout.boxHeight;
      }

      if (compactedCardIndices.has(progressionIndex)) {
        console.warn(
          `Progression '${progression.progression_name}' was compacted to text-only layout to respect two progression pages.`
        );
      }
    }
  }

  // Draw the footer on the last (current) page
  drawPageFooter();

  onProgress?.("Finalizing...");

  return doc;
};

export const generateDrillPdfBlob = async (
  drillData: DrillData,
  drillFolder: string,
  onProgress?: DrillPdfProgressCallback
): Promise<Blob> => {
  const cacheKey = [
    drillFolder,
    drillData.drill_updated_date || "",
    drillData.drill_creation_date || "",
    drillData.name,
  ].join("|");
  const now = Date.now();
  pruneExpiredPdfCacheEntries(now);
  const cached = drillPdfBlobCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.blob;
  }
  if (cached) {
    drillPdfBlobCache.delete(cacheKey);
  }

  const doc = await generateDrillPdf(drillData, drillFolder, onProgress);
  const blob = doc.output("blob");
  drillPdfBlobCache.set(cacheKey, {
    blob,
    expiresAt: now + DRILL_EXPORT_PDF_CACHE_TTL_MS,
  });

  if (drillPdfBlobCache.size > MAX_PDF_CACHE_ENTRIES) {
    const oldestKey = drillPdfBlobCache.keys().next().value;
    if (oldestKey) {
      drillPdfBlobCache.delete(oldestKey);
    }
  }

  return blob;
};
