import * as React from "react";
import { Link } from "gatsby";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import ShareButton from "../components/ShareButton";

export default function GoalieEvals() {
  return (
    <PageLayout>
      <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">Goalie Evaluations</h1>
            <p className="text-lg">
              Evaluation forms and tools to help coaches assess and develop goaltenders.
            </p>
          </div>
          <div className="flex-shrink-0">
            <ShareButton
              label="Share"
              className="inline-flex items-center gap-2 justify-center rounded-md bg-white px-4 py-2 font-semibold text-usa-red transition-colors hover:bg-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
            About Goalie Evaluations
          </h2>
          <div className="text-gray-700 dark:text-gray-300 space-y-4">
            <p>
              Structured evaluations are a key part of goaltender development. These forms help
              coaches provide consistent, objective feedback to goalies at camps, tryouts, and
              throughout the season.
            </p>
            <p>
              Use the camp evaluation forms to give goalies detailed feedback they can take home and
              work on. Use the tryout evaluation form to record assessments during tryouts — this
              form is intended for coach and evaluator use only and is not meant to be shared
              directly with goalies.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
            Goalie Camp Evaluation Forms
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            These forms are designed to evaluate goalies at camps and can be shared with goalies and
            their families.
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
            This multi-page form is for evaluators and coaches to assess goalies during tryouts. It
            is intended for coach use only and is not meant to be shared with goalies.
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
            className="inline-flex items-center gap-2 bg-usa-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

export const Head = () => <Seo title="Goalie Evaluations" />;
