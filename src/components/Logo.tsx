import * as React from "react"
import { withPrefix } from "gatsby"

interface LogoProps {
  variant?: 'full' | 'alt'
  className?: string
  width?: number
  height?: number
  format?: 'svg' | 'png'
}

/**
 * Logo component that displays the Goalie Gen logo with automatic dark mode support
 * @param {Object} props - Component props
 * @param {string} props.variant - Logo variant: 'full' (default) or 'alt' for alternate logo
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.width - Logo width in pixels (optional)
 * @param {number} props.height - Logo height in pixels (optional)
 * @param {string} props.format - Image format: 'svg' (default) or 'png'
 */
export default function Logo({ 
  variant = 'full', 
  className = '', 
  width, 
  height, 
  format = 'svg' 
}: LogoProps) {
  const logoPath = withPrefix(variant === 'alt' ? '/images/logo-alt' : '/images/logo')
  
  // Check if dark mode support is requested via className
  const isDarkModeAware = className.includes('dark-mode-aware')
  
  if (variant === 'alt' && isDarkModeAware) {
    // Use two images with Tailwind dark mode classes for alt variant
    return (
      <div className={className}>
        <img
          src={`${logoPath}-light.${format}`}
          alt="Goalie Gen - Development Plans"
          width={width}
          height={height}
          className="max-w-full h-auto block dark:hidden"
        />
        <img
          src={`${logoPath}-dark.${format}`}
          alt="Goalie Gen - Development Plans"
          width={width}
          height={height}
          className="max-w-full h-auto hidden dark:block"
        />
      </div>
    )
  }
  
  // Default: use dark variant for all modes
  const logoSuffix = '-dark'
  
  return (
    <img
      src={`${logoPath}${logoSuffix}.${format}`}
      alt="Goalie Gen - Development Plans"
      width={width}
      height={height}
      className={`max-w-full h-auto ${className}`}
    />
  )
}
