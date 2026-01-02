import * as React from "react"
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel } from "docx"
import { saveAs } from "file-saver"
import Logo from "./Logo"

export default function GeneratePlanButton() {
  const [showModal, setShowModal] = React.useState<boolean>(false)
  const [teamName, setTeamName] = React.useState<string>("")
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false)

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

  const optimizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Create canvas for image optimization
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          
          // Set maximum dimensions for print quality (300 DPI recommended)
          // A standard document width is ~6 inches, so 1800px provides good quality
          const maxWidth = 1800
          const maxHeight = 1800
          
          let width = img.width
          let height = img.height
          
          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to blob with good quality for print
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Could not create blob from canvas'))
              }
            },
            'image/jpeg',
            0.85 // 85% quality - good balance for print documents
          )
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const generateDocument = async () => {
    if (!teamName.trim()) {
      alert('Please enter a team name')
      return
    }

    if (!selectedImage) {
      alert('Please select an image')
      return
    }

    setIsGenerating(true)

    try {
      // Optimize image
      const optimizedImageBlob = await optimizeImage(selectedImage)
      const arrayBuffer = await optimizedImageBlob.arrayBuffer()

      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: `${teamName} - Goaltending Development Plan`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
              },
            }),

            // Team Logo
            new Paragraph({
              children: [
                new ImageRun({
                  data: arrayBuffer,
                  transformation: {
                    width: 400,
                    height: 400,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
              },
            }),

            // Introduction Section
            new Paragraph({
              text: "Introduction",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "[Insert introduction to the goaltending development plan here. Describe the purpose, goals, and overview of the program.]",
                  italics: true,
                }),
              ],
              spacing: {
                after: 300,
              },
            }),

            // Goals Section
            new Paragraph({
              text: "Season Goals",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "[List the primary goals for the goaltending program this season. Include both team and individual goaltender objectives.]",
                  italics: true,
                }),
              ],
              spacing: {
                after: 300,
              },
            }),

            // Training Schedule Section
            new Paragraph({
              text: "Training Schedule",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "[Outline the weekly/monthly training schedule. Include on-ice sessions, off-ice conditioning, and video review sessions.]",
                  italics: true,
                }),
              ],
              spacing: {
                after: 300,
              },
            }),

            // Skill Development Areas Section
            new Paragraph({
              text: "Skill Development Areas",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "[Detail the specific skills to focus on, such as:]",
                  italics: true,
                }),
              ],
              spacing: {
                after: 200,
              },
            }),
            new Paragraph({
              text: "Positioning and angles",
              bullet: {
                level: 0,
              },
              spacing: {
                after: 100,
              },
            }),
            new Paragraph({
              text: "Butterfly technique",
              bullet: {
                level: 0,
              },
              spacing: {
                after: 100,
              },
            }),
            new Paragraph({
              text: "Glove and blocker work",
              bullet: {
                level: 0,
              },
              spacing: {
                after: 100,
              },
            }),
            new Paragraph({
              text: "Rebound control",
              bullet: {
                level: 0,
              },
              spacing: {
                after: 100,
              },
            }),
            new Paragraph({
              text: "Communication",
              bullet: {
                level: 0,
              },
              spacing: {
                after: 100,
              },
            }),
            new Paragraph({
              text: "Mental preparation",
              bullet: {
                level: 0,
              },
              spacing: {
                after: 300,
              },
            }),

            // Equipment Section
            new Paragraph({
              text: "Equipment Requirements",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "[List required and recommended equipment for goaltenders, including sizing guidelines and maintenance tips.]",
                  italics: true,
                }),
              ],
              spacing: {
                after: 300,
              },
            }),

            // Progress Tracking Section
            new Paragraph({
              text: "Progress Tracking & Evaluation",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "[Describe how progress will be tracked and evaluated throughout the season. Include metrics, evaluation dates, and feedback mechanisms.]",
                  italics: true,
                }),
              ],
              spacing: {
                after: 300,
              },
            }),

            // Resources Section
            new Paragraph({
              text: "Additional Resources",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "[Provide links to videos, articles, or other resources that support goaltender development.]",
                  italics: true,
                }),
              ],
              spacing: {
                after: 300,
              },
            }),

            // Contact Information Section
            new Paragraph({
              text: "Contact Information",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "[Include contact information for coaching staff, training coordinators, and other relevant personnel.]",
                  italics: true,
                }),
              ],
            }),
          ],
        }],
      })

      // Generate and save document
      const blob = await Packer.toBlob(doc)
      // Sanitize filename by removing only characters that are invalid in file systems
      const fileName = `${teamName.replace(/[<>:"/\\|?*]/g, '_')}_Goaltending_Development_Plan.docx`
      saveAs(blob, fileName)

      // Close modal and reset form
      setShowModal(false)
      setTeamName("")
      setSelectedImage(null)
      setImagePreview(null)
    } catch (error) {
      console.error('Error generating document:', error)
      alert('There was an error generating the document. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-usa-red hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800 text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105"
      >
        Generate Goalie Development Plan
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
              <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400">
                Generate Development Plan
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

            <div className="mb-6">
              <label htmlFor="teamImage" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Team Logo/Image
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
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={generateDocument}
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
