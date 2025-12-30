import * as React from "react"
import { Helmet } from "react-helmet"

/**
 * Seo component that handles metadata and favicons
 * @param {Object} props - Component props
 * @param {string} props.title - Page title (default: "Goalie Gen")
 * @param {string} props.description - Page description
 */
export default function Seo({ 
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
      <link rel="icon" type="image/x-icon" href="/favicons/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
      <link rel="manifest" href="/favicons/site.webmanifest" />
      
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
