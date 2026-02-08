import * as React from "react"
import { Link } from "gatsby"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"
import ExternalLinkButton from "../components/ExternalLinkButton"
import DownloadMaterialButton from "../components/DownloadMaterialButton"
import GoalieJournalButton from "../components/GoalieJournalButton"

export default function CoachResources() {
  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 transition-colors">
      <header className="bg-usa-blue dark:bg-gray-800 text-usa-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/">
              <Logo variant="full" format="png" className="w-32 md:w-48 lg:w-64" />
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
          <h1 className="text-4xl font-bold mb-4">Coach Resources</h1>
          <p className="text-lg">
            Essential tools and resources for coaching youth hockey goalies.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
              External Resources
            </h2>
            <div className="space-y-4">
              <ExternalLinkButton 
                href="https://www.usahockey.com/goaltendingplans"
                trackingLabel="USA Hockey Goalie Plans"
              >
                USA Hockey Goalie Plans
              </ExternalLinkButton>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
              Evaluation Forms
            </h2>
            <div className="space-y-3">
              <DownloadMaterialButton 
                title="Goalie Evaluation Form" 
                fileName="goalie-evaluation-form.pdf" 
              />
              <DownloadMaterialButton 
                title="Single-Game Review Form" 
                fileName="goalie-single-game-review.pdf" 
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
              Additional Tools
            </h2>
            <div className="space-y-3">
              <DownloadMaterialButton 
                title="Coach Z's Zone Map" 
                fileName="coach-z-zone-map.pdf" 
              />
              <GoalieJournalButton />
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link 
              to="/"
              className="text-usa-blue dark:text-blue-400 hover:underline text-lg font-semibold"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export const Head = () => <Seo title="Coach Resources" />
