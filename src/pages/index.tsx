import * as React from "react";
import { useStaticQuery, graphql } from "gatsby";
import Seo from "../components/SEO";
import Logo from "../components/Logo";
import DarkModeToggle from "../components/DarkModeToggle";
import HamburgerMenu from "../components/HamburgerMenu";
import GenerateClubPlanButton from "../components/GenerateClubPlanButton";
import GenerateTeamPlanButton from "../components/GenerateTeamPlanButton";
import GoalieJournalButton from "../components/GoalieJournalButton";
import INeedADrillButton from "../components/INeedADrillButton";
import NavigationButton from "../components/NavigationButton";
import TermsPopup from "../components/TermsPopup";
import FeedbackButton from "../components/FeedbackButton";
import UsaHockeyGoldBanner from "../components/UsaHockeyGoldBanner";
import ShareButton from "../components/ShareButton";

export default function Home() {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          copyrightYear
        }
      }
    }
  `);

  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 transition-colors">
      <header className="bg-usa-blue dark:bg-gray-800 text-usa-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <HamburgerMenu />
              <Logo variant="full" format="png" className="w-24 md:w-32 lg:w-48" />
            </div>
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
          <h2 className="text-2xl font-bold mb-4">Welcome</h2>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1 min-w-0">
              <UsaHockeyGoldBanner textClassName="text-base" />
            </div>
            <div className="flex-shrink-0 w-full lg:w-72 flex flex-col justify-center lg:justify-end gap-3">
              <INeedADrillButton className="w-full" />
              <ShareButton
                label="Share Goalie Gen"
                title="Goalie Gen — Goaltending Development Plans"
                className="inline-flex w-full items-center gap-2 justify-center rounded-md bg-white px-6 py-3 text-lg font-semibold text-usa-red transition-colors hover:bg-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="border-2 border-usa-blue dark:border-blue-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3">
              For Organizations
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Tools and resources for managing club-wide goaltending development programs.
            </p>
            <div className="w-full px-4 flex flex-col gap-4 items-stretch">
              <GenerateClubPlanButton />
              <NavigationButton to="/about-club-plans">About Club Plans</NavigationButton>
              <NavigationButton to="/club-resources">More Club Resources</NavigationButton>
            </div>
          </div>

          <div className="border-2 border-usa-red dark:border-red-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-red dark:text-red-400 mb-3">For Coaches</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Access drills, evaluation forms, and coaching resources for goalie development.
            </p>
            <div className="w-full px-4 flex flex-col gap-3 items-stretch">
              <GenerateTeamPlanButton variant="red" />
              <NavigationButton to="/about-team-plans" variant="red">
                About Team Plans
              </NavigationButton>
              <NavigationButton to="/goalie-drills?team_drill=yes" variant="red">
                Team Drills with Goalie Focus
              </NavigationButton>
              <NavigationButton to="/goalie-drills" variant="red">
                Goalie Drills
              </NavigationButton>
              <NavigationButton to="/goalie-evals" variant="red">
                Goalie Evaluations
              </NavigationButton>
              <NavigationButton to="/coach-resources" variant="red">
                More Coach Resources
              </NavigationButton>
            </div>
          </div>

          <div className="border-2 border-usa-blue dark:border-blue-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors">
            <h3 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-3">
              For Goalies
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Resources and tools to support your goalie development journey.
            </p>
            <div className="w-full px-4 flex flex-col gap-3 items-stretch">
              <GoalieJournalButton label="Generate Goalie Journal" />
              <NavigationButton to="/about-goalie-journals">About Goalie Journals</NavigationButton>
              <NavigationButton to="/goalie-resources">Goalie Resources</NavigationButton>
            </div>
          </div>
        </div>

        <div className="border-2 border-usa-red dark:border-red-400 p-6 rounded-lg bg-white dark:bg-gray-800 transition-colors mt-6">
          <h2 className="text-2xl font-bold text-usa-red dark:text-red-400 mb-4 text-center md:text-left">
            Goaltending Gold Project Information
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-stretch text-center">
              <NavigationButton to="/patrick-boyle-project" variant="red">
                Patrick Boyle's Project
              </NavigationButton>
              <p className="text-gray-700 dark:text-gray-300 mt-3 text-sm leading-relaxed">
                Creating a website and tools to help clubs, coaches, and goalies equip themselves
                for success in recruiting, developing, and retaining goalies while building a love
                for the position.
                <span className="block mt-2">
                  <a
                    href="mailto:patrick@goaliegen.com"
                    className="underline text-usa-blue dark:text-blue-400"
                  >
                    Contact Patrick
                  </a>
                </span>
              </p>
            </div>
            <div className="flex flex-col items-stretch text-center">
              <NavigationButton to="/katie-jablynski-project" variant="red">
                Katie Jablynski's Project
              </NavigationButton>
              <p className="text-gray-700 dark:text-gray-300 mt-3 text-sm leading-relaxed">
                Integrating Goalie Development into Team Practices and Drills.
                <span className="block mt-2">
                  <a
                    href="mailto:katie@goaliegen.com"
                    className="underline text-usa-blue dark:text-blue-400"
                  >
                    Contact Katie
                  </a>
                </span>
              </p>
            </div>
            <div className="flex flex-col items-stretch text-center">
              <NavigationButton to="/james-kujawski-project" variant="red">
                James Kujawski's Project
              </NavigationButton>
              <p className="text-gray-700 dark:text-gray-300 mt-3 text-sm leading-relaxed">
                Modernizing Goalie Drill Design using a constraints-led approach and flexible,
                progression and options-based adaptability.
                <span className="block mt-2">
                  <a
                    href="mailto:james@goaliegen.com"
                    className="underline text-usa-blue dark:text-blue-400"
                  >
                    Contact James
                  </a>
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col lg:flex-row items-center gap-6 w-full">
          <div className="w-full lg:flex-1 text-gray-700 dark:text-gray-300">
            <p>
              Drills and diagrams for this site are created and organized with CoachThem. CoachThem
              has generously sponsored the USA Hockey Goaltending Gold projects for Patrick Boyle,
              Katie Jablynski, and James Kujawski to enable the team to collaborate on drill design
              using CoachThem&apos;s digital drill drawing and design tools. For more information
              about CoachThem, visit{" "}
              <a
                href="https://coachthem.com/sports/ice-hockey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-usa-blue dark:hover:text-blue-400"
              >
                CoachThem.com
              </a>
            </p>
          </div>
          <div className="w-full lg:w-1/3">
            <a
              href="https://coachthem.com/sports/ice-hockey"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/coachthem/supported-by-ct.png"
                alt="Supported by CoachThem"
                className="w-full h-auto"
              />
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-start justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <img
                src="/images/logos/logo-alt-light-whitebg.png"
                alt="Goalie Gen"
                width={56}
                height={56}
                className="w-14 h-14 object-contain"
              />
            </div>
            <div>
              <p>
                © {data.site.siteMetadata.copyrightYear}{" "}
                <a href="mailto:patrick@goaliegen.com" className="underline">
                  Patrick Boyle
                </a>
                ,{" "}
                <a href="mailto:katie@goaliegen.com" className="underline">
                  Katie Jablynski
                </a>
                , and{" "}
                <a href="mailto:james@goaliegen.com" className="underline">
                  James Kujawski
                </a>
              </p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <TermsPopup />
                <FeedbackButton />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const Head = () => <Seo />;
