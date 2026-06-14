export interface NormalizedCoachingFocusBlock {
  heading?: string;
  bullets: string[];
}

export function normalizeCoachingFocusPoints(markdown = ""): NormalizedCoachingFocusBlock[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      bullets: [line.replace(/^[-*]\s+/, "")],
    }));
}

export function flattenCoachingFocusPoints(markdown = ""): string[] {
  return normalizeCoachingFocusPoints(markdown).flatMap((block) => block.bullets);
}
