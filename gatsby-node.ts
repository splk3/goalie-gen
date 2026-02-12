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

export const onPreBootstrap: GatsbyNode['onPreBootstrap'] = () => {
  const drillsSource = path.resolve(__dirname, 'drills')
  const drillsDestination = path.resolve(__dirname, 'static/drills')
  
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
      const ymlContent = fs.readFileSync(ymlPath, 'utf8')
      const drillData = yaml.load(ymlContent, { schema: yaml.FAILSAFE_SCHEMA }) as DrillData
      
      createPage({
        path: `/drills/${folder}`,
        component: path.resolve('./src/templates/drill.tsx'),
        context: {
          slug: folder,
          drillData,
          drillFolder: folder,
        },
      })
    }
  }
}
