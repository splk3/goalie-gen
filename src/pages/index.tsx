import * as React from "react"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"
import GenerateClubPlanButton from "../components/GenerateClubPlanButton"
import DownloadDrillButton from "../components/DownloadDrillButton"
import NavigationButton from "../components/NavigationButton"
import TermsPopup from "../components/TermsPopup"

export default function Home() {
  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 transition-colors">
      <header className="bg-usa-blue dark:bg-gray-800 text-usa-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Logo variant="full" format="png" className="w-32 md:w-48 lg:w-64" />
            <div className="hidden md:block flex-1 mx-4">
              <p className="text-lg md:text-xl lg:text-2xl font-semibold text-center">
                Where every coach is a goalie coach!
              </p>
            </div>
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
            <h3 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3">For Organizations</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Tools and resources for managing club-wide goaltending development programs.
            </p>
            <div className="flex flex-col gap-4 items-center">
              <GenerateClubPlanButton />
              <NavigationButton to="/club-resources">
                More Club Resources
              </NavigationButton>
            </div>
          </div>
          
          <div className="border-2 border-usa-red dark:border-red-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-red dark:text-red-400 mb-3">For Coaches</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Access drills, evaluation forms, and coaching resources for goalie development.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <DownloadDrillButton />
              <NavigationButton to="/coach-resources">
                More Coach Resources
              </NavigationButton>
              <NavigationButton to="/team-drills">
                Team Drills with Goalie Focus
              </NavigationButton>
              <NavigationButton to="/team-drills">
                Goalie Drills
              </NavigationButton>
            </div>
          </div>
          
          <div className="border-2 border-usa-blue dark:border-blue-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3">For Goalies</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Resources and tools to support your goalie development journey.
            </p>
            <div className="flex justify-center">
              <NavigationButton to="/goalie-resources">
                Goalie Resources
              </NavigationButton>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Patrick Boyle</p>
          <div className="mt-2">
            <TermsPopup />
          </div>
        </div>
      </footer>
    </div>
  )
}

export const Head = () => <Seo />
