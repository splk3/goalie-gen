/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

import type { GatsbyConfig } from 'gatsby'

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Goalie Gen`,
    siteUrl: `https://splk3.github.io`,
  },
  pathPrefix: `/goalie-gen`,
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
