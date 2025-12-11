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
  ],
}