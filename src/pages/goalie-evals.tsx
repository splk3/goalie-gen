import * as React from "react"
import { Link } from "gatsby"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"
import DownloadMaterialButton from "../components/DownloadMaterialButton"
import UsaHockeyGoldBanner from "../components/UsaHockeyGoldBanner"

export default function GoalieEvals() {
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
          <h1 className="text-4xl font-bold mb-4">Goalie Evaluations</h1>
          <p className="text-lg">
            Evaluation forms and tools to help coaches assess and develop goaltenders.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
              About Goalie Evaluations
            </h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-4">
              <p>
                Structured evaluations are a key part of goaltender development. These forms help coaches
                provide consistent, objective feedback to goalies at camps, tryouts, and throughout the season.
              </p>
              <p>
                Use the camp evaluation forms to give goalies detailed feedback they can take home and work on.
                Use the tryout evaluation form to record assessments during tryouts — this form is intended
                for coach and evaluator use only and is not meant to be shared directly with goalies.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
              Goalie Camp Evaluation Forms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              These forms are designed to evaluate goalies at camps and can be shared with goalies and their families.
            </p>
            <div className="space-y-3">
              <DownloadMaterialButton
                title="Goalie Camp Evaluation Form – Hand Fillable"
                fileName="usah-goalie-camp-eval-form-printable.pdf"
                folder="eval-forms"
              />
              <DownloadMaterialButton
                title="Goalie Camp Evaluation Form – Type Fillable"
                fileName="usah-goalie-camp-eval-form-type-fill.xlsx"
                folder="eval-forms"
              />
              <DownloadMaterialButton
                title="Goalie Camp Evaluation Form – Completed Example"
                fileName="usah-goalie-camp-eval-form-completed-example.pdf"
                folder="eval-forms"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
              Tryout Evaluation Forms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This multi-page form is for evaluators and coaches to assess goalies during tryouts.
              It is intended for coach use only and is not meant to be shared with goalies.
            </p>
            <div className="space-y-3">
              <DownloadMaterialButton
                title="USAH Goalie Tryout Evaluation Form"
                fileName="usah-goalie-tryout-eval-coach-form-printable.pdf"
                folder="eval-forms"
              />
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

      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <UsaHockeyGoldBanner showCopyright showTerms />
        </div>
      </footer>
    </div>
  )
}

export const Head = () => <Seo title="Goalie Evaluations" />
