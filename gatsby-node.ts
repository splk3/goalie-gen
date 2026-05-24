import type { GatsbyNode } from "gatsby";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import type { DrillData } from "./src/types/drill";
import {
  estimateDrillPdfPages,
  shouldPlaceProgressionsOnSecondPage,
  shouldUseFullWidthFirstPageDiagram,
} from "./src/utils/estimateDrillPdfPages";

// Module-level cache: drills are loaded once per build process and reused
// across createPages and sourceNodes to avoid redundant disk reads.
let _drillsCache: Array<{ folder: string; drillData: DrillData }> | null = null;

// Allowed tag values for validation
const ALLOWED_FUNDAMENTAL_SKILLS = [
  "skating",
  "positioning",
  "stance",
  "save_selection",
  "rebound_control",
  "recovery",
];

const ALLOWED_SKATING_SKILLS = ["butterfly", "power_push", "shuffle", "t_push", "c_cut"];

const ALLOWED_AGE_LEVELS = ["10U_below", "12U", "14U", "16U_and_older", "all"];

const ALLOWED_SKILL_LEVELS = ["beginner", "intermediate", "advanced"];

const ALLOWED_EQUIPMENT = ["blaze_pods", "bumpers", "cones", "ice_marker", "none"];

const ALLOWED_TEAM_DRILL = ["yes", "no"];

const ALLOWED_GAME_SITUATIONS = [
  "power_play",
  "penalty_kill",
  "net_front_traffic",
  "dump_in",
  "stick_handling",
];

