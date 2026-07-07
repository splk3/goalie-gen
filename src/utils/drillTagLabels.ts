const TAG_VALUE_LABELS: Record<string, string> = {
  "10_and_under": "10U and under",
  "16U_and_older": "16U and older",
};

const formatDefaultTagValue = (value: string): string => {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const formatDrillTagValue = (value: string): string => {
  return TAG_VALUE_LABELS[value] ?? formatDefaultTagValue(value);
};
