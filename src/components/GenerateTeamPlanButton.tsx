import * as React from "react"
import { jsPDF } from "jspdf"
import Logo from "./Logo"

type AgeGroup = "8u" | "10u" | "12u" | "14u+"
type SkillLevel = "beginner" | "intermediate" | "advanced"

export default function GenerateTeamPlanButton() {
  const [showModal, setShowModal] = React.useState<boolean>(false)
  const [teamName, setTeamName] = React.useState<string>("")
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [ageGroup, setAgeGroup] = React.useState<string>("")
  const [skillLevel, setSkillLevel] = React.useState<string>("")
  const [numberOfPractices, setNumberOfPractices] = React.useState<string>("")
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false)

  const ageGroups: AgeGroup[] = ["8u", "10u", "12u", "14u+"]
  const skillLevels: SkillLevel[] = ["beginner", "intermediate", "advanced"]

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      setSelectedImage(file)
    }
  }

  const validateInputs = (): boolean => {
    if (!teamName.trim()) {
      alert('Please enter a team name')
      return false
    }

    if (!ageGroup) {
      alert('Please select an age group')
      return false
    }

    if (!skillLevel) {
      alert('Please select an experience level')
      return false
    }

    if (!numberOfPractices.trim()) {
      alert('Please enter the number of practices')
      return false
    }

    const practicesNum = parseInt(numberOfPractices, 10)
    if (isNaN(practicesNum) || practicesNum < 0 || practicesNum > 50) {
      alert('Number of practices must be a whole number between 0 and 50')
      return false
    }

    return true
  }

  const generatePDF = async () => {
    if (!validateInputs()) {
      return
    }

    setIsGenerating(true)

    try {
      const doc = new jsPDF()
      const practicesNum = parseInt(numberOfPractices, 10)
      
      // Add title page
      doc.setFontSize(24)
      doc.text(`${teamName}`, 105, 30, { align: "center" })
      doc.setFontSize(18)
      doc.text("Team-Level Goaltending Development Plan", 105, 45, { align: "center" })
      
      // Add team logo if provided
      if (selectedImage && imagePreview) {
        try {
          const imgData = imagePreview
          doc.addImage(imgData, 'JPEG', 65, 55, 80, 80)
        } catch (error) {
          console.error('Error adding image to PDF:', error)
        }
      }
      
      // Add metadata
      doc.setFontSize(12)
      const metadataY = selectedImage ? 145 : 60
      doc.text(`Age Group: ${ageGroup}`, 20, metadataY)
      doc.text(`Experience Level: ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}`, 20, metadataY + 10)
      doc.text(`Number of Practices: ${practicesNum}`, 20, metadataY + 20)
      
      // Add season overview
      doc.setFontSize(16)
      doc.text("Season Overview", 20, metadataY + 40)
      doc.setFontSize(11)
      doc.text("This team-level development plan provides structured goaltending drills", 20, metadataY + 50)
      doc.text("and practice guidance throughout the season. Each practice includes", 20, metadataY + 58)
      doc.text("age-appropriate exercises designed to develop fundamental goaltending skills.", 20, metadataY + 66)
      
      // Add development goals section
      doc.setFontSize(14)
      doc.text("Key Development Goals", 20, metadataY + 82)
      doc.setFontSize(10)
      const goals = [
        "- Improve positioning and angle management",
        "- Develop butterfly technique and recovery",
        "- Enhance glove and blocker skills",
        "- Build confidence in game situations",
        "- Foster communication with teammates"
      ]
      let goalY = metadataY + 90
      goals.forEach(goal => {
        doc.text(goal, 25, goalY)
        goalY += 7
      })
      
      // Add new page for practice plans
      doc.addPage()
      doc.setFontSize(18)
      doc.text("Practice Plans", 105, 20, { align: "center" })
      
      // Generate practice plan sections
      let currentY = 35
      const pageHeight = doc.internal.pageSize.height
      
      for (let i = 1; i <= practicesNum; i++) {
        // Check if we need a new page
        if (currentY > pageHeight - 60) {
          doc.addPage()
          currentY = 20
        }
        
        doc.setFontSize(14)
        doc.text(`Practice ${i}`, 20, currentY)
        doc.setFontSize(10)
        currentY += 8
        
        doc.text("Focus: [Placeholder - specific skill focus]", 25, currentY)
        currentY += 6
        doc.text("Drill 1: [Placeholder - drill name and description]", 25, currentY)
        currentY += 6
        doc.text("Drill 2: [Placeholder - drill name and description]", 25, currentY)
        currentY += 6
        doc.text("Drill 3: [Placeholder - drill name and description]", 25, currentY)
        currentY += 6
        doc.text("Coaching Points: [Placeholder - key teaching points]", 25, currentY)
        currentY += 12
      }
      
      // Add final page with notes
      doc.addPage()
      doc.setFontSize(16)
      doc.text("Additional Resources and Notes", 20, 20)
      doc.setFontSize(11)
      doc.text("Progress Tracking:", 20, 35)
      doc.setFontSize(10)
      doc.text("Monitor goaltender development throughout the season. Regular feedback", 25, 43)
      doc.text("and positive reinforcement are crucial for youth player development.", 25, 50)
      
      // Save the PDF
      const fileName = `${teamName.replace(/[<>:"/\\|?*]/g, '_')}_Team_Development_Plan.pdf`
      doc.save(fileName)
      
      // Close modal and reset form
      setShowModal(false)
      setTeamName("")
      setSelectedImage(null)
      setImagePreview(null)
      setAgeGroup("")
      setSkillLevel("")
      setNumberOfPractices("")
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('There was an error generating the PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105"
      >
        Generate Team-Level Development Plan
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
              <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400">
                Generate Team Plan
              </h2>
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
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white"
                placeholder="Enter your team name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="teamImage" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Team/Club Logo (Optional)
              </label>
              <input
                type="file"
                id="teamImage"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-usa-blue file:text-white hover:file:bg-blue-900 dark:file:bg-blue-600 dark:hover:file:bg-blue-700"
              />
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg border-2 border-gray-300 dark:border-gray-600"
                    style={{ maxHeight: '150px' }}
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="ageGroup" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Age Group
              </label>
              <select
                id="ageGroup"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select age group</option>
                {ageGroups.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="skillLevel" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Experience Level
              </label>
              <select
                id="skillLevel"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select experience level</option>
                {skillLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="numberOfPractices" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Number of Practices (0-50)
              </label>
              <input
                type="number"
                id="numberOfPractices"
                value={numberOfPractices}
                onChange={(e) => setNumberOfPractices(e.target.value)}
                min="0"
                max="50"
                className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white"
                placeholder="Enter number (0-50)"
              />
            </div>

            <div className="flex gap-4">
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
                onClick={() => {
                  setShowModal(false)
                  setTeamName("")
                  setSelectedImage(null)
                  setImagePreview(null)
                  setAgeGroup("")
                  setSkillLevel("")
                  setNumberOfPractices("")
                }}
                disabled={isGenerating}
                className="flex-1 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
