import * as React from "react"
import { Link, graphql } from "gatsby"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"

interface DrillNode {
  slug: string
  name: string
  images: string[]
}

interface GoalieDrillsProps {
  data: {
    allDrill: {
      nodes: DrillNode[]
    }
  }
}

export default function GoalieDrills({ data }: GoalieDrillsProps) {
  const drills = data.allDrill.nodes.map(node => ({
    slug: node.slug,
    name: node.name,
    image: node.images && node.images.length > 0 ? node.images[0] : 'placeholder.png'
  }))

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {drills.map((drill) => (
            <div 
              key={drill.slug}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                <img
                  src={`/drills/${drill.slug}/${drill.image}`}
                  alt={drill.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-usa-blue dark:text-blue-400 mb-4">
                  {drill.name}
                </h2>
                <Link
                  to={`/drills/${drill.slug}`}
                  className="inline-block bg-usa-blue hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors"
                >
                  View Drill
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/"
            className="text-usa-blue dark:text-blue-400 hover:underline text-lg font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}

export const Head = () => <Seo title="Goalie Drills" />

export const query = graphql`
  query GoalieDrillsPage {
    allDrill {
      nodes {
        slug
        name
        images
      }
    }
  }
`
