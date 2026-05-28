import type { CoachingFocusPoint } from "../types/drill";

export interface NormalizedCoachingFocusBlock {
  heading?: string;
  bullets: string[];
}

export function normalizeCoachingFocusPoints(
  points: CoachingFocusPoint[] = []
): NormalizedCoachingFocusBlock[] {
  return points.flatMap((point) => {
    if (typeof point === "string") {
      return [{ bullets: [point] }];
    }

    const entries = Object.entries(point);
    if (entries.length !== 1) {
      return [];
    }

    const [heading, bullets] = entries[0];
    if (!Array.isArray(bullets) || bullets.length === 0) {
      return [];
    }

    return [{ heading, bullets }];
  });
}

export function flattenCoachingFocusPoints(points: CoachingFocusPoint[] = []): string[] {
  return normalizeCoachingFocusPoints(points).flatMap((block) =>
    block.heading ? [block.heading, ...block.bullets] : block.bullets
  );
}
