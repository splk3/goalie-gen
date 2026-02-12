import * as React from "react"
import { navigate } from "gatsby"

// Redirect page that navigates to goalie-drills with team_drill=yes filter
export default function TeamDrills() {
  React.useEffect(() => {
    // Redirect to goalie-drills page with team_drill filter
    navigate('/goalie-drills?team_drill=yes', { replace: true })
  }, [])

  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 flex items-center justify-center">
      <p className="text-lg text-gray-700 dark:text-gray-300">
        Redirecting to team drills...
      </p>
    </div>
  )
}
