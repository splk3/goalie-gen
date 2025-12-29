import * as React from "react"

/**
 * Logo component that displays the Goalie Gen logo with automatic dark mode support
 * @param {Object} props - Component props
 * @param {string} props.variant - Logo variant: 'full' (default) or 'alt' for alternate logo
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.width - Logo width in pixels (optional)
 * @param {number} props.height - Logo height in pixels (optional)
 */
export default function Logo({ variant = 'full', className = '', width, height }) {
  const logoPath = variant === 'alt' ? '/images/logo-alt' : '/images/logo'
  
  return (
    <picture className={className}>
      {/* Dark mode logo */}
      <source
        srcSet={`${logoPath}-dark.png`}
        media="(prefers-color-scheme: dark)"
      />
      {/* Light mode logo (default) */}
      <img
        src={`${logoPath}-light.png`}
        alt="Goalie Gen - Development Plans"
        width={width}
        height={height}
        className="max-w-full h-auto"
      />
    </picture>
  )
}
