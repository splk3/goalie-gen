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
    if (updatedDate.toISOString().slice(0, 10) !== data.drill_updated_date) {
      throw new Error(`[${drillFolder}] drill_updated_date '${data.drill_updated_date}' is not a valid calendar date`)
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
