import type { GatsbyNode } from 'gatsby'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

interface DrillData {
  name: string
  description: string
  coaching_points: string[]
  images: string[]
  video?: string
  drill_creation_date: string
  drill_updated_date?: string
  tags: {
    skill_level?: string[]
    team_drill?: string[]
    age_level?: string[]
    fundamental_skill?: string[]
    skating_skill?: string[]
    equipment?: string[]
  }
}

// Helper function to recursively copy directory
function copyDirectorySync(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// Helper function to recursively delete directory
function deleteDirectorySync(dir: string) {
  if (fs.existsSync(dir)) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        deleteDirectorySync(fullPath)
      } else {
        fs.unlinkSync(fullPath)
      }
    }
    
    fs.rmdirSync(dir)
  }
}

// Allowed tag values for validation
const ALLOWED_FUNDAMENTAL_SKILLS = [
  'skating',
  'positioning',
  'stance',
  'save_selection',
  'rebound_control',
  'recovery'
]

const ALLOWED_SKATING_SKILLS = [
  'butterfly',
  'power_push',
  'shuffle',
  't_push',
  'c_cut'
]

const ALLOWED_AGE_LEVELS = [
  '10U_below',
  '12U',
  '14U',
  '16U_and_older',
  'all'
]

const ALLOWED_SKILL_LEVELS = [
  'beginner',
  'intermediate',
  'advanced'
]

const ALLOWED_EQUIPMENT = [
  'blaze_pods',
  'bumpers',
  'cones',
  'goal',
  'ice_marker',
  'none'
]

const ALLOWED_TEAM_DRILL = ['yes', 'no']

