import * as React from "react"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"
import GeneratePlanButton from "../components/GeneratePlanButton"
import GenerateTeamPlanButton from "../components/GenerateTeamPlanButton"
import DownloadDrillButton from "../components/DownloadDrillButton"
import DownloadMaterialButton from "../components/DownloadMaterialButton"
import GoalieJournalButton from "../components/GoalieJournalButton"

export default function Home() {
  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 transition-colors">
      <header className="bg-usa-blue dark:bg-gray-800 text-usa-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Logo variant="full" format="png" width={300} height={150} />
            <DarkModeToggle />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <Logo variant="alt" format="png" width={120} height={120} />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">Welcome</h2>
              <p className="text-lg">
                This website makes it easy for youth ice hockey teams and clubs to generate 
                customized goaltending development plans.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border-2 border-usa-blue dark:border-blue-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3">Customized Plans</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Generate development plans tailored to your goaltenders' skill levels and goals.
            </p>
            <div className="flex flex-col gap-4 items-center">
              <GeneratePlanButton />
              <GenerateTeamPlanButton />
            </div>
          </div>
          
          <div className="border-2 border-usa-red dark:border-red-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-red dark:text-red-400 mb-3">Goalie Drills</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Access a comprehensive library of goalie-specific drills and exercises.
            </p>
            <div className="flex justify-center">
              <DownloadDrillButton />
            </div>
          </div>
          
          <div className="border-2 border-usa-blue dark:border-blue-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3">Additional Materials</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Download useful forms and tools for goaltender development and tracking.
            </p>
            <div className="space-y-3">
              <DownloadMaterialButton 
                title="Goalie Evaluation Form" 
                fileName="goalie-evaluation-form.pdf" 
              />
              <DownloadMaterialButton 
                title="Single-Game Review Form" 
                fileName="goalie-single-game-review.pdf" 
              />
              <DownloadMaterialButton 
                title="Coach Z's Zone Map" 
                fileName="coach-z-zone-map.pdf" 
              />
              <GoalieJournalButton />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Goalie Gen</p>
        </div>
      </footer>
    </div>
  )
}

export const Head = () => <Seo />
