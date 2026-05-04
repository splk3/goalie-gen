import * as React from "react";

interface FormatSelectorProps {
  format: "pdf" | "docx";
  onChange: (format: "pdf" | "docx") => void;
  name: string;
  disabled?: boolean;
}

/**
 * Reusable format selector that lets users choose between PDF and DOCX output.
 */
export default function FormatSelector({
  format,
  onChange,
  name,
  disabled = false,
}: FormatSelectorProps) {
  const labelClass = `flex items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;

  return (
    <div className="mb-4">
      <p className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Output Format</p>
      <div className="flex gap-6">
        <label className={labelClass}>
          <input
            type="radio"
            name={name}
            value="docx"
            checked={format === "docx"}
            onChange={() => onChange("docx")}
            disabled={disabled}
            className="accent-usa-blue"
          />
          <span className="text-gray-700 dark:text-gray-300">Word (.docx)</span>
        </label>
        <label className={labelClass}>
          <input
            type="radio"
            name={name}
            value="pdf"
            checked={format === "pdf"}
            onChange={() => onChange("pdf")}
            disabled={disabled}
            className="accent-usa-blue"
          />
          <span className="text-gray-700 dark:text-gray-300">PDF (.pdf)</span>
        </label>
      </div>
    </div>
  );
}
