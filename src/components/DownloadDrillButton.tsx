import * as React from "react"
import { jsPDF } from "jspdf"
import Logo from "./Logo"
import { trackEvent } from "../utils/analytics"

type AgeGroup = "8u" | "10u" | "12u" | "14u+"
type SkillLevel = "beginner" | "intermediate" | "advanced"

export default function DownloadDrillButton() {
  const [showModal, setShowModal] = React.useState<boolean>(false)
  const [ageGroup, setAgeGroup] = React.useState<string>("")
  const [skillLevel, setSkillLevel] = React.useState<string>("")
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false)
  const [generatedBlob, setGeneratedBlob] = React.useState<Blob | null>(null)
  const [generatedFileName, setGeneratedFileName] = React.useState<string>("")

  const ageGroups: AgeGroup[] = ["8u", "10u", "12u", "14u+"]
  const skillLevels: SkillLevel[] = ["beginner", "intermediate", "advanced"]

  const generatePDF = () => {
    if (!ageGroup) {
      alert('Please select an age group')
      return
    }

    if (!skillLevel) {
      alert('Please select a skill level')
      return
    }

    setIsGenerating(true)

    try {
      // Create a new PDF document
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text("Goalie Drill", 105, 20, { align: "center" })
      
      // Add metadata
      doc.setFontSize(12)
      doc.text(`Age Group: ${ageGroup}`, 20, 40)
      doc.text(`Skill Level: ${skillLevel}`, 20, 50)
      
      // Add placeholder content
      doc.setFontSize(14)
      doc.text("Drill Name: [Placeholder Drill]", 20, 70)
      
      doc.setFontSize(11)
      doc.text("Objective:", 20, 85)
      doc.text("This is a placeholder drill. Future updates will provide specific drills", 20, 95)
      doc.text(`tailored to ${ageGroup} age group at ${skillLevel} skill level.`, 20, 105)
      
      doc.text("Description:", 20, 125)
      doc.text("This section will contain detailed instructions for the drill,", 20, 135)
      doc.text("including setup, execution, and coaching points.", 20, 145)
      
      doc.text("Equipment Needed:", 20, 165)
      doc.text("- Pucks", 20, 175)
      doc.text("- Cones", 20, 185)
      doc.text("- Goal", 20, 195)
      
      doc.text("Duration: [TBD]", 20, 215)
      
      doc.text("Coaching Tips:", 20, 235)
      doc.text("- Focus on proper technique", 20, 245)
      doc.text("- Encourage communication", 20, 255)
      doc.text("- Provide positive feedback", 20, 265)
      
      // Generate blob
      const fileName = `goalie_drill_${ageGroup}_${skillLevel}.pdf`
      const blob = doc.output('blob')
      
      // Store the blob and filename for download
      setGeneratedBlob(blob)
      setGeneratedFileName(fileName)

      // Track event
      trackEvent('download_drill', {
        age_group: ageGroup,
        skill_level: skillLevel
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('There was an error generating the PDF. Please try again.')
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
      trackEvent('drill_downloaded', {
        age_group: ageGroup,
        skill_level: skillLevel
      })
      
      // Close modal and reset form
      setShowModal(false)
      setAgeGroup("")
      setSkillLevel("")
      setGeneratedBlob(null)
      setGeneratedFileName("")
    }
  }

  const handleCancel = React.useCallback(() => {
    setShowModal(false)
    setAgeGroup("")
    setSkillLevel("")
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
        className="bg-usa-red hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800 text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105"
      >
        Download a Drill
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
            className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drill-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
              <h2 
                id="drill-modal-title"
                className="text-2xl font-bold text-usa-blue dark:text-blue-400"
              >
                Download a Goalie Drill
              </h2>
            </div>

            <div className="mb-4">
              <label htmlFor="ageGroup" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Age Group
              </label>
              <select
                id="ageGroup"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                disabled={!!generatedBlob}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select age group</option>
                {ageGroups.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="skillLevel" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Skill/Experience Level
              </label>
              <select
                id="skillLevel"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                disabled={!!generatedBlob}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select skill level</option>
                {skillLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {generatedBlob && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg text-sm">
                PDF generated successfully! Click Download to save it.
              </div>
            )}

            <div className="flex gap-4">
              {!generatedBlob ? (
                <>
                  <button
                    onClick={generatePDF}
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
