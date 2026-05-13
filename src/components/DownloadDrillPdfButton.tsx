import * as React from "react";
import type { DrillData } from "../types/drill";
import type { DrillPdfProgressCallback } from "../utils/generateDrillPdf";
import { trackEvent } from "../utils/analytics";
import { OBJECT_URL_REVOKE_DELAY_MS } from "../utils/staticAsset";

interface DownloadDrillPdfButtonProps {
  drillData: DrillData;
  drillFolder: string;
}

export default function DownloadDrillPdfButton({
  drillData,
  drillFolder,
}: DownloadDrillPdfButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [statusMessage, setStatusMessage] = React.useState<string>("");

  const handleDownload = async () => {
    setIsGenerating(true);
    setStatusMessage("Loading images...");

    const onProgress: DrillPdfProgressCallback = (message) => {
      setStatusMessage(message);
    };

    try {
      const { generateDrillPdfBlob } = await import("../utils/generateDrillPdf");

      const fileName = `${drillData.name.replace(/[<>:"/\\|?*]/g, "_")}.pdf`;
      const blob = await generateDrillPdfBlob(drillData, drillFolder, onProgress);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS);

      trackEvent("download_drill", {
        drill_name: drillData.name,
        age_group: drillData.tags.age_level?.join(", ") || "",
        skill_level: drillData.tags.skill_level?.join(", ") || "",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      const isOom =
        error instanceof Error &&
        (error.message.toLowerCase().includes("memory") ||
          error.message.toLowerCase().includes("out of memory"));
      alert(
        isOom
          ? "Unable to generate PDF: one or more images are too large. Try reducing image sizes and try again."
          : "Failed to generate PDF. Please ensure your browser supports PDF generation and try again."
      );
    } finally {
      setIsGenerating(false);
      setStatusMessage("");
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`bg-usa-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors ${
        isGenerating ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {isGenerating ? statusMessage || "Generating..." : "Download Drill"}
    </button>
  );
}