// Valid video URL patterns — only YouTube and Vimeo are accepted, HTTPS only.
// Patterns are intentionally restricted to formats that getEmbedUrl() (videoUtils.ts) can parse.
// YouTube watch: https://www.youtube.com/watch?v=VIDEO_ID — v= must be the first query parameter
const YOUTUBE_WATCH_REGEX = /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+([&#].*)?$/;
// YouTube short URL: https://youtu.be/VIDEO_ID
const YOUTUBE_SHORT_REGEX = /^https:\/\/youtu\.be\/[\w-]+(\?.*)?$/;
// Vimeo: https://vimeo.com/VIDEO_ID — numeric ID only; player.vimeo.com not accepted as input
const VIMEO_REGEX = /^https:\/\/(www\.)?vimeo\.com\/\d+(\?.*)?$/;

// Validate drill data structure
function validateDrillData(data: unknown, drillFolder: string): data is DrillData {
  if (!data || typeof data !== "object") {
    throw new Error(`[${drillFolder}] drill.yml must contain an object`);
  }

  const d = data as Record<string, unknown>;

  if (!d.name || typeof d.name !== "string") {
    throw new Error(`[${drillFolder}] drill.yml missing required field 'name' (string)`);
  }

  if (typeof d.description !== "undefined" && typeof d.description !== "string") {
    throw new Error(`[${drillFolder}] drill.yml field 'description' must be a string`);
  }

  if (!Array.isArray(d.drill_steps) || d.drill_steps.length === 0) {
    throw new Error(
      `[${drillFolder}] drill.yml missing required field 'drill_steps' (non-empty array)`
    );
  }
  for (const step of d.drill_steps) {
    if (typeof step !== "string") {
      throw new Error(`[${drillFolder}] drill.yml field 'drill_steps' must contain only strings`);
    }
  }

  if (!Array.isArray(d.coaching_focus_points)) {
    throw new Error(
      `[${drillFolder}] drill.yml missing required field 'coaching_focus_points' (array)`
    );
  }
  for (const point of d.coaching_focus_points) {
    if (typeof point !== "string") {
      throw new Error(
        `[${drillFolder}] drill.yml field 'coaching_focus_points' must contain only strings`
      );
    }
  }

  if (typeof d.shooter_focus_points !== "undefined" && !Array.isArray(d.shooter_focus_points)) {
    throw new Error(
      `[${drillFolder}] drill.yml field 'shooter_focus_points' must be an array of strings`
    );
  }
  if (Array.isArray(d.shooter_focus_points)) {
    for (const point of d.shooter_focus_points) {
      if (typeof point !== "string") {
        throw new Error(
          `[${drillFolder}] drill.yml field 'shooter_focus_points' must contain only strings`
        );
      }
    }
  }

  if (typeof d.drill_progressions !== "undefined" && !Array.isArray(d.drill_progressions)) {
    throw new Error(
      `[${drillFolder}] drill.yml field 'drill_progressions' must be an array of objects`
    );
  }
  if (Array.isArray(d.drill_progressions)) {
    if (d.drill_progressions.length > 8) {
      throw new Error(
        `[${drillFolder}] drill.yml field 'drill_progressions' can contain at most 8 progressions`
      );
    }

    d.drill_progressions.forEach((progression, index) => {
      if (!progression || typeof progression !== "object" || Array.isArray(progression)) {
        throw new Error(
          `[${drillFolder}] drill.yml field 'drill_progressions[${index}]' must be an object`
        );
      }

      const p = progression as Record<string, unknown>;

      if (typeof p.progression_name !== "string" || p.progression_name.trim().length === 0) {
        throw new Error(
          `[${drillFolder}] drill.yml field 'drill_progressions[${index}].progression_name' is required and must be a non-empty string`
        );
      }

      if (
        typeof p.progression_description !== "string" ||
        p.progression_description.trim().length === 0
      ) {
        throw new Error(
          `[${drillFolder}] drill.yml field 'drill_progressions[${index}].progression_description' is required and must be a non-empty string`
        );
      }

      if (
        typeof p.progression_image !== "undefined" &&
        (typeof p.progression_image !== "string" || p.progression_image.trim().length === 0)
      ) {
        throw new Error(
          `[${drillFolder}] drill.yml field 'drill_progressions[${index}].progression_image' must be a non-empty string when provided`
        );
      }
    });
  }

  if (typeof d.drill_image !== "string" || !d.drill_image) {
    throw new Error(`[${drillFolder}] drill.yml missing required field 'drill_image' (string)`);
  }

  if (!d.tags || typeof d.tags !== "object" || Array.isArray(d.tags)) {
    throw new Error(`[${drillFolder}] drill.yml missing required field 'tags' (object)`);
  }

  const tags = d.tags as Record<string, unknown>;

  // Validate tag fields against allowed lists (fundamental_skill, skating_skill, age_level, skill_level, equipment, team_drill)
  if (typeof tags.fundamental_skill !== "undefined" && !Array.isArray(tags.fundamental_skill)) {
    throw new Error(
      `[${drillFolder}] drill.yml field 'tags.fundamental_skill' must be an array of strings`
    );
  }
  if (Array.isArray(tags.fundamental_skill)) {
    for (const skill of tags.fundamental_skill) {
      if (typeof skill !== "string") {
        throw new Error(
          `[${drillFolder}] drill.yml field 'tags.fundamental_skill' must contain only strings`
        );
      }
      if (!ALLOWED_FUNDAMENTAL_SKILLS.includes(skill)) {
        throw new Error(
          `[${drillFolder}] invalid fundamental_skill '${skill}'. Allowed values: ${ALLOWED_FUNDAMENTAL_SKILLS.join(", ")}`
        );
      }
    }
  }

  if (typeof tags.skating_skill !== "undefined" && !Array.isArray(tags.skating_skill)) {
    throw new Error(
      `[${drillFolder}] drill.yml field 'tags.skating_skill' must be an array of strings`
    );
  }
  if (Array.isArray(tags.skating_skill)) {
    for (const skill of tags.skating_skill) {
      if (typeof skill !== "string") {
        throw new Error(
          `[${drillFolder}] drill.yml field 'tags.skating_skill' must contain only strings`
        );
      }
      if (!ALLOWED_SKATING_SKILLS.includes(skill)) {
        throw new Error(
          `[${drillFolder}] invalid skating_skill '${skill}'. Allowed values: ${ALLOWED_SKATING_SKILLS.join(", ")}`
        );
      }
    }
  }

  if (typeof tags.age_level !== "undefined" && !Array.isArray(tags.age_level)) {
    throw new Error(
      `[${drillFolder}] drill.yml field 'tags.age_level' must be an array of strings`
    );
  }
  if (Array.isArray(tags.age_level)) {
    for (const age of tags.age_level) {
      if (typeof age !== "string") {
        throw new Error(
          `[${drillFolder}] drill.yml field 'tags.age_level' must contain only strings`
        );
      }
      if (!ALLOWED_AGE_LEVELS.includes(age)) {
        throw new Error(
          `[${drillFolder}] invalid age_level '${age}'. Allowed values: ${ALLOWED_AGE_LEVELS.join(", ")}`
        );
      }
    }
  }

  if (typeof tags.skill_level !== "undefined" && !Array.isArray(tags.skill_level)) {
    throw new Error(
      `[${drillFolder}] drill.yml field 'tags.skill_level' must be an array of strings`
    );
  }
  if (Array.isArray(tags.skill_level)) {
    for (const skill of tags.skill_level) {
      if (typeof skill !== "string") {
        throw new Error(
          `[${drillFolder}] drill.yml field 'tags.skill_level' must contain only strings`
        );
      }
      if (!ALLOWED_SKILL_LEVELS.includes(skill)) {
        throw new Error(
          `[${drillFolder}] invalid skill_level '${skill}'. Allowed values: ${ALLOWED_SKILL_LEVELS.join(", ")}`
        );
      }
    }
  }

  if (typeof tags.equipment !== "undefined" && !Array.isArray(tags.equipment)) {
    throw new Error(
      `[${drillFolder}] drill.yml field 'tags.equipment' must be an array of strings`
    );
  }
  if (Array.isArray(tags.equipment)) {
    for (const eq of tags.equipment) {
      if (typeof eq !== "string") {
        throw new Error(
          `[${drillFolder}] drill.yml field 'tags.equipment' must contain only strings`
        );
      }
      if (!ALLOWED_EQUIPMENT.includes(eq)) {
        throw new Error(
          `[${drillFolder}] invalid equipment '${eq}'. Allowed values: ${ALLOWED_EQUIPMENT.join(", ")}`
        );
      }
    }
  }

  if (typeof tags.team_drill !== "undefined") {
    if (typeof tags.team_drill !== "string") {
      throw new Error(
        `[${drillFolder}] drill.yml field 'tags.team_drill' must be a string ('yes' or 'no')`
      );
    }
    if (!ALLOWED_TEAM_DRILL.includes(tags.team_drill)) {
      throw new Error(
        `[${drillFolder}] invalid team_drill '${tags.team_drill}'. Allowed values: ${ALLOWED_TEAM_DRILL.join(", ")}`
      );
    }
  }

  if (typeof tags.game_situations !== "undefined" && !Array.isArray(tags.game_situations)) {
    throw new Error(
      `[${drillFolder}] drill.yml field 'tags.game_situations' must be an array of strings`
    );
  }
  if (Array.isArray(tags.game_situations)) {
    for (const concept of tags.game_situations) {
      if (typeof concept !== "string") {
        throw new Error(
          `[${drillFolder}] drill.yml field 'tags.game_situations' must contain only strings`
        );
      }
      if (!ALLOWED_GAME_SITUATIONS.includes(concept)) {
        throw new Error(
          `[${drillFolder}] invalid game_situation '${concept}'. Allowed values: ${ALLOWED_GAME_SITUATIONS.join(", ")}`
        );
      }
    }
  }

  // Validate video URL if present — must be a valid YouTube or Vimeo link
  if (d.video !== undefined && d.video !== null) {
    if (typeof d.video !== "string") {
      throw new Error(`[${drillFolder}] video must be a string URL`);
    }

    const isValidVideoUrl =
      YOUTUBE_WATCH_REGEX.test(d.video) ||
      YOUTUBE_SHORT_REGEX.test(d.video) ||
      VIMEO_REGEX.test(d.video);

    if (!isValidVideoUrl) {
      throw new Error(
        `[${drillFolder}] invalid video URL '${d.video}'. Must be a valid YouTube ` +
          `(https://www.youtube.com/watch?v=... or https://youtu.be/...) ` +
          `or Vimeo (https://vimeo.com/...) URL`
      );
    }
  }

  // Validate drill_creation_date (required)
  if (!d.drill_creation_date || typeof d.drill_creation_date !== "string") {
    throw new Error(
      `[${drillFolder}] drill.yml missing required field 'drill_creation_date' (string in YYYY-MM-DD format)`
    );
  }

  // Validate date format and calendar validity
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(d.drill_creation_date)) {
    throw new Error(
      `[${drillFolder}] drill_creation_date must be in YYYY-MM-DD format (e.g., 2024-01-15)`
    );
  }

  // Round-trip check to catch invalid dates like 2024-02-31
  const creationDate = new Date(d.drill_creation_date);
  if (Number.isNaN(creationDate.getTime())) {
    throw new Error(
      `[${drillFolder}] drill_creation_date '${d.drill_creation_date}' is not a valid calendar date`
    );
  }
  if (creationDate.toISOString().slice(0, 10) !== d.drill_creation_date) {
    throw new Error(
      `[${drillFolder}] drill_creation_date '${d.drill_creation_date}' is not a valid calendar date`
    );
  }

  // Validate drill_updated_date (optional, but must be valid if present)
  if (d.drill_updated_date) {
    if (typeof d.drill_updated_date !== "string") {
      throw new Error(`[${drillFolder}] drill_updated_date must be a string in YYYY-MM-DD format`);
    }

    if (!dateRegex.test(d.drill_updated_date)) {
      throw new Error(
        `[${drillFolder}] drill_updated_date must be in YYYY-MM-DD format (e.g., 2024-01-15)`
      );
    }

    // Round-trip check for updated date
    const updatedDate = new Date(d.drill_updated_date);
    if (Number.isNaN(updatedDate.getTime())) {
      throw new Error(
        `[${drillFolder}] drill_updated_date '${d.drill_updated_date}' is not a valid calendar date`
      );
    }
    if (updatedDate.toISOString().slice(0, 10) !== d.drill_updated_date) {
      throw new Error(
        `[${drillFolder}] drill_updated_date '${d.drill_updated_date}' is not a valid calendar date`
      );
    }

    // Ensure drill_updated_date is not earlier than drill_creation_date
    if (updatedDate < creationDate) {
      throw new Error(
        `[${drillFolder}] drill_updated_date '${d.drill_updated_date}' cannot be earlier than drill_creation_date '${d.drill_creation_date}'`
      );
    }
  }

  return true;
}

export const onCreateWebpackConfig: GatsbyNode["onCreateWebpackConfig"] = ({ actions }) => {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.md$/,
          type: "asset/source",
        },
      ],
    },
  });
};

