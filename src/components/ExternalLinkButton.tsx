import * as React from "react"
import { trackEvent } from "../utils/analytics"

interface ExternalLinkButtonProps {
  href: string
  children: React.ReactNode
  className?: string
  trackingLabel?: string
}

export default function ExternalLinkButton({ href, children, className = "", trackingLabel }: ExternalLinkButtonProps) {
  const defaultClasses = "w-full bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-3 px-6 rounded-lg transition-colors transform hover:scale-105 shadow-lg inline-block text-center"
  
  const handleClick = () => {
    if (trackingLabel) {
      ;(trackEvent as (event: string, params?: unknown) => void)('external_link_click', {
        label: trackingLabel,
        url: href,
      })
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className || defaultClasses}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}
