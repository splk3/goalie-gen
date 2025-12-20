/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/
 */

import React from "react"

/**
 * Add Google Analytics to every page
 */
export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    <script
      key="gtag-js"
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-SBH602WP1Z"
    />,
    <script
      key="gtag-config"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-SBH602WP1Z');
        `,
      }}
    />,
  ])
}