// Valid video URL patterns — only YouTube and Vimeo are accepted, HTTPS only.
// Patterns are intentionally restricted to formats that getEmbedUrl() (videoUtils.ts) can parse.
// YouTube watch: https://www.youtube.com/watch?v=VIDEO_ID — v= must be the first query parameter
const YOUTUBE_WATCH_REGEX = /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+([&#].*)?$/
// YouTube short URL: https://youtu.be/VIDEO_ID
const YOUTUBE_SHORT_REGEX = /^https:\/\/youtu\.be\/[\w-]+(\?.*)?$/
// Vimeo: https://vimeo.com/VIDEO_ID — numeric ID only; player.vimeo.com not accepted as input
const VIMEO_REGEX = /^https:\/\/(www\.)?vimeo\.com\/\d+(\?.*)?$/

// Validate drill data structure
function validateDrillData(data: any, drillFolder: string): data is DrillData {
  if (!data || typeof data !== 'object') {
    throw new Error(`[${drillFolder}] drill.yml must contain an object`)
  }

  if (!data.name || typeof data.name !== 'string') {
    throw new Error(`[${drillFolder}] drill.yml missing required field 'name' (string)`)
  }

  if (!data.description || typeof data.description !== 'string') {
    throw new Error(`[${drillFolder}] drill.yml missing required field 'description' (string)`)
  }

  if (!Array.isArray(data.coaching_points)) {
    throw new Error(`[${drillFolder}] drill.yml missing required field 'coaching_points' (array)`)
  }

  if (!Array.isArray(data.images)) {
    throw new Error(`[${drillFolder}] drill.yml missing required field 'images' (array)`)
  }

  if (!data.tags || typeof data.tags !== 'object') {
    throw new Error(`[${drillFolder}] drill.yml missing required field 'tags' (object)`)
  }

  // Validate tag fields against allowed lists (fundamental_skill, skating_skill, age_level, skill_level, equipment, team_drill)
  if (typeof data.tags.fundamental_skill !== 'undefined' && !Array.isArray(data.tags.fundamental_skill)) {
    throw new Error(`[${drillFolder}] drill.yml field 'tags.fundamental_skill' must be an array of strings`)
  }
  if (Array.isArray(data.tags.fundamental_skill)) {
    for (const skill of data.tags.fundamental_skill) {
      if (!ALLOWED_FUNDAMENTAL_SKILLS.includes(skill)) {
        throw new Error(`[${drillFolder}] invalid fundamental_skill '${skill}'. Allowed values: ${ALLOWED_FUNDAMENTAL_SKILLS.join(', ')}`)
      }
    }
  }

  if (typeof data.tags.skating_skill !== 'undefined' && !Array.isArray(data.tags.skating_skill)) {
    throw new Error(`[${drillFolder}] drill.yml field 'tags.skating_skill' must be an array of strings`)
  }
  if (Array.isArray(data.tags.skating_skill)) {
    for (const skill of data.tags.skating_skill) {
      if (!ALLOWED_SKATING_SKILLS.includes(skill)) {
        throw new Error(`[${drillFolder}] invalid skating_skill '${skill}'. Allowed values: ${ALLOWED_SKATING_SKILLS.join(', ')}`)
      }
    }
  }

  if (typeof data.tags.age_level !== 'undefined' && !Array.isArray(data.tags.age_level)) {
    throw new Error(`[${drillFolder}] drill.yml field 'tags.age_level' must be an array of strings`)
  }
  if (Array.isArray(data.tags.age_level)) {
    for (const age of data.tags.age_level) {
      if (!ALLOWED_AGE_LEVELS.includes(age)) {
        throw new Error(`[${drillFolder}] invalid age_level '${age}'. Allowed values: ${ALLOWED_AGE_LEVELS.join(', ')}`)
      }
    }
  }

  if (typeof data.tags.skill_level !== 'undefined' && !Array.isArray(data.tags.skill_level)) {
    throw new Error(`[${drillFolder}] drill.yml field 'tags.skill_level' must be an array of strings`)
  }
  if (Array.isArray(data.tags.skill_level)) {
    for (const skill of data.tags.skill_level) {
      if (!ALLOWED_SKILL_LEVELS.includes(skill)) {
        throw new Error(`[${drillFolder}] invalid skill_level '${skill}'. Allowed values: ${ALLOWED_SKILL_LEVELS.join(', ')}`)
      }
    }
  }

  if (typeof data.tags.equipment !== 'undefined' && !Array.isArray(data.tags.equipment)) {
    throw new Error(`[${drillFolder}] drill.yml field 'tags.equipment' must be an array of strings`)
  }
  if (Array.isArray(data.tags.equipment)) {
    for (const eq of data.tags.equipment) {
      if (!ALLOWED_EQUIPMENT.includes(eq)) {
        throw new Error(`[${drillFolder}] invalid equipment '${eq}'. Allowed values: ${ALLOWED_EQUIPMENT.join(', ')}`)
      }
    }
  }

  if (typeof data.tags.team_drill !== 'undefined' && !Array.isArray(data.tags.team_drill)) {
    throw new Error(`[${drillFolder}] drill.yml field 'tags.team_drill' must be an array`)
  }
  if (Array.isArray(data.tags.team_drill)) {
    if (data.tags.team_drill.length !== 1) {
      throw new Error(`[${drillFolder}] 'tags.team_drill' must contain exactly one value ('yes' or 'no')`)
    }
    const tdValue = data.tags.team_drill[0]
    if (!ALLOWED_TEAM_DRILL.includes(tdValue)) {
      throw new Error(`[${drillFolder}] invalid team_drill '${tdValue}'. Allowed values: ${ALLOWED_TEAM_DRILL.join(', ')}`)
    }
  }

  // Validate video URL if present — must be a valid YouTube or Vimeo link
  if (data.video !== undefined && data.video !== null) {
    if (typeof data.video !== 'string') {
      throw new Error(`[${drillFolder}] video must be a string URL`)
    }

    const isValidVideoUrl =
      YOUTUBE_WATCH_REGEX.test(data.video) ||
      YOUTUBE_SHORT_REGEX.test(data.video) ||
      VIMEO_REGEX.test(data.video)

    if (!isValidVideoUrl) {
      throw new Error(
        `[${drillFolder}] invalid video URL '${data.video}'. Must be a valid YouTube ` +
        `(https://www.youtube.com/watch?v=... or https://youtu.be/...) ` +
        `or Vimeo (https://vimeo.com/...) URL`
      )
    }
  }

  // Validate drill_creation_date (required)
  if (!data.drill_creation_date || typeof data.drill_creation_date !== 'string') {
    throw new Error(`[${drillFolder}] drill.yml missing required field 'drill_creation_date' (string in YYYY-MM-DD format)`)
  }

  // Validate date format and calendar validity
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(data.drill_creation_date)) {
    throw new Error(`[${drillFolder}] drill_creation_date must be in YYYY-MM-DD format (e.g., 2024-01-15)`)
  }

  // Round-trip check to catch invalid dates like 2024-02-31
  const creationDate = new Date(data.drill_creation_date)
  if (Number.isNaN(creationDate.getTime())) {
    throw new Error(`[${drillFolder}] drill_creation_date '${data.drill_creation_date}' is not a valid calendar date`)
  }
  if (creationDate.toISOString().slice(0, 10) !== data.drill_creation_date) {
    throw new Error(`[${drillFolder}] drill_creation_date '${data.drill_creation_date}' is not a valid calendar date`)
  }

  // Validate drill_updated_date (optional, but must be valid if present)
  if (data.drill_updated_date) {
    if (typeof data.drill_updated_date !== 'string') {
      throw new Error(`[${drillFolder}] drill_updated_date must be a string in YYYY-MM-DD format`)
    }

    if (!dateRegex.test(data.drill_updated_date)) {
      throw new Error(`[${drillFolder}] drill_updated_date must be in YYYY-MM-DD format (e.g., 2024-01-15)`)
    }

    // Round-trip check for updated date
    const updatedDate = new Date(data.drill_updated_date)
    if (Number.isNaN(updatedDate.getTime())) {
      throw new Error(`[${drillFolder}] drill_updated_date '${data.drill_updated_date}' is not a valid calendar date`)
    }
    if (updatedDate.toISOString().slice(0, 10) !== data.drill_updated_date) {
      throw new Error(`[${drillFolder}] drill_updated_date '${data.drill_updated_date}' is not a valid calendar date`)
    }

    // Ensure drill_updated_date is not earlier than drill_creation_date
    if (updatedDate < creationDate) {
      throw new Error(`[${drillFolder}] drill_updated_date '${data.drill_updated_date}' cannot be earlier than drill_creation_date '${data.drill_creation_date}'`)
    }
  }

  return true
}

export const onPreBootstrap: GatsbyNode['onPreBootstrap'] = () => {
  const drillsSource = path.resolve(__dirname, 'drills')
  const drillsDestination = path.resolve(__dirname, 'static/drills')
  
  // Clean the destination directory to remove stale files
  if (fs.existsSync(drillsDestination)) {
    console.log('🧹 Cleaning static/drills directory...')
    deleteDirectorySync(drillsDestination)
  }
  
  // Copy drills folder to static
  if (fs.existsSync(drillsSource)) {
    copyDirectorySync(drillsSource, drillsDestination)
    console.log('✓ Copied drill files to static/drills')
  }
}

export const createPages: GatsbyNode['createPages'] = async ({ actions }) => {
  const { createPage } = actions
  
  const drillsDir = path.resolve(__dirname, 'drills')
  
  if (!fs.existsSync(drillsDir)) {
    console.warn('Warning: drills directory does not exist. No drill pages will be generated.')
    return
  }
  
  const drillFolders = fs.readdirSync(drillsDir).filter(item => {
    const itemPath = path.join(drillsDir, item)
    return fs.statSync(itemPath).isDirectory()
  })
  
  for (const folder of drillFolders) {
    const drillPath = path.join(drillsDir, folder)
    const ymlPath = path.join(drillPath, 'drill.yml')
    
    if (fs.existsSync(ymlPath)) {
      try {
        const ymlContent = fs.readFileSync(ymlPath, 'utf8')
        const rawData = yaml.load(ymlContent, { schema: yaml.FAILSAFE_SCHEMA })
        
        // Validate the drill data structure
        validateDrillData(rawData, folder)
        const drillData = rawData as DrillData
        
        createPage({
          path: `/drills/${folder}`,
          component: path.resolve('./src/templates/drill.tsx'),
          context: {
            slug: folder,
            drillData,
            drillFolder: folder,
          },
        })
      } catch (error) {
        console.error(`Error processing drill '${folder}':`, error instanceof Error ? error.message : String(error))
        throw error // Fail the build with a clear error
      }
    }
  }
}

export const sourceNodes: GatsbyNode['sourceNodes'] = async ({
  actions,
  createNodeId,
  createContentDigest,
}) => {
  const { createNode } = actions
  
  const drillsDir = path.resolve(__dirname, 'drills')
  
  if (!fs.existsSync(drillsDir)) {
    return
  }
  
  const drillFolders = fs.readdirSync(drillsDir).filter(item => {
    const itemPath = path.join(drillsDir, item)
    return fs.statSync(itemPath).isDirectory()
  })
  
  for (const folder of drillFolders) {
    const drillPath = path.join(drillsDir, folder)
    const ymlPath = path.join(drillPath, 'drill.yml')
    
    if (fs.existsSync(ymlPath)) {
      try {
        const ymlContent = fs.readFileSync(ymlPath, 'utf8')
        const rawData = yaml.load(ymlContent, { schema: yaml.FAILSAFE_SCHEMA })
        
        validateDrillData(rawData, folder)
        const drillData = rawData as DrillData
        
        // Create a node for each drill
        const nodeData = {
          slug: folder,
          name: drillData.name,
          description: drillData.description,
          coaching_points: drillData.coaching_points,
          images: drillData.images,
          video: drillData.video,
          drill_creation_date: drillData.drill_creation_date,
          drill_updated_date: drillData.drill_updated_date,
          tags: drillData.tags,
        }
        
        createNode({
          ...nodeData,
          id: createNodeId(`Drill-${folder}`),
          parent: null,
          children: [],
          internal: {
            type: 'Drill',
            contentDigest: createContentDigest(nodeData),
          },
        })
      } catch (error) {
        console.error(`Error processing drill '${folder}' for GraphQL:`, error instanceof Error ? error.message : String(error))
      }
    }
  }
}
