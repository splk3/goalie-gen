import * as React from "react"
import { jsPDF } from "jspdf"
import { withPrefix } from "gatsby"
import Logo from "./Logo"
import { trackEvent } from "../utils/analytics"

export default function GoalieJournalButton() {
  const [showModal, setShowModal] = React.useState<boolean>(false)
  const [goalieName, setGoalieName] = React.useState<string>("")
  const [teamName, setTeamName] = React.useState<string>("")
  const [selectedLogo, setSelectedLogo] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false)
  const [validationError, setValidationError] = React.useState<string>("")
  const [generatedBlob, setGeneratedBlob] = React.useState<Blob | null>(null)
  const [generatedFileName, setGeneratedFileName] = React.useState<string>("")

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setValidationError('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        setValidationError('Image file size must be less than 5MB')
        return
      }

      // Clear any previous errors
      setValidationError('')

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      setSelectedLogo(file)
    }
  }

  const getLogoAsBase64 = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (logoPreview) {
        // Reuse the already loaded logo preview data URL
        resolve(logoPreview)
        return
      }

      // Use default Goalie Gen logo
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        } else {
          console.error("GoalieJournalButton: Failed to obtain 2D canvas context for default logo. The journal will be generated without a logo.")
          resolve(null)
        }
      }
      img.onerror = () => {
        console.warn("GoalieJournalButton: Failed to load default logo. The journal will be generated without a logo.")
        resolve(null)
      }
      // Use the alt light logo as default with proper path prefix
      img.src = withPrefix('/images/logo-alt-light.png')
    })
  }

  const generateJournal = async () => {
    // Clear any previous errors
    setValidationError('')

    if (!goalieName.trim()) {
      setValidationError('Please enter a goalie name')
      return
    }

    if (!teamName.trim()) {
      setValidationError('Please enter a team name')
      return
    }

    setIsGenerating(true)

    try {
      const doc = new jsPDF()
      const currentYear = new Date().getFullYear()
      const season = `${currentYear}-${currentYear + 1}`
      
      // Get logo
      const logoBase64 = await getLogoAsBase64()

      // PAGE 1: Title/Cover Page
      doc.setFontSize(28)
      doc.text("Goalie Journal", 105, 40, { align: "center" })
      
      doc.setFontSize(18)
      doc.text(goalieName, 105, 60, { align: "center" })
      doc.text(teamName, 105, 75, { align: "center" })
      doc.text(`Season ${season}`, 105, 90, { align: "center" })
      
      // Add logo if available
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 75, 110, 60, 60)
        } catch (e) {
          console.error('Error adding logo:', e)
        }
      }

      // PAGE 2: Season Goals
      doc.addPage()
      doc.setFontSize(20)
      doc.text("Season Goals", 105, 20, { align: "center" })
      
      doc.setFontSize(12)
      doc.text("My goals for this season:", 20, 40)
      
      for (let i = 0; i < 8; i++) {
        const y = 55 + (i * 25)
        doc.text(`${i + 1}.`, 20, y)
        doc.line(30, y, 190, y)
        doc.line(30, y + 10, 190, y + 10)
      }

      // PAGES 3-8: Practice/Game Entry Pages (6 pages, 4 entries per page)
      for (let page = 0; page < 6; page++) {
        doc.addPage()
        doc.setFontSize(16)
        doc.text(`Practice & Game Log - Page ${page + 1}`, 105, 15, { align: "center" })
        
        const entriesPerPage = 4
        const entryHeight = 65
        
        for (let entry = 0; entry < entriesPerPage; entry++) {
          const startY = 25 + (entry * entryHeight)
          const entryNum = (page * entriesPerPage) + entry + 1
          
          // Entry box
          doc.setLineWidth(0.5)
          doc.rect(15, startY, 180, entryHeight - 2)
          
          doc.setFontSize(11)
          doc.setFont(undefined, 'bold')
          doc.text(`Entry ${entryNum}`, 20, startY + 7)
          doc.setFont(undefined, 'normal')
          
          // Date and opponent
          doc.setFontSize(9)
          doc.text("Date: _______________", 20, startY + 15)
          doc.text("□ Practice  □ Game", 80, startY + 15)
          doc.text("Opponent: _______________", 135, startY + 15)
          
          // Goals for practice/game
          doc.text("Goals for today:", 20, startY + 23)
          doc.line(20, startY + 29, 190, startY + 29)
          
          // Skills/Drills worked on
          doc.text("Skills/Drills:", 20, startY + 36)
          doc.line(20, startY + 42, 190, startY + 42)
          
          // Self-evaluation
          doc.text("Self-Evaluation:", 20, startY + 49)
          doc.line(20, startY + 55, 190, startY + 55)
        }
      }

      // PAGE 9: End of Season Review
      doc.addPage()
      doc.setFontSize(20)
      doc.text("End of Season Review", 105, 20, { align: "center" })
      
      doc.setFontSize(12)
      doc.text("What did I accomplish this season?", 20, 40)
      for (let i = 0; i < 4; i++) {
        doc.line(20, 50 + (i * 15), 190, 50 + (i * 15))
      }
      
      doc.text("What did I learn?", 20, 115)
      for (let i = 0; i < 3; i++) {
        doc.line(20, 125 + (i * 15), 190, 125 + (i * 15))
      }
      
      doc.text("Areas to improve:", 20, 175)
      for (let i = 0; i < 3; i++) {
        doc.line(20, 185 + (i * 15), 190, 185 + (i * 15))
      }
      
      doc.text("Goals for offseason/next season:", 20, 235)
      for (let i = 0; i < 3; i++) {
        doc.line(20, 245 + (i * 15), 190, 245 + (i * 15))
      }

      // Generate PDF blob
      const sanitizedName = goalieName
        .replace(/[<>:"/\\|?*]+/g, '_') // Replace invalid characters
        .replace(/^\.+|\.+$/g, '') // Remove leading/trailing periods
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim() || 'Goalie' // Fallback if empty after sanitization
      const fileName = `${sanitizedName}_Goalie_Journal_${season}.pdf`
      const blob = doc.output('blob')
      
      // Store the blob and filename for download
      setGeneratedBlob(blob)
      setGeneratedFileName(fileName)

      // Track event
      trackEvent('generate_journal', {
        team_name: teamName
      })
    } catch (error) {
      console.error('Error generating journal:', error)
      setValidationError('There was an error generating the journal. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (generatedBlob && generatedFileName) {
      // Create download link
      const url = URL.createObjectURL(generatedBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = generatedFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Track download event
      trackEvent('download_journal', {
        team_name: teamName
      })
      
      // Close modal and reset form
      setShowModal(false)
      setGoalieName("")
      setTeamName("")
      setSelectedLogo(null)
      setLogoPreview(null)
      setValidationError('')
      setGeneratedBlob(null)
      setGeneratedFileName("")
    }
  }

  const handleCancel = React.useCallback(() => {
    setShowModal(false)
    setGoalieName("")
    setTeamName("")
    setSelectedLogo(null)
    setLogoPreview(null)
    setValidationError('')
    setGeneratedBlob(null)
    setGeneratedFileName("")
  }, [])

  // Close modal when Escape key is pressed
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal && !isGenerating && !generatedBlob) {
        handleCancel()
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showModal, isGenerating, generatedBlob, handleCancel])

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-3 px-6 rounded-lg transition-colors transform hover:scale-105 shadow-lg"
      >
        Goalie Journal
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (!isGenerating && !generatedBlob) {
              handleCancel()
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
              <h2 
                id="journal-modal-title"
                className="text-2xl font-bold text-usa-blue dark:text-blue-400"
              >
                Generate Goalie Journal
              </h2>
            </div>

            <div className="mb-4">
              <label htmlFor="goalieName" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Goalie Name
              </label>
              <input
                type="text"
                id="goalieName"
                value={goalieName}
                onChange={(e) => setGoalieName(e.target.value)}
                disabled={!!generatedBlob}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter goalie name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="teamName" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={!!generatedBlob}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter team name"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="teamLogo" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Team Logo (optional)
              </label>
              <input
                type="file"
                id="teamLogo"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={!!generatedBlob}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-usa-blue file:text-white hover:file:bg-blue-900 dark:file:bg-blue-600 dark:hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {logoPreview && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="max-w-[150px] max-h-[150px] h-auto rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}
              {!logoPreview && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  If no logo is provided, the Goalie Gen logo will be used
                </p>
              )}
            </div>

            {validationError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm">
                {validationError}
              </div>
            )}

            {generatedBlob && !validationError && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg text-sm">
                Journal generated successfully! Click Download to save it.
              </div>
            )}

            <div className="flex gap-4">
              {!generatedBlob ? (
                <>
                  <button
                    onClick={generateJournal}
                    disabled={isGenerating}
                    className={`flex-1 bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors ${
                      isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isGenerating}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
