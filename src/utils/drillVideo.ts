// Accepted drill video formats. Keep this validator shared by build-time YAML
// validation and browser embedding so unsupported URLs can never reach an iframe.
const YOUTUBE_WATCH_REGEX = /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+([&#].*)?$/;
const YOUTUBE_SHORT_REGEX = /^https:\/\/youtu\.be\/[\w-]+(\?.*)?$/;
const VIMEO_REGEX = /^https:\/\/(www\.)?vimeo\.com\/\d+(\?.*)?$/;

export const isValidDrillVideoUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  (YOUTUBE_WATCH_REGEX.test(value) || YOUTUBE_SHORT_REGEX.test(value) || VIMEO_REGEX.test(value));
