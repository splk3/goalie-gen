/**
 * Shared default values for document generator configuration.
 * These are the single source of truth for both the web form initial state and
 * the CLI script argument defaults, ensuring the two environments start from the
 * same baseline.
 */

// ─── Club Plan defaults ───────────────────────────────────────────────────────

export const DEFAULT_PROVIDED_EQUIPMENT_AGE_GROUPS = "8U and younger (mites)";

export const DEFAULT_TRAINING_FREQUENCY = "2x a month";
export const DEFAULT_TRAINING_SESSION_LENGTH = "1 hour";
export const DEFAULT_TRAINING_WITH_WHOM = "Goalie Coach or Training Organization Name";
export const DEFAULT_TRAINING_STARTING_AGE = "12U";

export const DEFAULT_VIDEO_SESSION_FREQUENCY = "weekly";
export const DEFAULT_VIDEO_SESSION_LENGTH = "30 minutes";

export const DEFAULT_EVALUATION_WHEN =
  "at the beginning of the season, mid-season, and at the end of the season";

export const DEFAULT_GOALIE_DISCOUNT = "ex. 50%, $500";

/**
 * The list of named introduction section headings inside
 * `src/content/club-plan/introduction.md`.
 * The web component picks one at random; the CLI defaults to the first entry.
 */
export const CLUB_PLAN_INTRO_OPTIONS = [
  "Option 1",
  "Option 2",
  "Option 3",
  "Option 4",
  "Option 5",
] as const;

export type ClubPlanIntroOption = (typeof CLUB_PLAN_INTRO_OPTIONS)[number];

// ─── Journal defaults ─────────────────────────────────────────────────────────

/** Default number of weekly practice/game log entry pages in the journal. */
export const DEFAULT_JOURNAL_ENTRY_COUNT = 24;

// ─── Shared pure utility functions ───────────────────────────────────────────

/**
 * Extracts the body content of a level-3 `### Heading` section from a
 * markdown string. Returns the trimmed content between the matching heading
 * and the next level-3 heading (or end of string). Returns an empty string
 * when the heading is not found.
 */
export function extractLevel3Section(markdown: string, heading: string): string {
  const lines = markdown.split(/\r?\n/);
  const sectionLines: string[] = [];
  let collecting = false;

  for (const line of lines) {
    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      if (collecting) {
        break;
      }
      collecting = headingMatch[1].trim() === heading;
      continue;
    }

    if (collecting) {
      sectionLines.push(line);
    }
  }

  return sectionLines.join("\n").trim();
}

/**
 * Returns `value` if it is non-empty (after trimming), otherwise returns a
 * bracketed placeholder string, e.g. `[PLACEHOLDER_NAME]`.
 */
export function valueOrPlaceholder(value: string, placeholderName: string): string {
  const trimmed = value.trim();
  return trimmed || `[${placeholderName}]`;
}

/**
 * Replaces the first level-2 `## …` heading line in `markdown` with
 * `## <heading>`.
 */
