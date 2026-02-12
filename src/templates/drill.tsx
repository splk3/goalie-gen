import * as React from 'react'
import { Link } from 'gatsby'
import Seo from '../components/SEO'
import Logo from '../components/Logo'
import DarkModeToggle from '../components/DarkModeToggle'

interface DrillPageContext {
  slug: string
  drillData: {
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
  drillFolder: string
}

interface DrillTemplateProps {
  pageContext: DrillPageContext
}

const formatTag = (tag: string): string => {
  return tag
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getVideoThumbnail = (videoUrl: string): string => {
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/
  const match = videoUrl.match(youtubeRegex)
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
  }
  return ''
}

export default function DrillTemplate({ pageContext }: DrillTemplateProps) {
  const { drillData, drillFolder } = pageContext

  const handlePrint = () => {
    window.print()
  }

  const videoThumbnail = drillData.video ? getVideoThumbnail(drillData.video) : ''

  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 transition-colors">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print:mb-6">
        <div className="flex justify-between items-center border-b-4 border-usa-red pb-4">
          <img 
            src="/images/usahockey/usahockey-goaltending.jpg" 
            alt="USA Hockey Goaltending"
            className="h-16 object-contain"
          />
          <h1 className="text-3xl font-bold text-usa-blue text-center">DRILLS</h1>
          <img 
            src="/images/usahockey/51-in-30.jpg" 
            alt="51 in 30 USA Hockey Goaltending"
            className="h-16 object-contain"
          />
        </div>
      </div>

      {/* Screen Header - Hidden when printing */}
      <header className="bg-usa-blue dark:bg-gray-800 text-usa-white py-6 print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/">
              <Logo variant="full" format="png" className="w-32 md:w-48 lg:w-64" />
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 print:py-0 print:px-0">
        {/* Drill Name */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-usa-blue dark:text-blue-400 print:text-usa-blue print:text-2xl print:mb-2">
            {drillData.name}
          </h1>
        </div>

        {/* Age Group, Skill Level, Equipment */}
        <div className="mb-6 print:mb-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {drillData.tags.age_level && drillData.tags.age_level.length > 0 && (
              <div>
                <span className="font-bold text-gray-700 dark:text-gray-300 print:text-gray-900">Age Group: </span>
                <span className="text-gray-600 dark:text-gray-400 print:text-gray-800">
                  {drillData.tags.age_level.map(formatTag).join(', ')}
                </span>
              </div>
            )}
            {drillData.tags.skill_level && drillData.tags.skill_level.length > 0 && (
              <div>
                <span className="font-bold text-gray-700 dark:text-gray-300 print:text-gray-900">Skill Level: </span>
                <span className="text-gray-600 dark:text-gray-400 print:text-gray-800">
                  {drillData.tags.skill_level.map(formatTag).join(', ')}
                </span>
              </div>
            )}
            {drillData.tags.equipment && drillData.tags.equipment.length > 0 && (
              <div>
                <span className="font-bold text-gray-700 dark:text-gray-300 print:text-gray-900">Equipment Needed: </span>
                <span className="text-gray-600 dark:text-gray-400 print:text-gray-800">
                  {drillData.tags.equipment.map(formatTag).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description, Coaching Points, and Images */}
        <div className="grid md:grid-cols-2 gap-8 mb-8 print:grid-cols-2 print:gap-4 print:mb-4">
          {/* Left Column: Description and Coaching Points */}
          <div>
            <div className="mb-6 print:mb-3">
              <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3 print:text-lg print:mb-2 print:text-usa-blue">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line print:text-sm print:text-gray-900">
                {drillData.description}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3 print:text-lg print:mb-2 print:text-usa-blue">
                Coaching Points
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 print:text-sm print:text-gray-900">
                {drillData.coaching_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Images */}
          <div className="space-y-4 print:space-y-2">
            {drillData.images.map((image, index) => (
              <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden print:bg-white">
                <img
                  src={`/drills/${drillFolder}/${image}`}
                  alt={`Drill diagram ${index + 1}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Video Section - Hidden in print */}
        {drillData.video && (
          <div className="mb-8 print:hidden">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
              Video Demonstration
            </h2>
            <div className="flex items-center gap-4">
              {videoThumbnail && (
                <img
                  src={videoThumbnail}
                  alt="Video thumbnail"
                  className="w-32 h-24 object-cover rounded"
                />
              )}
              <a
                href={drillData.video}
                target="_blank"
                rel="noopener noreferrer"
                className="text-usa-blue dark:text-blue-400 hover:underline font-semibold"
              >
                Watch Video →
              </a>
            </div>
          </div>
        )}

        {/* Skills Focus Section */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 print:border-gray-400 print:pt-3">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4 print:text-lg print:mb-2 print:text-usa-blue">
            Skills Focus
          </h2>
          <div className="grid md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-3">
            {drillData.tags.fundamental_skill && drillData.tags.fundamental_skill.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 print:text-sm print:text-gray-900">
                  Fundamental Skills:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 print:text-sm print:text-gray-800">
                  {drillData.tags.fundamental_skill.map((skill, index) => (
                    <li key={index}>{formatTag(skill)}</li>
                  ))}
                </ul>
              </div>
            )}
            {drillData.tags.skating_skill && drillData.tags.skating_skill.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 print:text-sm print:text-gray-900">
                  Skating Skills:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 print:text-sm print:text-gray-800">
                  {drillData.tags.skating_skill.map((skill, index) => (
                    <li key={index}>{formatTag(skill)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Print and Back Buttons - Hidden in print */}
        <div className="mt-8 flex gap-4 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-usa-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Print Drill
          </button>
          <Link
            to="/goalie-drills"
            className="bg-usa-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ← Back to Drills
          </Link>
        </div>
      </main>
    </div>
  )
}

export const Head = ({ pageContext }: DrillTemplateProps) => (
  <Seo title={pageContext.drillData.name} />
)
