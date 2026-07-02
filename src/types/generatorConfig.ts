/**
 * Shared TypeScript interfaces for the document generator builders.
 * These serve as the single source of truth for both the web form state
 * (React components) and CLI argument configurations.
 */

// ─── Shared / cross-generator types ──────────────────────────────────────────

/** Supported image types for DOCX ImageRun. */
export type DocxImageType = "png" | "jpg" | "gif" | "bmp";

/**
 * Pre-resolved logo image data ready to be embedded in a document.
 * Platform-specific code (browser FileReader / Node fs.readFileSync) handles
 * loading; the builder receives only the final bytes and dimensions.
 */
export interface ResolvedLogoData {
  data: ArrayBuffer | Buffer;
  type: DocxImageType;
  width: number;
  height: number;
}

/**
 * Callback used by the team-plan builder to generate a QR-code PNG.
 * The implementation differs per platform:
 *   - Browser: dynamically imports `qrcode`, converts the base64 data URL to
 *     a Uint8Array.
 *   - Node/CLI: calls `qrcode.toBuffer` directly.
 */
export type QrGenerator = (url: string) => Promise<Uint8Array | null>;

// ─── Club Plan ────────────────────────────────────────────────────────────────

/** All configuration options for the Club Plan document generator. */
export interface ClubPlanConfig {
  // Identity
  clubName: string;
  clubWebsite: string;
  clubMotto: string;

  // Colors (raw hex strings, may include a leading #)
  primaryColor: string;
  secondaryColor: string;

  // Feature toggles
  useIntermediateNets: boolean;

  isEquipmentProvided: boolean;
  equipmentProvidedAgeGroups: string;

  hasTeamPracticeGoalieTraining: boolean;
  hasGoalieCoachPerTeam: boolean;
  hasYoungerGoalieMentors: boolean;

  hasDedicatedGoaliePractices: boolean;
  dedicatedGoaliePracticesHowOften: string;
  dedicatedGoaliePracticesLength: string;
  dedicatedGoaliePracticesWithWhom: string;
  dedicatedGoaliePracticesStartingAgeGroup: string;

  hasOffIceGoalieTraining: boolean;
  offIceGoalieTrainingHowOften: string;
  offIceGoalieTrainingLength: string;
  offIceGoalieTrainingWithWhom: string;
  offIceGoalieTrainingStartingAgeGroup: string;

  hasGoalieVideoSessions: boolean;
  goalieVideoSessionsHowOften: string;
  goalieVideoSessionsLength: string;
  goalieVideoSessionsStartingAgeGroup: string;

  hasGoalieEvaluations: boolean;
  goalieEvaluationsWhen: string;

  hasGoalieDiscount: boolean;
  goalieDiscountDetails: string;
  goalieDiscountStartingAgeGroup: string;
  goaliesAreFree: boolean;

  // Optional section toggles
  includeStarterIntroduction: boolean;
  includeStarterSeasonGoals: boolean;
  includeRequiredEquipmentSection: boolean;
  includeExternalResourcesSection: boolean;
}

/** Pre-loaded markdown content for the Club Plan builder. */
export interface ClubPlanContent {
  introductionMd: string;
  seasonGoalsMd: string;
  benefitsForClubGoaliesMd: string;
  skillDevelopmentMd: string;
  contactInformationMd: string;
  equipmentMd: string;
  progressTrackingMd: string;
  resourcesMd: string;
}

// ─── Team Plan ────────────────────────────────────────────────────────────────

export type AgeGroup = "8u" | "10u" | "12u" | "14u+";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type ConfigurableEventType =
  | "On-ice Practice"
  | "Off-ice Practice"
  | "Video Review"
  | "Evaluation"
  | "Game";
export type EventType = ConfigurableEventType | "TBD";

export interface EventDateSelection {
  date: string;
  eventTypes: EventType[];
}

export interface EventSelection {
  date: string;
  eventType: EventType;
}

/** All configuration options for the Team Plan document generator. */
export interface TeamPlanConfig {
  // Identity
  teamName: string;
  teamWebsite: string;
  teamMotto: string;

  // Colors (raw hex strings, may include a leading #)
  primaryColor: string;
  secondaryColor: string;

  ageGroup: string;
  skillLevel: string;

  // Feature toggles
  hasGoalieMentors: boolean;
  hasGoalieEvaluations: boolean;
  goalieEvaluationTimes: string;
  includeStarterIntroductionAndGoals: boolean;
  addCalendarOfEvents: boolean;
  includeCalendarView: boolean;
  includeEventDetails: boolean;
  addSuggestedDrillEachPractice: boolean;

  // Pre-processed event lists (sorted, filtered, reconciled)
  sortedEventDates: EventDateSelection[];
  eventSelections: EventSelection[];
  detailedEventSelections: EventSelection[];
}

/** Pre-loaded markdown content for the Team Plan builder. */
export interface TeamPlanContent {
  coverMd: string;
  seasonOverviewMd: string;
  eventDetailsMd: string;
}

// ─── Goalie Journal ───────────────────────────────────────────────────────────

/** All configuration options for the Goalie Journal PDF generator. */
export interface GoalieJournalConfig {
  goalieName: string;
  teamName: string;
  /** Season string, e.g. "2026-2027". */
  season: string;
  /** Number of weekly practice/game entry pages to generate. */
  entryCount: number;
}

/** Pre-loaded markdown content for the Goalie Journal builder. */
export interface GoalieJournalContent {
  coverMd: string;
  seasonGoalsMd: string;
  practiceEntryMd: string;
  endOfSeasonMd: string;
}

/**
 * Pre-resolved logo data for the Goalie Journal.
 * The journal builder uses base64 data URLs since jsPDF's `addImage` accepts
 * them directly on both Node and browser.
 */
export interface JournalLogoData {
  /** Base64 data URL, e.g. `data:image/png;base64,...` */
  dataUrl: string;
  width: number;
  height: number;
}
