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
    title: `Goaltending Development Plan Generator`,
    siteUrl: `https://splk3.github.io`,
  },
  pathPrefix: `/goaltending-development-plan-generator`,
  plugins: [
    `gatsby-plugin-postcss`,
  ],
}