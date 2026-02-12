/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

import type { GatsbyConfig } from 'gatsby'

// Use environment variable to set site URL based on deployment
// Default to dev domain if GATSBY_SITE_URL is not set
const siteUrl = process.env.GATSBY_SITE_URL || 'https://goaliegen.com'

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Goalie Gen`,
    siteUrl: siteUrl,
    copyrightYear: new Date().getFullYear().toString(),
  },
  // pathPrefix is not needed when using a custom domain
  plugins: [
    `gatsby-plugin-typescript`,
    `gatsby-plugin-postcss`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Goalie Gen - Development Plans`,
        short_name: `Goalie Gen`,
        start_url: `/`,
        background_color: `#FFFFFF`,
        theme_color: `#002868`,
        display: `standalone`,
        icon: `static/favicons/android-chrome-512x512.png`,
        icons: [
          {
            src: `static/favicons/android-chrome-192x192.png`,
            sizes: `192x192`,
            type: `image/png`,
          },
          {
            src: `static/favicons/android-chrome-512x512.png`,
            sizes: `512x512`,
            type: `image/png`,
          },
        ],
      },
    },
  ],
}

export default config
