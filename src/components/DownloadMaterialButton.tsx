import * as React from "react"
import { withPrefix } from "gatsby"
import { trackEvent } from "../utils/analytics"

interface DownloadMaterialButtonProps {
  title: string
  fileName: string
}

export default function DownloadMaterialButton({ title, fileName }: DownloadMaterialButtonProps) {
  const [downloadStatus, setDownloadStatus] = React.useState<string>("")

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = withPrefix(`/pdfs/${fileName}`)
    link.download = fileName
    link.setAttribute('aria-label', `Download ${title}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Announce download to screen readers
    setDownloadStatus(`Downloading ${title}`)
    setTimeout(() => setDownloadStatus(""), 3000)

    // Track event
    trackEvent('download_material', {
      file_name: fileName,
      title: title
    })
  }

  return (
    <>
      <button
        onClick={handleDownload}
        className="w-full bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-3 px-6 rounded-lg transition-colors transform hover:scale-105 shadow-lg"
        aria-label={`Download ${title}`}
      >
        {title}
      </button>
      {/* Screen reader announcement for download action */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {downloadStatus}
      </div>
    </>
  )
}