export const onPreBootstrap: GatsbyNode["onPreBootstrap"] = () => {
  console.log("── [onPreBootstrap] Syncing drill assets to static/drills ──");
  const drillsSource = path.resolve(__dirname, "drills");
  const drillsDestination = path.resolve(__dirname, "static/drills");

  // Remove stale destination so the copy is always clean
  if (fs.existsSync(drillsDestination)) {
    console.log("  🧹 Removing stale static/drills directory...");
    fs.rmSync(drillsDestination, { recursive: true, force: true });
  }

  // Copy the entire drills folder into static/ using the native Node.js API
  if (fs.existsSync(drillsSource)) {
    fs.cpSync(drillsSource, drillsDestination, { recursive: true });
    console.log("  ✓ Drill assets copied to static/drills");
  } else {
    console.warn("  ⚠️  drills/ source directory not found — no assets copied");
  }
};

function loadDrillsFromDirectory(
  drillsDir: string
): Array<{ folder: string; drillData: DrillData }> {
  if (!fs.existsSync(drillsDir)) {
    return [];
  }

  const drillFolders = fs.readdirSync(drillsDir).filter((item) => {
    const itemPath = path.join(drillsDir, item);
    return fs.statSync(itemPath).isDirectory();
  });

  const drills: Array<{ folder: string; drillData: DrillData }> = [];

  for (const folder of drillFolders) {
    const drillPath = path.join(drillsDir, folder);
    const ymlPath = path.join(drillPath, "drill.yml");

    if (fs.existsSync(ymlPath)) {
      const ymlContent = fs.readFileSync(ymlPath, "utf8");
      const rawData = yaml.load(ymlContent, { schema: yaml.FAILSAFE_SCHEMA });
      validateDrillData(rawData, folder);
      drills.push({ folder, drillData: rawData as DrillData });
    }
  }

  return drills;
}

