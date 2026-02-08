import * as React from "react"
import { Link } from "gatsby"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"
import ExternalLinkButton from "../components/ExternalLinkButton"

export default function ClubResources() {
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
          <h1 className="text-4xl font-bold mb-4">Club Resources</h1>
          <p className="text-lg">
            Resources and tools for managing club-wide goaltending development programs.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
              External Resources
            </h2>
            <div className="space-y-4">
              <ExternalLinkButton 
                href="https://www.usahockey.com/goaltending"
                trackingLabel="USA Hockey Goaltending Resources"
              >
                USA Hockey Goaltending Resources
              </ExternalLinkButton>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
              About Club Resources
            </h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-4">
              <p>
                This page is dedicated to providing resources for hockey clubs managing
                multiple teams and coordinating goaltending development across age groups.
              </p>
              <p>
                Additional content and tools will be added here in future updates to help
                club administrators create comprehensive goaltending programs.
              </p>
              <p className="font-semibold">
                Check back soon for more resources!
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

export const Head = () => <Seo title="Club Resources" />
