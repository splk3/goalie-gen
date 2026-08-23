export {};

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "set" | "get" | "consent",
      action: string,
      params?: AnalyticsParams
    ) => void;
  }
}

type EventType =
  | "generate_team_plan"
  | "generate_club_plan"
  | "generate_goalie_journal"
  | "download_team_plan"
  | "download_club_plan"
  | "download_goalie_journal"
  | "download_drill"
  | "view_drill"
  | "share_drill"
  | "download_material"
  | "external_link_click";

interface GenerateTeamPlanParams {
  format?: string;
  team_name?: string;
  team_name_provided?: boolean;
  age_group?: string;
  skill_level?: string;
}

interface GenerateClubPlanParams {
  format?: string;
  club_name?: string;
  club_name_provided?: boolean;
}

interface GenerateGoalieJournalParams {
  format?: string;
  team_name?: string;
  team_name_provided?: boolean;
  season_provided?: boolean;
}

interface DownloadTeamPlanParams {
  format?: string;
  team_name?: string;
  team_name_provided?: boolean;
}

interface DownloadClubPlanParams {
  format?: string;
  club_name?: string;
  club_name_provided?: boolean;
}

interface DownloadGoalieJournalParams {
  format?: string;
  team_name?: string;
  team_name_provided?: boolean;
  season_provided?: boolean;
}

interface DownloadDrillParams {
  drill_name?: string;
  drill_slug?: string;
  age_group: string;
  skill_level: string;
  source_page?: string;
}

interface ViewDrillParams {
  drill_name: string;
  drill_slug: string;
  source_page?: string;
}

interface ShareDrillParams {
  drill_name: string;
  drill_slug: string;
  source_page?: string;
  share_method?: "web_share" | "clipboard";
}

interface DownloadMaterialParams {
  file_name: string;
  title: string;
}

interface ExternalLinkClickParams {
  label: string;
  url: string;
}

type AnalyticsParams =
  | GenerateTeamPlanParams
  | GenerateClubPlanParams
  | GenerateGoalieJournalParams
  | DownloadTeamPlanParams
  | DownloadClubPlanParams
  | DownloadGoalieJournalParams
  | DownloadDrillParams
  | ViewDrillParams
  | ShareDrillParams
  | DownloadMaterialParams
  | ExternalLinkClickParams;

const DISALLOWED_PARAM_KEYS = new Set(["goalie_name", "goalieName", "player_name", "playerName"]);

const sanitizeAnalyticsParams = (params?: AnalyticsParams): AnalyticsParams | undefined => {
  if (!params) {
    return params;
  }

  const sanitizedEntries = Object.entries(params).filter(
    ([key]) => !DISALLOWED_PARAM_KEYS.has(key)
  );
  return Object.fromEntries(sanitizedEntries) as AnalyticsParams;
};

/**
 * Tracks user events with Google Analytics.
 *
 * This function sends events to Google Analytics (gtag) when available,
 * or logs them to the console in development mode when gtag is not loaded.
 *
 * Uses function overloads to ensure type-safe parameter matching for each event type.
 * Parameters are required when the interface defines required fields.
 *
 * @param action - The type of event to track
 * @param params - Event-specific parameters that provide context about the user action
 *
 * @example
 * ```typescript
 * // Track a team plan generation
 * trackEvent('generate_team_plan', {
 *   format: 'docx',
 *   team_name: 'Springfield Eagles U12',
 *   team_name_provided: true
 * });
 *
 * // Track a drill download (params required due to required fields)
 * trackEvent('download_drill', {
 *   drill_name: 'Butterfly Slides',
 *   age_group: 'U12',
 *   skill_level: 'Intermediate'
 * });
 * ```
 */
export function trackEvent(action: "generate_team_plan", params?: GenerateTeamPlanParams): void;
export function trackEvent(action: "generate_club_plan", params?: GenerateClubPlanParams): void;
export function trackEvent(
  action: "generate_goalie_journal",
  params?: GenerateGoalieJournalParams
): void;
export function trackEvent(action: "download_team_plan", params: DownloadTeamPlanParams): void;
export function trackEvent(action: "download_club_plan", params: DownloadClubPlanParams): void;
export function trackEvent(
  action: "download_goalie_journal",
  params?: DownloadGoalieJournalParams
): void;
export function trackEvent(action: "download_drill", params: DownloadDrillParams): void;
export function trackEvent(action: "view_drill", params: ViewDrillParams): void;
export function trackEvent(action: "share_drill", params: ShareDrillParams): void;
export function trackEvent(action: "download_material", params: DownloadMaterialParams): void;
export function trackEvent(action: "external_link_click", params: ExternalLinkClickParams): void;
export function trackEvent(action: EventType, params?: AnalyticsParams): void {
  const sanitizedParams = sanitizeAnalyticsParams(params);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, sanitizedParams);
  } else {
    // Log to console in development if gtag is missing
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Event: ${action}`, sanitizedParams);
    }
  }
}
