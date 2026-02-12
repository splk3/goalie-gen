import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"
import GenerateClubPlanButton from "../components/GenerateClubPlanButton"
import GenerateTeamPlanButton from "../components/GenerateTeamPlanButton"
import DownloadDrillButton from "../components/DownloadDrillButton"
import NavigationButton from "../components/NavigationButton"
import TermsPopup from "../components/TermsPopup"

export default function Home() {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          copyrightYear
        }
      }
    }
  `)

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
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4">Welcome</h2>
              <p className="text-lg">
                This website makes it easy for youth ice hockey teams and clubs to generate 
                customized goaltending development plans.
              </p>
            </div>
            <div className="flex-shrink-0">
              <DownloadDrillButton />
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border-2 border-usa-blue dark:border-blue-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3">For Organizations</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Tools and resources for managing club-wide goaltending development programs.
            </p>
            <div className="w-full px-4 flex flex-col gap-4 items-stretch">
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
            <div className="w-full px-4 flex flex-col gap-3 items-stretch">
              <GenerateTeamPlanButton variant="red" />
              <NavigationButton to="/goalie-drills?team_drill=yes" variant="red">
                Team Drills with Goalie Focus
              </NavigationButton>
              <NavigationButton to="/goalie-drills" variant="red">
                Goalie Drills
              </NavigationButton>
              <NavigationButton to="/coach-resources" variant="red">
                More Coach Resources
              </NavigationButton>
            </div>
          </div>
          
          <div className="border-2 border-usa-blue dark:border-blue-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3">For Goalies</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Resources and tools to support your goalie development journey.
            </p>
            <div className="w-full px-4 flex flex-col items-stretch">
              <NavigationButton to="/goalie-resources">
                Goalie Resources
              </NavigationButton>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© {data.site.siteMetadata.copyrightYear} Patrick Boyle, Katie Jablynski, and James Kujawski</p>
          <div className="mt-2">
            <TermsPopup />
          </div>
        </div>
      </footer>
    </div>
  )
}

export const Head = () => <Seo />