/**
 * Returns the drill list for the given directory, loading from disk only once per
 * build process.  The cache is intentionally module-scoped so that createPages and
 * sourceNodes — which both need the same data — share a single read pass.
 */
function getOrLoadDrills(drillsDir: string): Array<{ folder: string; drillData: DrillData }> {
  if (_drillsCache === null) {
    _drillsCache = loadDrillsFromDirectory(drillsDir);
    console.log(`  ✓ Loaded ${_drillsCache.length} drill(s) from ${drillsDir}`);
  }
  return _drillsCache;
}

export const createPages: GatsbyNode["createPages"] = async ({ actions }) => {
  console.log("── [createPages] Generating drill pages ──");
  const { createPage } = actions;

  const drillsDir = path.resolve(__dirname, "drills");

  if (!fs.existsSync(drillsDir)) {
    console.warn("  ⚠️  drills/ directory does not exist — no drill pages will be generated.");
    return;
  }

  let drills: Array<{ folder: string; drillData: DrillData }>;
  try {
    drills = getOrLoadDrills(drillsDir);
  } catch (error) {
    console.error(
      `  ✗ Error loading drills:`,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }

  for (const { folder, drillData } of drills) {
    const pageEstimate = estimateDrillPdfPages(drillData);
    const fitsOnOneMainPageWithFullWidthLayout = shouldUseFullWidthFirstPageDiagram(drillData);
    const progressionsAlreadySplitToDedicatedPages = shouldPlaceProgressionsOnSecondPage(drillData);
    if (
      pageEstimate.mainContentPages > 1 &&
      !fitsOnOneMainPageWithFullWidthLayout &&
      !progressionsAlreadySplitToDedicatedPages
    ) {
      console.warn(
        `  ⚠️  PDF size warning: drill '${folder}' ("${drillData.name}") has non-progression content estimated to need ${pageEstimate.mainContentPages} page(s) even with the full-width first-page layout. Consider shortening content to reduce overflow risk.`
      );
    }

    createPage({
      path: `/drills/${folder}`,
      component: path.resolve("./src/templates/drill.tsx"),
      context: {
        slug: folder,
        drillData,
        drillFolder: folder,
      },
    });
  }
  console.log(`  ✓ Created ${drills.length} drill page(s)`);
};

export const sourceNodes: GatsbyNode["sourceNodes"] = async ({
  actions,
  createNodeId,
  createContentDigest,
}) => {
  console.log("── [sourceNodes] Adding drill nodes to GraphQL ──");
  const { createNode } = actions;

  const drillsDir = path.resolve(__dirname, "drills");
  let drills: Array<{ folder: string; drillData: DrillData }>;
  try {
    drills = getOrLoadDrills(drillsDir);
  } catch (error) {
    console.error(
      `  ✗ Error loading drills for GraphQL:`,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }

  for (const { folder, drillData } of drills) {
    try {
      const nodeData = {
        slug: folder,
        name: drillData.name,
        description: drillData.description,
        drill_steps: drillData.drill_steps,
        coaching_focus_points: drillData.coaching_focus_points,
        shooter_focus_points: drillData.shooter_focus_points,
        drill_progressions: drillData.drill_progressions,
        drill_image: drillData.drill_image,
        video: drillData.video,
        drill_creation_date: drillData.drill_creation_date,
        drill_updated_date: drillData.drill_updated_date,
        tags: drillData.tags,
      };

      createNode({
        ...nodeData,
        id: createNodeId(`Drill-${folder}`),
        parent: null,
        children: [],
        internal: {
          type: "Drill",
          contentDigest: createContentDigest(nodeData),
        },
      });
    } catch (error) {
      console.error(
        `  ✗ Error processing drill '${folder}' for GraphQL:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  console.log(`  ✓ Sourced ${drills.length} drill node(s) into GraphQL`);
};
