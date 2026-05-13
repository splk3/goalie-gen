import type { jsPDF } from "jspdf";
import type { DrillData } from "../types/drill";
import { normalizeDrillDescription } from "./normalizeDrillDescription";
import {
  buildCacheBustedAssetPath,
  DRILL_EXPORT_IMAGE_CACHE_TTL_MS,
  DRILL_EXPORT_PDF_CACHE_TTL_MS,
} from "./staticAsset";

export type { DrillData };

interface CachedImageEntry {
  expiresAt: number;
  promise: Promise<{ dataURL: string; width: number; height: number }>;
}

const imageDataCache = new Map<string, CachedImageEntry>();
const drillPdfBlobCache = new Map<string, { expiresAt: number; blob: Blob }>();
const MAX_IMAGE_CACHE_ENTRIES = 32;
const MAX_PDF_CACHE_ENTRIES = 12;

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
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        try {
          const dataURL = canvas.toDataURL("image/png");
          resolve({ dataURL, width: img.width, height: img.height });
        } catch (error) {
          reject(error);
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
  drillFolder: string
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

  // Pre-load the gold logo so it can be drawn on every page
  let goldLogoInfo: { dataURL: string; width: number; height: number } | null = null;
  try {
    goldLogoInfo = await loadImageAsDataURL(
      buildCacheBustedAssetPath("/images/usahockey/usahockey-gold-certification.png")
    );
  } catch (error) {
    console.error("Error loading gold certification logo:", error);
  }

  const goldText =
    "This drill and the website on which it is hosted were developed as part of USA Hockey's Goaltending Gold certification program. For more drills and goaltending content, visit GoalieGen.com";

  // Draw the gold certification footer on the current page
  const drawPageFooter = () => {
    if (!goldLogoInfo) return;
    const goldLogoWidth = (goldLogoInfo.width / goldLogoInfo.height) * goldLogoHeight;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, footerSeparatorY, pageWidth - margin, footerSeparatorY);
    doc.addImage(goldLogoInfo.dataURL, "PNG", margin, footerLogoY, goldLogoWidth, goldLogoHeight);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont(undefined, "normal");
    const goldTextLines = doc.splitTextToSize(
      goldText,
      pageWidth - margin - goldLogoWidth - margin - 4
    );
    doc.text(goldTextLines, margin + goldLogoWidth + 4, footerLogoY + 5);
  };

  // Track which page we are on so callers can detect multi-page output
  let currentPageNum = 1;

  // If `neededHeight` mm of content won't fit below `currentY`, draw the footer on the
  // current page, add a new page, and return the Y position at the top of the new page.
  const ensureSpace = (currentY: number, neededHeight: number): number => {
    if (currentY + neededHeight > contentBottomLimit) {
      drawPageFooter();
      doc.addPage();
      currentPageNum++;
      return margin + 5;
    }
    return currentY;
  };

  let currentY = 15;

  // Header with USA Hockey logos and title
  try {
    const leftLogoInfo = await loadImageAsDataURL(
      buildCacheBustedAssetPath("/images/usahockey/usahockey-goaltending.jpg")
    );
    const rightLogoInfo = await loadImageAsDataURL(
      buildCacheBustedAssetPath("/images/usahockey/51-in-30.jpg")
    );

    const logoHeight = 16;
    const leftLogoWidth = (leftLogoInfo.width / leftLogoInfo.height) * logoHeight;
    const rightLogoWidth = (rightLogoInfo.width / rightLogoInfo.height) * logoHeight;

    doc.addImage(leftLogoInfo.dataURL, "JPEG", margin, currentY, leftLogoWidth, logoHeight);
    doc.addImage(
      rightLogoInfo.dataURL,
      "JPEG",
      pageWidth - margin - rightLogoWidth,
      currentY,
      rightLogoWidth,
      logoHeight
    );

    // Render the drill name as the header title, centered between the logos
    const titleHorizontalPaddingMm = 4; // gap between each logo edge and the title text
    const titleLineHeightMm = 7; // mm per line for fontSize 16
    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    const titleAvailableWidth =
      pageWidth - 2 * margin - leftLogoWidth - rightLogoWidth - 2 * titleHorizontalPaddingMm;
    const titleCenterX =
      margin + leftLogoWidth + titleHorizontalPaddingMm + titleAvailableWidth / 2;
    const titleLines = doc.splitTextToSize(drillData.name, titleAvailableWidth);
    const titleTotalHeight = titleLines.length * titleLineHeightMm;
    // Expand header area only if multi-line title exceeds the logo height
    const effectiveHeaderHeight = Math.max(logoHeight, titleTotalHeight);
    // Vertically center the text block within the effective header height
    const titleFirstLineY =
      currentY + (effectiveHeaderHeight - titleTotalHeight) / 2 + titleLineHeightMm;
    doc.text(titleLines, titleCenterX, titleFirstLineY, { align: "center" });

    currentY += effectiveHeaderHeight + 4;

    doc.setDrawColor(usaRed[0], usaRed[1], usaRed[2]);
    doc.setLineWidth(2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  } catch (error) {
    console.error("Error loading header images:", error);
    const titleLineHeightMm = 7; // mm per line for fontSize 16
    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    const fallbackTitleLines = doc.splitTextToSize(drillData.name, pageWidth - 2 * margin);
    doc.text(fallbackTitleLines, pageWidth / 2, currentY, { align: "center" });
    currentY += fallbackTitleLines.length * titleLineHeightMm + 4;
    doc.setDrawColor(usaRed[0], usaRed[1], usaRed[2]);
    doc.setLineWidth(2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  }

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

  // Column layout: wider left column for more text, narrower right column for images.
  // An 8 mm inter-column gap replaces the old full-margin gap, giving the left column
  // ~29% more width. The right column's right edge aligns with the page's right margin.
  const interColumnGap = 8;
  const rightColumnWidth = 65;
  const leftColumnWidth = pageWidth - 2 * margin - interColumnGap - rightColumnWidth; // ~97 mm
  const rightColumnX = margin + leftColumnWidth + interColumnGap;
  const contentStartY = currentY;

  // --- RIGHT COLUMN: Images (rendered first so they always land on page 1) ---
  const imageInfos: Array<{ dataURL: string; width: number; height: number }> = [];

  if (drillData.images && drillData.images.length > 0) {
    for (let i = 0; i < drillData.images.length; i++) {
      try {
        const imagePath = `/drills/${drillFolder}/${drillData.images[i]}`;
        const imageInfo = await loadImageAsDataURL(buildCacheBustedAssetPath(imagePath));
        imageInfos.push(imageInfo);
      } catch (error) {
        console.error(`Error loading image ${i + 1} (${drillData.images[i]}):`, error);
      }
    }
  }

  let rightY = contentStartY;

  if (imageInfos.length > 0) {
    const maxImageWidth = rightColumnWidth;
    // Distribute the full right-column height equally across all images so they all
    // fit on page 1. Gaps between images are accounted for before dividing.
    const totalGaps = (imageInfos.length - 1) * 4;
    const availableHeight = contentBottomLimit - contentStartY - totalGaps;
    const maxImageHeight = availableHeight / imageInfos.length;

    imageInfos.forEach((imageInfo) => {
      const aspectRatio = imageInfo.width / imageInfo.height;
      let imgWidth = maxImageWidth;
      let imgHeight = imgWidth / aspectRatio;

      // Shrink to fit the allocated height slice if needed
      if (imgHeight > maxImageHeight) {
        imgHeight = maxImageHeight;
        imgWidth = imgHeight * aspectRatio;
      }

      // Right-align image so its right edge meets the page's right margin
      const imgX = rightColumnX + rightColumnWidth - imgWidth;
      doc.addImage(imageInfo.dataURL, "PNG", imgX, rightY, imgWidth, imgHeight);
      rightY += imgHeight + 4;
    });
  }

  // --- LEFT COLUMN: Text sections (may overflow to additional pages) ---
  // Images have already been placed on page 1; ensureSpace page breaks apply only to text here.
  let leftY = contentStartY;

  // Description
  leftY = ensureSpace(leftY, 16); // heading + at least one text line
  doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Description", margin, leftY);
  leftY += 5;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  const normalizedDescription = normalizeDrillDescription(drillData.description);
  const descriptionLines = doc.splitTextToSize(normalizedDescription, leftColumnWidth);
  leftY = ensureSpace(leftY, descriptionLines.length * 4);
  doc.text(descriptionLines, margin, leftY);
  leftY += descriptionLines.length * 4 + 3;

  // Drill Steps (optional, no heading)
  if (drillData.drill_steps && drillData.drill_steps.length > 0) {
    for (const [index, step] of drillData.drill_steps.entries()) {
      const stepLines = doc.splitTextToSize(`${index + 1}. ${step}`, leftColumnWidth - 5);
      leftY = ensureSpace(leftY, stepLines.length * 4 + 1);
      doc.text(stepLines, margin + 3, leftY);
      leftY += stepLines.length * 4 + 1;
    }
    leftY += 2;
  }

  // Coaching Focus Points
  leftY = ensureSpace(leftY, 12); // heading + at least one bullet
  doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Coaching Focus Points", margin, leftY);
  leftY += 5;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");

  if (drillData.coaching_focus_points && drillData.coaching_focus_points.length > 0) {
    for (const point of drillData.coaching_focus_points) {
      const pointLines = doc.splitTextToSize(`• ${point}`, leftColumnWidth - 5);
      leftY = ensureSpace(leftY, pointLines.length * 4 + 1);
      doc.text(pointLines, margin + 3, leftY);
      leftY += pointLines.length * 4 + 1;
    }
  }

  // Shooter Focus Points (optional)
  if (drillData.shooter_focus_points && drillData.shooter_focus_points.length > 0) {
    leftY += 2;
    leftY = ensureSpace(leftY, 12); // heading + at least one bullet
    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Shooter Focus Points", margin, leftY);
    leftY += 5;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");

    for (const point of drillData.shooter_focus_points) {
      const pointLines = doc.splitTextToSize(`• ${point}`, leftColumnWidth - 5);
      leftY = ensureSpace(leftY, pointLines.length * 4 + 1);
      doc.text(pointLines, margin + 3, leftY);
      leftY += pointLines.length * 4 + 1;
    }
  }

  // Drill Progressions (optional)
  if (drillData.drill_progressions && drillData.drill_progressions.length > 0) {
    leftY += 2;
    leftY = ensureSpace(leftY, 12); // heading + at least one step
    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Drill Progressions", margin, leftY);
    leftY += 5;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");

    for (const [index, step] of drillData.drill_progressions.entries()) {
      const stepLines = doc.splitTextToSize(`${index + 1}. ${step}`, leftColumnWidth - 5);
      leftY = ensureSpace(leftY, stepLines.length * 4 + 1);
      doc.text(stepLines, margin + 3, leftY);
      leftY += stepLines.length * 4 + 1;
    }
  }

  // Determine starting Y for the sections below the two-column layout.
  // If the left column overflowed to a new page, we are already on that page.
  let sectionY: number;
  if (currentPageNum > 1) {
    sectionY = leftY + 4;
  } else {
    sectionY = Math.max(leftY, rightY) + 4;
  }

  // Border line before Skills Focus
  sectionY = ensureSpace(sectionY, 50); // separator + heading + skills content
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(margin, sectionY, pageWidth - margin, sectionY);
  sectionY += 4;

  // Skills Focus section
  doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Skills Focus", margin, sectionY);
  sectionY += 5;

  const isTeamDrill = drillData.tags.team_drill?.[0] === "yes";
  const hasTeamConcepts =
    isTeamDrill && drillData.tags.team_concepts && drillData.tags.team_concepts.length > 0;

  // Use 3-column layout when team concepts are present; otherwise 2-column
  const colWidth = (pageWidth - 2 * margin) / (hasTeamConcepts ? 3 : 2);

  const skillsLeftX = margin;
  const skillsRightX = margin + colWidth;
  let skillsLeftY = sectionY;
  let skillsRightY = sectionY;

  const skillsThirdX = margin + 2 * colWidth;
  let skillsThirdY = sectionY;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  if (drillData.tags.fundamental_skill && drillData.tags.fundamental_skill.length > 0) {
    doc.setFont(undefined, "bold");
    doc.text("Fundamental Skills:", skillsLeftX, skillsLeftY);
    doc.setFont(undefined, "normal");
    skillsLeftY += 4;

    drillData.tags.fundamental_skill.forEach((skill) => {
      doc.text(`• ${formatTag(skill)}`, skillsLeftX + 3, skillsLeftY);
      skillsLeftY += 4;
    });
  }

  if (drillData.tags.skating_skill && drillData.tags.skating_skill.length > 0) {
    doc.setFont(undefined, "bold");
    doc.text("Skating Skills:", skillsRightX, skillsRightY);
    doc.setFont(undefined, "normal");
    skillsRightY += 4;

    drillData.tags.skating_skill.forEach((skill) => {
      doc.text(`• ${formatTag(skill)}`, skillsRightX + 3, skillsRightY);
      skillsRightY += 4;
    });
  }

  if (hasTeamConcepts) {
    doc.setFont(undefined, "bold");
    doc.text("Team Concepts:", skillsThirdX, skillsThirdY);
    doc.setFont(undefined, "normal");
    skillsThirdY += 4;

    drillData.tags.team_concepts.forEach((concept) => {
      doc.text(`• ${formatTag(concept)}`, skillsThirdX + 3, skillsThirdY);
      skillsThirdY += 4;
    });
  }

  // Video section — URL only, no thumbnail image
  if (drillData.video) {
    sectionY = Math.max(skillsLeftY, skillsRightY, skillsThirdY) + 4;
    const videoLines = doc.splitTextToSize(drillData.video, pageWidth - 2 * margin);
    sectionY = ensureSpace(sectionY, 9 + videoLines.length * 4);

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, sectionY, pageWidth - margin, sectionY);
    sectionY += 4;

    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Video Demonstration", margin, sectionY);
    sectionY += 5;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text(videoLines, margin, sectionY);
    sectionY += videoLines.length * 4;
  }

  // Draw the footer on the last (current) page
  drawPageFooter();

  return doc;
};

export const generateDrillPdfBlob = async (
  drillData: DrillData,
  drillFolder: string
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

  const doc = await generateDrillPdf(drillData, drillFolder);
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
