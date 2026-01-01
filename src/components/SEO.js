import * as React from "react"
import { withPrefix } from "gatsby"

/**
 * Seo component that handles metadata for a page
 * This component should be used as a child of the Head export in a page component
 * @param {Object} props - Component props
 * @param {string} props.title - Page title (default: "Goalie Gen")
 * @param {string} props.description - Page description
 */
export default function Seo({ 
  title = "Goalie Gen - Development Plans", 
  description = "Generate customized goaltending development plans for youth ice hockey teams and clubs" 
}) {
  // For social media, we need absolute URLs including the site URL
  const siteUrl = "https://splk3.github.io"
  const imagePathWithPrefix = withPrefix("/images/logo-light.png")
  const socialImageUrl = `${siteUrl}${imagePathWithPrefix}`
  
  return (
    <>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Open Graph / Social Media */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={socialImageUrl} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImageUrl} />
      
      {/* Theme color */}
      <meta name="theme-color" content="#002868" />
    </>
  )
}