export function withSectionHeading(markdown: string, heading: string): string {
  return markdown.replace(/^##\s+.+$/m, `## ${heading}`);
}

/**
 * Normalizes a URL string: adds an `https://` prefix when no scheme is
 * present. Returns an empty string for falsy / whitespace-only inputs.
 */
export function normalizeUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Formats a `YYYY-MM-DD` date key into a human-readable string using the
 * user's locale (e.g. "Mon, Jul 6, 2026").
 */
export function formatDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ─── Club Plan content builders ───────────────────────────────────────────────

export interface TrainingDetailsParams {
  // Dedicated on-ice goalie practice
  hasDedicatedGoaliePractices: boolean;
  dedicatedGoaliePracticesHowOften: string;
  dedicatedGoaliePracticesLength: string;
  dedicatedGoaliePracticesWithWhom: string;
  dedicatedGoaliePracticesStartingAgeGroup: string;

  // Off-ice training
  hasOffIceGoalieTraining: boolean;
  offIceGoalieTrainingHowOften: string;
  offIceGoalieTrainingLength: string;
  offIceGoalieTrainingWithWhom: string;
  offIceGoalieTrainingStartingAgeGroup: string;

  // Video sessions
  hasGoalieVideoSessions: boolean;
  goalieVideoSessionsHowOften: string;
  goalieVideoSessionsLength: string;
  goalieVideoSessionsStartingAgeGroup: string;

  // General club benefits
  isEquipmentProvided: boolean;
  equipmentProvidedAgeGroups: string;
  hasTeamPracticeGoalieTraining: boolean;
  hasGoalieCoachPerTeam: boolean;
  hasYoungerGoalieMentors: boolean;

  // Evaluations
  hasGoalieEvaluations: boolean;
  goalieEvaluationsWhen: string;

  // Discount
  hasGoalieDiscount: boolean;
  goalieDiscountDetails: string;
  goalieDiscountStartingAgeGroup: string;
  goaliesAreFree: boolean;

  // Nets
  useIntermediateNets: boolean;
}

/**
 * Builds the markdown string for the "Benefits for Club Goalies / Training
 * Details" block based on the enabled feature flags.
 *
 * @param params  Feature flag values and associated detail strings.
 * @param benefitsForClubGoaliesMd  Pre-loaded markdown content from
 *   `src/content/club-plan/benefits-for-club-goalies.md`.
 */
export function buildTrainingDetailsBlock(
  params: TrainingDetailsParams,
  benefitsForClubGoaliesMd: string
): string {
  const {
    hasDedicatedGoaliePractices,
    dedicatedGoaliePracticesHowOften,
    dedicatedGoaliePracticesLength,
    dedicatedGoaliePracticesWithWhom,
    dedicatedGoaliePracticesStartingAgeGroup,
    hasOffIceGoalieTraining,
    offIceGoalieTrainingHowOften,
    offIceGoalieTrainingLength,
    offIceGoalieTrainingWithWhom,
    offIceGoalieTrainingStartingAgeGroup,
    hasGoalieVideoSessions,
    goalieVideoSessionsHowOften,
    goalieVideoSessionsLength,
    goalieVideoSessionsStartingAgeGroup,
    isEquipmentProvided,
    equipmentProvidedAgeGroups,
    hasTeamPracticeGoalieTraining,
    hasGoalieCoachPerTeam,
    hasYoungerGoalieMentors,
    hasGoalieEvaluations,
    goalieEvaluationsWhen,
    hasGoalieDiscount,
    goalieDiscountDetails,
    goalieDiscountStartingAgeGroup,
    goaliesAreFree,
    useIntermediateNets,
  } = params;

  const lines: string[] = [benefitsForClubGoaliesMd.trim(), ""];

  if (useIntermediateNets) {
    lines.push(
      "- 8U and younger (mites) teams use USA Hockey recommended intermediate sized nets."
    );
  }

  if (isEquipmentProvided) {
    lines.push(
      `- Goalie equipment is provided by the club for: ${valueOrPlaceholder(
        equipmentProvidedAgeGroups,
        "EQUIPMENT_AGE_GROUPS"
      )}.`
    );
  }

  if (hasTeamPracticeGoalieTraining) {
    lines.push("- Teams include goalie training during team practices.");
  }
  if (hasGoalieCoachPerTeam) {
    lines.push("- Each team has a goalie coach.");
  }
  if (hasYoungerGoalieMentors) {
    lines.push("- Younger goalies are paired with mentors from older teams.");
  }

  if (hasDedicatedGoaliePractices) {
    lines.push(
      `- Dedicated goalie practices are offered ${valueOrPlaceholder(
        dedicatedGoaliePracticesHowOften,
        "DEDICATED_GOALIE_PRACTICES_HOW_OFTEN"
      )}, run for ${valueOrPlaceholder(
        dedicatedGoaliePracticesLength,
        "DEDICATED_GOALIE_PRACTICES_LENGTH"
      )}, led by ${valueOrPlaceholder(
        dedicatedGoaliePracticesWithWhom,
        "DEDICATED_GOALIE_PRACTICES_WITH_WHOM"
      )}, starting at ${valueOrPlaceholder(
        dedicatedGoaliePracticesStartingAgeGroup,
        "DEDICATED_GOALIE_PRACTICES_STARTING_AGE_GROUP"
      )}.`
    );
  }

  if (hasOffIceGoalieTraining) {
    lines.push(
      `- Off-ice goalie training is offered ${valueOrPlaceholder(
        offIceGoalieTrainingHowOften,
        "OFF_ICE_GOALIE_TRAINING_HOW_OFTEN"
      )}, run for ${valueOrPlaceholder(
        offIceGoalieTrainingLength,
        "OFF_ICE_GOALIE_TRAINING_LENGTH"
      )}, led by ${valueOrPlaceholder(
        offIceGoalieTrainingWithWhom,
        "OFF_ICE_GOALIE_TRAINING_WITH_WHOM"
      )}, starting at ${valueOrPlaceholder(
        offIceGoalieTrainingStartingAgeGroup,
        "OFF_ICE_GOALIE_TRAINING_STARTING_AGE_GROUP"
      )}.`
    );
  }

  if (hasGoalieVideoSessions) {
    lines.push(
      `- Goalie-specific video sessions are offered ${valueOrPlaceholder(
        goalieVideoSessionsHowOften,
        "GOALIE_VIDEO_SESSIONS_HOW_OFTEN"
      )}, run for ${valueOrPlaceholder(
        goalieVideoSessionsLength,
        "GOALIE_VIDEO_SESSIONS_LENGTH"
      )}, starting at ${valueOrPlaceholder(
        goalieVideoSessionsStartingAgeGroup,
        "GOALIE_VIDEO_SESSIONS_STARTING_AGE_GROUP"
      )}.`
    );
  }

  if (hasGoalieEvaluations) {
    lines.push(
      `- Goalie evaluations are conducted ${valueOrPlaceholder(
        goalieEvaluationsWhen,
        "GOALIE_EVALUATIONS_WHEN"
      )}.`
    );
  }

  if (hasGoalieDiscount) {
    if (goaliesAreFree) {
      lines.push(
        `- Goalie discount program: Goalies are free${
          goalieDiscountStartingAgeGroup.trim()
            ? ` starting at ${valueOrPlaceholder(
                goalieDiscountStartingAgeGroup,
                "GOALIE_DISCOUNT_STARTING_AGE_GROUP"
              )}`
            : ""
        }.`
      );
    } else {
      lines.push(
        `- Goalie discount program: ${valueOrPlaceholder(
          goalieDiscountDetails,
          "GOALIE_DISCOUNT"
        )}${
          goalieDiscountStartingAgeGroup.trim()
            ? ` (starting age group: ${valueOrPlaceholder(
                goalieDiscountStartingAgeGroup,
                "GOALIE_DISCOUNT_STARTING_AGE_GROUP"
              )})`
            : ""
        }.`
      );
    }
  }

  return lines.join("\n");
}

// ─── Team Plan content builders ───────────────────────────────────────────────

/**
 * Builds the "Season Overview" markdown section for the Team Plan, optionally
 * including age-group–specific starter content.
 *
 * @param includeStarter   Whether to embed the age-group–specific starter block.
 * @param selectedAgeGroup Age group string from the form/CLI (e.g. `"12u"`).
 * @param seasonOverviewMd Pre-loaded content from
 *   `src/content/team-plan/season-overview.md`.
 */
export function getSeasonOverviewMarkdown(
  includeStarter: boolean,
  selectedAgeGroup: string,
  seasonOverviewMd: string
): string {
  const ageGroupHeadingMap: Record<string, string> = {
    "8u": "8U Starter Content Placeholder",
    "10u": "10U Starter Content Placeholder",
    "12u": "12U Starter Content Placeholder",
    "14u+": "14U+ Starter Content Placeholder",
  };

  const selectedPlaceholderSection = extractLevel3Section(
    seasonOverviewMd,
    "Selected Overview Placeholder"
  );
  const starterHeading = ageGroupHeadingMap[selectedAgeGroup];
  const starterSection = starterHeading
    ? extractLevel3Section(seasonOverviewMd, starterHeading)
    : "";

  const sectionBody = includeStarter
    ? starterSection || selectedPlaceholderSection || "[SEASON_OVERVIEW_SELECTED]"
    : selectedPlaceholderSection || "[SEASON_OVERVIEW_SELECTED]";

  return `## Season Overview\n\n${sectionBody}`;
}

/**
 * Returns the appropriate starter markdown snippet for a given event type.
 *
 * @param eventType      The event type string (e.g. `"On-ice Practice"`).
 * @param eventDetailsMd Pre-loaded content from
 *   `src/content/team-plan/event-details.md`.
 */
export function getEventStarterMarkdown(eventType: string, eventDetailsMd: string): string {
  if (eventType === "On-ice Practice") {
    return (
      extractLevel3Section(eventDetailsMd, "Practice Event Starter Placeholder") ||
      "[EVENT_DETAILS_PRACTICE_STARTER]"
    );
  }
  if (eventType === "Game") {
    return (
      extractLevel3Section(eventDetailsMd, "Game Event Starter Placeholder") ||
      "[EVENT_DETAILS_GAME_STARTER]"
    );
  }
  if (eventType === "Off-ice Practice" || eventType === "Video Review") {
    return (
      extractLevel3Section(eventDetailsMd, "Off-Ice Event Starter Placeholder") ||
      "[EVENT_DETAILS_OFF_ICE_STARTER]"
    );
  }
  return (
    extractLevel3Section(eventDetailsMd, "Selected Event Details Placeholder") ||
    "[EVENT_DETAILS_SELECTED]"
  );
}
