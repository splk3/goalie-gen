/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `Goalie Gen`,
    siteUrl: `https://splk3.github.io`,
  },
  pathPrefix: `/goalie-gen`,
  plugins: [
    `gatsby-plugin-postcss`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Goalie Gen - Development Plans`,
        short_name: `Goalie Gen`,
        start_url: `/`,
        background_color: `#FFFFFF`,
        theme_color: `#002868`,
        display: `standalone`,
        icon: `static/images/logo-alt-light.png`, // Use alternate logo as icon
        icons: [
          {
            src: `static/images/logo-alt-light.png`,
            sizes: `192x192`,
            type: `image/png`,
          },
          {
            src: `static/images/logo-alt-light.png`,
            sizes: `512x512`,
            type: `image/png`,
          },
        ],
      },
    },
  ],
}