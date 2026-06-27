import * as React from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { normalizeHexRgbColor } from "../utils/teamColors";

interface ColorPickerControlProps {
  idPrefix: string;
  label: string;
  description?: string;
  value: string;
  paletteColors: string[];
  disabled: boolean;
  onChange: (color: string) => void;
}

interface TeamColorPickersProps {
  primaryColor: string;
  secondaryColor: string;
  paletteColors: string[];
  disabled?: boolean;
  /** Label noun used in the section heading and picker labels. Defaults to "Team". */
  entityName?: string;
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string) => void;
}

/**
 * A color picker control that uses react-colorful's HexColorPicker for a
 * consistent, cross-platform color picking experience. The picker opens as a
 * popover when the user clicks/taps the color swatch, and dismisses on outside
 * click or Escape key.
 *
 * This replaces the previous implementation that used a native
 * `<input type="color">` plus custom HSV sliders. The native picker had a
 * known bug on Chrome for Android (as of June 2025) where the "Custom" color
 * tab's sliders always initialized at black, regardless of the selected color.
 * react-colorful renders its own cross-platform picker that is immune to
 * browser-specific native picker bugs.
 *
 * See AGENTS.md § "Chrome on Android: Native Color Picker Limitation" for
 * the full history of that workaround.
 */
function ColorPickerControl({
  idPrefix,
  label,
  description,
  value,
  paletteColors,
  disabled,
  onChange,
}: ColorPickerControlProps) {
  const [open, setOpen] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLInputElement>(null);

  const handlePickerChange = (hex: string) => {
    const normalized = normalizeHexRgbColor(hex);
    if (normalized) {
      onChange(normalized);
    }
  };

  const handleColorInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!disabled) {
      setOpen((prev) => !prev);
    }
  };

  const handlePaletteColorSelect = (paletteColor: string) => {
    onChange(paletteColor);
  };

  // Close popover when clicking outside.
  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="mb-4 rounded-lg border border-gray-300 p-3 dark:border-gray-600">
      <label
        htmlFor={`${idPrefix}-color`}
        className="block text-gray-700 dark:text-gray-300 font-semibold mb-1"
      >
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
      )}

      <div className="flex items-start gap-4">
        <div className="relative">
          <input
            ref={triggerRef}
            id={`${idPrefix}-color`}
            type="color"
            value={value.toLowerCase()}
            onClick={handleColorInputClick}
            onChange={(e) => {
              const normalized = normalizeHexRgbColor(e.target.value);
              if (normalized) {
                onChange(normalized);
              }
            }}
            disabled={disabled}
            className="h-10 w-16 cursor-pointer rounded border border-gray-300 bg-white p-1 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-usa-blue"
          />
          <p className="mt-2 text-xs font-mono text-gray-700 dark:text-gray-300">{value}</p>

          {/* Popover picker */}
          {open && (
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={`${label} color picker`}
              className="absolute z-50 mt-2 left-0 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-2xl p-3 flex flex-col gap-3"
              style={{ minWidth: "220px" }}
            >
              <HexColorPicker
                color={value.toLowerCase()}
                onChange={handlePickerChange}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-center text-usa-blue dark:text-blue-400 hover:underline"
              >
                Done
              </button>
            </div>
          )}
        </div>

        <div className="flex-1">
          <label
            htmlFor={`${idPrefix}-hex`}
            className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
          >
            {label} Hex
          </label>
          <HexColorInput
            id={`${idPrefix}-hex`}
            color={value}
            onChange={handlePickerChange}
            disabled={disabled}
            prefixed={true}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase"
          />
        </div>
      </div>

      {paletteColors.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label} Palette
          </p>
          <div className="flex flex-wrap gap-2">
            {paletteColors.map((paletteColor) => (
              <button
                key={`${idPrefix}-${paletteColor}`}
                type="button"
                onClick={() => handlePaletteColorSelect(paletteColor)}
                disabled={disabled}
                aria-label={`Set ${label} to ${paletteColor}`}
                className="flex items-center gap-2 rounded border border-gray-300 px-2 py-1 text-xs font-mono text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span
                  className="inline-block h-4 w-4 rounded border border-gray-400"
                  style={{ backgroundColor: paletteColor }}
                />
                {paletteColor}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamColorPickers({
  primaryColor,
  secondaryColor,
  paletteColors,
  disabled = false,
  entityName = "Team",
  onPrimaryColorChange,
  onSecondaryColorChange,
}: TeamColorPickersProps) {
  const slug = entityName.toLowerCase();
  return (
    <fieldset className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      <legend className="px-2 text-lg font-bold text-usa-blue dark:text-blue-400">
        {entityName} Colors
      </legend>
      <ColorPickerControl
        idPrefix={`primary-${slug}-color`}
        label={`Primary ${entityName} Color`}
        description="Used for Titles, Headings, and Links - darker color recommended"
        value={primaryColor}
        paletteColors={paletteColors}
        disabled={disabled}
        onChange={onPrimaryColorChange}
      />
      <ColorPickerControl
        idPrefix={`secondary-${slug}-color`}
        label={`Secondary ${entityName} Color`}
        description="Used for other formatting elements - brighter color recommended"
        value={secondaryColor}
        paletteColors={paletteColors}
        disabled={disabled}
        onChange={onSecondaryColorChange}
      />
    </fieldset>
  );
}
