export {};

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set' | 'get' | 'consent',
      action: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

type EventType =
  | 'generate_plan'
  | 'generate_journal'
  | 'download_drill'
  | 'download_material'
  | 'external_link_click';

// Specific interfaces for each event type's parameters
interface GeneratePlanParams {
  type: 'individual' | 'team';
  team_name?: string;
  team_name_provided?: boolean;
  age_group?: string;
  skill_level?: string;
  practices_count?: number;
}

interface GenerateJournalParams {
  team_name?: string;
}

interface DownloadDrillParams {
  drill_name?: string;
  age_group: string;
  skill_level: string;
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
  | GeneratePlanParams 
  | GenerateJournalParams 
  | DownloadDrillParams 
  | DownloadMaterialParams
  | ExternalLinkClickParams;

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
 * // Track an individual plan generation
 * trackEvent('generate_plan', {
 *   type: 'individual',
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
export function trackEvent(action: 'generate_plan', params?: GeneratePlanParams): void;
export function trackEvent(action: 'generate_journal', params?: GenerateJournalParams): void;
export function trackEvent(action: 'download_drill', params: DownloadDrillParams): void;
export function trackEvent(action: 'download_material', params: DownloadMaterialParams): void;
export function trackEvent(action: 'external_link_click', params: ExternalLinkClickParams): void;
export function trackEvent(
  action: EventType,
  params?: AnalyticsParams
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  } else {
    // Log to console in development if gtag is missing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Event: ${action}`, params);
    }
  }
}
