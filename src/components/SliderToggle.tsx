import * as React from "react";

export type SliderToggleProps = {
  id: string;
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled: boolean;
};

export default function SliderToggle({
  id,
  label,
  enabled,
  onChange,
  disabled,
}: SliderToggleProps) {
  const trackClasses = enabled
    ? disabled
      ? "bg-blue-300 dark:bg-blue-700"
      : "bg-usa-blue dark:bg-blue-500"
    : disabled
      ? "bg-gray-300 dark:bg-gray-700"
      : "bg-gray-400 dark:bg-gray-600";

  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <span id={`${id}-label`} className="text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby={`${id}-label`}
        aria-label={label}
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center overflow-hidden rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-usa-blue focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${trackClasses} ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        <span
          className={`pointer-events-none block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
