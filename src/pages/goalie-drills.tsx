import * as React from "react"
import { Link } from "gatsby"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"

export default function GoalieDrills() {
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
          <h1 className="text-4xl font-bold mb-4">Goalie Drills</h1>
          <p className="text-lg">
            Hockey drills that incorporate the entire team while emphasizing goaltender development.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
              About Goalie Drills
            </h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-4">
              <p>
                This section will feature hockey drills that engage the entire team while
                providing focused development opportunities for goalies.
              </p>
              <p>
                These drills help goalies practice game-realistic situations while keeping
                all players active and engaged during practice.
              </p>
              <p>
                Categories will include:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Breakout drills with goalie participation</li>
                <li>Shooting drills with defensive pressure</li>
                <li>2-on-1 and 3-on-2 scenarios</li>
                <li>Rebound control exercises</li>
                <li>Cross-ice small-area games</li>
              </ul>
              <p className="font-semibold mt-6">
                Check back soon for comprehensive drill libraries!
              </p>
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

export const Head = () => <Seo title="Goalie Drills" />
