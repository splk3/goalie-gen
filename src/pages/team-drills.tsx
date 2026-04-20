import * as React from "react";
import { navigate } from "gatsby";
import UsaHockeyGoldBanner from "../components/UsaHockeyGoldBanner";

// Redirect page that navigates to goalie-drills with team_drill=yes filter
export default function TeamDrills() {
  React.useEffect(() => {
    // Redirect to goalie-drills page with team_drill filter
    navigate("/goalie-drills?team_drill=yes", { replace: true });
  }, []);

  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <p className="text-lg text-gray-700 dark:text-gray-300">Redirecting to team drills...</p>
      </div>
      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <UsaHockeyGoldBanner showCopyright showTerms />
        </div>
      </footer>
    </div>
  );
}
