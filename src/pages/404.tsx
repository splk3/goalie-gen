import * as React from "react"
import { Link } from "gatsby"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"
import UsaHockeyGoldBanner from "../components/UsaHockeyGoldBanner"

export default function NotFoundPage() {
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
        <div className="flex flex-col items-center text-center">
          <img
            src="/images/404.png"
            alt="A goalie taking a tumble — just like this page"
            className="max-w-sm w-full mb-8 rounded-lg"
          />
          <h1 className="text-6xl font-bold text-usa-blue dark:text-blue-400 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-8">
            The page you are looking for might have been removed, had its name changed,
            or is temporarily unavailable.
          </p>
          <Link
            to="/"
            className="bg-usa-blue dark:bg-blue-600 text-usa-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </main>

      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <UsaHockeyGoldBanner showCopyright showTerms />
        </div>
      </footer>
    </div>
  )
}

export const Head = () => (
  <Seo
    title="404: Page Not Found"
    description="The page you are looking for could not be found."
  />
)
