import { jsPDF } from "jspdf";
import { getVideoThumbnailUrl } from "./videoUtils";
import type { DrillData } from "../types/drill";

export type { DrillData };

const formatTag = (tag: string): string => {
  return tag
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const loadImageAsDataURL = (
  imagePath: string
): Promise<{ dataURL: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
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
  });
};

export const generateDrillPdf = async (
  drillData: DrillData,
  drillFolder: string
): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const usaBlue = [0, 32, 91] as const; // #00205B
  const usaRed = [175, 39, 47] as const; // #AF272F

  // Gold section dimensions - defined early so image height calculations can reserve space
  const goldLogoHeight = 16;
  const goldLogoY = pageHeight - margin - goldLogoHeight;
  const contentBottomLimit = goldLogoY - 12; // separator gap + padding above gold logo

  // Estimated space (mm) needed for sections rendered below the main content columns
  const skillsSectionEstimate = 40;
  const videoSectionEstimate = drillData.video ? 35 : 0;

  let currentY = 15;

  // Header with USA Hockey logos and title
  try {
    const leftLogoInfo = await loadImageAsDataURL("/images/usahockey/usahockey-goaltending.jpg");
    const rightLogoInfo = await loadImageAsDataURL("/images/usahockey/51-in-30.jpg");

    // Add left logo
    const logoHeight = 16;
    const leftLogoWidth = (leftLogoInfo.width / leftLogoInfo.height) * logoHeight;
    doc.addImage(leftLogoInfo.dataURL, "JPEG", margin, currentY, leftLogoWidth, logoHeight);

    // Add center title
    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("DRILLS", pageWidth / 2, currentY + 12, { align: "center" });

    // Add right logo
    const rightLogoWidth = (rightLogoInfo.width / rightLogoInfo.height) * logoHeight;
    doc.addImage(
      rightLogoInfo.dataURL,
      "JPEG",
      pageWidth - margin - rightLogoWidth,
      currentY,
      rightLogoWidth,
      logoHeight
    );

    currentY += logoHeight + 4;

    // Red underline
    doc.setDrawColor(usaRed[0], usaRed[1], usaRed[2]);
    doc.setLineWidth(2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  } catch (error) {
    console.error("Error loading header images:", error);
    // Fallback to simple header
    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("DRILLS", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;
    doc.setDrawColor(usaRed[0], usaRed[1], usaRed[2]);
    doc.setLineWidth(2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  }

  // Drill name
  doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  const drillNameLines = doc.splitTextToSize(drillData.name, pageWidth - 2 * margin);
  doc.text(drillNameLines, margin, currentY);
  currentY += drillNameLines.length * 6 + 4;

  // Tags section - bold labels, normal values, equipment on separate line
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  // Age Group and Skill Level on same line
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

  // Equipment Needed on its own line
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

  // Calculate available space for images
  const leftColumnWidth = (pageWidth - 3 * margin) / 2;
  const rightColumnWidth = (pageWidth - 3 * margin) / 2;
  const rightColumnX = margin + leftColumnWidth + margin;

  // Load images first so right-column rendering can calculate scaled heights
  const imageInfos: Array<{ dataURL: string; width: number; height: number }> = [];

  if (drillData.images && drillData.images.length > 0) {
    for (let i = 0; i < drillData.images.length; i++) {
      try {
        const imagePath = `/drills/${drillFolder}/${drillData.images[i]}`;
        const imageInfo = await loadImageAsDataURL(imagePath);
        imageInfos.push(imageInfo);
      } catch (error) {
        console.error(`Error loading image ${i + 1} (${drillData.images[i]}):`, error);
      }
    }
  }

  // Left column: Description and Coaching Points
  const contentStartY = currentY;
  let leftY = contentStartY;

  // Description
  doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Description", margin, leftY);
  leftY += 6;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  const descriptionLines = doc.splitTextToSize(drillData.description, leftColumnWidth);
  doc.text(descriptionLines, margin, leftY);
  leftY += descriptionLines.length * 4 + 5;

  // Coaching Points
  doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Coaching Points", margin, leftY);
  leftY += 6;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");

  if (drillData.coaching_points && drillData.coaching_points.length > 0) {
    drillData.coaching_points.forEach((point) => {
      const pointLines = doc.splitTextToSize(`• ${point}`, leftColumnWidth - 5);
      doc.text(pointLines, margin + 3, leftY);
      leftY += pointLines.length * 4 + 1;
    });
  }

  // Right column: Images
  let rightY = contentStartY;

  if (imageInfos.length > 0) {
    const maxImageWidth = rightColumnWidth;
    const availableHeight =
      contentBottomLimit - contentStartY - skillsSectionEstimate - videoSectionEstimate;
    const maxImageHeight = (availableHeight - (imageInfos.length - 1) * 4) / imageInfos.length;

    imageInfos.forEach((imageInfo) => {
      const aspectRatio = imageInfo.width / imageInfo.height;
      let imgWidth = maxImageWidth;
      let imgHeight = imgWidth / aspectRatio;

      if (imgHeight > maxImageHeight) {
        imgHeight = maxImageHeight;
        imgWidth = imgHeight * aspectRatio;
      }

      // Center image in right column
      const imgX = rightColumnX + (rightColumnWidth - imgWidth) / 2;
      doc.addImage(imageInfo.dataURL, "PNG", imgX, rightY, imgWidth, imgHeight);
      rightY += imgHeight + 4;
    });
  }

  // Position for skills section (below both columns)
  currentY = Math.max(leftY, rightY) + 8;

  // Border line before Skills Focus
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // Skills Focus section
  doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Skills Focus", margin, currentY);
  currentY += 6;

  // Two-column layout for skills
  const skillsLeftX = margin;
  const skillsRightX = margin + leftColumnWidth + margin;
  let skillsLeftY = currentY;
  let skillsRightY = currentY;

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

  // Video section
  if (drillData.video) {
    currentY = Math.max(skillsLeftY, skillsRightY) + 6;

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    doc.setTextColor(usaBlue[0], usaBlue[1], usaBlue[2]);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Video Demonstration", margin, currentY);
    currentY += 6;

    try {
      const thumbnailUrl = await getVideoThumbnailUrl(drillData.video);
      if (thumbnailUrl) {
        const thumbInfo = await loadImageAsDataURL(thumbnailUrl);
        const thumbHeight = 18;
        const thumbWidth = (thumbInfo.width / thumbInfo.height) * thumbHeight;
        doc.addImage(thumbInfo.dataURL, "PNG", margin, currentY, thumbWidth, thumbHeight);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        const videoLines = doc.splitTextToSize(
          drillData.video,
          pageWidth - 2 * margin - thumbWidth - 4
        );
        doc.text(videoLines, margin + thumbWidth + 4, currentY + 6);
      } else {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        const videoLines = doc.splitTextToSize(drillData.video, pageWidth - 2 * margin);
        doc.text(videoLines, margin, currentY);
      }
    } catch (err) {
      console.error("Error loading video thumbnail for PDF:", err);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      const videoLines = doc.splitTextToSize(drillData.video, pageWidth - 2 * margin);
      doc.text(videoLines, margin, currentY);
    }
  }

  // Gold certification logo at bottom of page
  try {
    const goldLogoInfo = await loadImageAsDataURL(
      "/images/usahockey/usahockey-gold-certification.png"
    );
    const goldLogoWidth = (goldLogoInfo.width / goldLogoInfo.height) * goldLogoHeight;

    // Separator line before gold logo section
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, goldLogoY - 4, pageWidth - margin, goldLogoY - 4);

    doc.addImage(goldLogoInfo.dataURL, "PNG", margin, goldLogoY, goldLogoWidth, goldLogoHeight);

    // Text next to gold logo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont(undefined, "normal");
    const goldText =
      "This drill and the website on which it is hosted were developed as part of USA Hockey's Goaltending Gold certification program. For more drills and goaltending content, visit GoalieGen.com";
    const goldTextLines = doc.splitTextToSize(
      goldText,
      pageWidth - margin - goldLogoWidth - margin - 4
    );
    doc.text(goldTextLines, margin + goldLogoWidth + 4, goldLogoY + 5);
  } catch (error) {
    console.error("Error loading gold certification logo:", error);
  }

  return doc;
};
