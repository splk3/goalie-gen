import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

export interface DrillData {
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

export interface DrillInfo {
  slug: string
  data: DrillData
}

export function getAllDrills(): DrillInfo[] {
  const drillsDir = path.resolve(process.cwd(), 'drills')
  
  if (!fs.existsSync(drillsDir)) {
    return []
  }

  const drillFolders = fs.readdirSync(drillsDir).filter(item => {
    const itemPath = path.join(drillsDir, item)
    return fs.statSync(itemPath).isDirectory()
  })

  const drills: DrillInfo[] = []

  for (const folder of drillFolders) {
    const drillPath = path.join(drillsDir, folder)
    const ymlPath = path.join(drillPath, 'drill.yml')

    if (fs.existsSync(ymlPath)) {
      const ymlContent = fs.readFileSync(ymlPath, 'utf8')
      const drillData = yaml.load(ymlContent) as DrillData

      drills.push({
        slug: folder,
        data: drillData,
      })
    }
  }

  return drills
}
