import * as React from "react";
import { normalizeHexRgbColor, hexToHsv, hsvToHex, type HsvColor } from "../utils/teamColors";

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
 * Collapsible HSV slider panel for fine-tuning a color.
 *
 * **Why this exists:** Chrome on Android's native `<input type="color">` picker
 * has a known bug (as of June 2025) where the "Custom" color tab's
 * Hue/Saturation/Value sliders always initialize at 0/0/0 (black), regardless
 * of the currently selected color. This is a browser-level issue that cannot be
 * fixed via HTML/CSS/JS. These custom sliders provide a reliable alternative
 * for fine-tuning colors on all platforms.
 *
 * **Re-testing:** If a future Chrome release fixes the native picker's "Custom"
 * tab, this panel can optionally be removed. To verify: open the site on Android
 * Chrome, tap the color square, select "Custom", and check whether the native
 * sliders start at the currently selected color instead of black.
 *
 * See AGENTS.md § "Chrome on Android: Native Color Picker Limitation" for full
 * details on the attempted fixes and workaround rationale.
 */
function HsvSliders({
  idPrefix,
  hsv,
  disabled,
  onHsvChange,
}: {
  idPrefix: string;
  hsv: HsvColor;
  disabled: boolean;
  onHsvChange: (next: HsvColor) => void;
}) {
  const sliders: { id: string; label: string; field: keyof HsvColor; max: number }[] = [
    { id: `${idPrefix}-hue`, label: "Hue", field: "h", max: 360 },
    { id: `${idPrefix}-saturation`, label: "Saturation", field: "s", max: 100 },
    { id: `${idPrefix}-brightness`, label: "Brightness", field: "v", max: 100 },
  ];

  return (
    <div className="flex flex-col gap-2">
      {sliders.map(({ id, label, field, max }) => (
        <div key={id} className="flex items-center gap-2">
          <label
            htmlFor={id}
            className="w-20 text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0"
          >
            {label}
          </label>
          <input
            id={id}
            type="range"
            min={0}
            max={max}
            value={hsv[field]}
            disabled={disabled}
            onChange={(e) => onHsvChange({ ...hsv, [field]: Number(e.target.value) })}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-usa-blue disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="w-8 text-right text-xs font-mono text-gray-500 dark:text-gray-400">
            {hsv[field]}
          </span>
        </div>
      ))}
    </div>
  );
}

function ColorPickerControl({
  idPrefix,
  label,
  description,
  value,
  paletteColors,
  disabled,
  onChange,
}: ColorPickerControlProps) {
  const [hexInput, setHexInput] = React.useState<string>(value);
  const normalizedHex = normalizeHexRgbColor(hexInput);
  const showHexValidationError = hexInput.trim().length > 0 && !normalizedHex;

  const [showAdjust, setShowAdjust] = React.useState(false);
  const [hsv, setHsv] = React.useState<HsvColor>(() => hexToHsv(value));

  const colorInputRef = React.useRef<HTMLInputElement>(null);

  // Sync local state when the parent value changes (e.g. palette selection, logo extraction).
  React.useEffect(() => {
    setHexInput(value);
    setHsv(hexToHsv(value));
    if (colorInputRef.current) {
      const lower = value.toLowerCase();
      colorInputRef.current.value = lower;
      colorInputRef.current.setAttribute("value", lower);
      colorInputRef.current.defaultValue = lower;
    }
  }, [value]);

  const handleColorPickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizeHexRgbColor(event.target.value);
    if (!normalized) {
      return;
    }
    onChange(normalized);
    setHexInput(normalized);
    setHsv(hexToHsv(normalized));
  };

  const handleHexInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.toUpperCase();
    setHexInput(nextValue);
    const normalized = normalizeHexRgbColor(nextValue);
    if (normalized) {
      onChange(normalized);
      setHsv(hexToHsv(normalized));
    }
  };

  const handlePaletteColorSelect = (paletteColor: string) => {
    onChange(paletteColor);
    setHexInput(paletteColor);
    setHsv(hexToHsv(paletteColor));
  };

  const handleHsvChange = (next: HsvColor) => {
    setHsv(next);
    const hex = hsvToHex(next);
    onChange(hex);
    setHexInput(hex);
  };

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
        <div>
          <input
            ref={colorInputRef}
            id={`${idPrefix}-color`}
            type="color"
            defaultValue={value.toLowerCase()}
            onChange={handleColorPickerChange}
            disabled={disabled}
            className="h-10 w-16 cursor-pointer rounded border border-gray-300 bg-white p-1 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-xs font-mono text-gray-700 dark:text-gray-300">{value}</p>
        </div>

        <div className="flex-1">
          <label
            htmlFor={`${idPrefix}-hex`}
            className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
          >
            {label} Hex
          </label>
          <input
            id={`${idPrefix}-hex`}
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            disabled={disabled}
            placeholder="#RRGGBB"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          />
          {showHexValidationError && (
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">
              Enter a valid color in #RRGGBB format.
            </p>
          )}
        </div>
      </div>

      {/* Collapsible HSV adjustment sliders */}
      <div className="mt-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowAdjust((prev) => !prev)}
          className="text-xs font-medium text-usa-blue dark:text-blue-400 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          aria-expanded={showAdjust}
          aria-controls={`${idPrefix}-adjust`}
        >
          {showAdjust ? "▾ Hide Adjust Color" : "▸ Adjust Color"}
        </button>
        {showAdjust && (
          <div id={`${idPrefix}-adjust`} className="mt-2">
            <HsvSliders
              idPrefix={idPrefix}
              hsv={hsv}
              disabled={disabled}
              onHsvChange={handleHsvChange}
            />
            {/* Live preview swatch */}
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-block h-6 w-6 rounded border border-gray-400"
                style={{ backgroundColor: value }}
              />
              <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{value}</span>
            </div>
          </div>
        )}
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
