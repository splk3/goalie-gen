import * as React from "react"
import { Helmet } from "react-helmet"

/**
 * SEO component that handles metadata and favicons
 * @param {Object} props - Component props
 * @param {string} props.title - Page title (default: "Goalie Gen")
 * @param {string} props.description - Page description
 */
export default function SEO({ 
  title = "Goalie Gen - Development Plans", 
  description = "Generate customized goaltending development plans for youth ice hockey teams and clubs" 
}) {
  return (
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/images/logo-alt-light.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/images/logo-alt-light.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/images/logo-alt-light.png" />
      
      {/* Open Graph / Social Media */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="/images/logo-light.png" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="/images/logo-light.png" />
      
      {/* Theme color */}
      <meta name="theme-color" content="#002868" />
    </Helmet>
  )
}
