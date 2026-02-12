import * as React from "react"
import { jsPDF } from "jspdf"
import { trackEvent } from "../utils/analytics"

interface DrillData {
  name: string
  description: string
  coaching_points: string[]
  images: string[]
  video?: string
  tags: {
    skill_level?: string[]
    team_drill?: string[]
    age_level?: string[]
    fundamental_skill?: string[]
    skating_skill?: string[]
    equipment?: string[]
  }
}

interface DownloadDrillPdfButtonProps {
  drillData: DrillData
  drillFolder: string
}

const formatTag = (tag: string): string => {
  return tag
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function DownloadDrillPdfButton({ drillData, drillFolder }: DownloadDrillPdfButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false)

  const generatePDF = async () => {
    setIsGenerating(true)

    try {
      const doc = new jsPDF()
      let currentY = 20

      // Add header with USA Hockey branding
      const pageWidth = doc.internal.pageSize.width
      
      // Title section
      doc.setFontSize(24)
      doc.setFont(undefined, 'bold')
      doc.text("DRILLS", pageWidth / 2, currentY, { align: "center" })
      currentY += 15

      // Drill name
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      const drillNameLines = doc.splitTextToSize(drillData.name, pageWidth - 40)
      doc.text(drillNameLines, 20, currentY)
      currentY += drillNameLines.length * 8 + 5

      // Age Group, Skill Level, Equipment
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      
      if (drillData.tags.age_level && drillData.tags.age_level.length > 0) {
        const ageText = `Age Group: ${drillData.tags.age_level.map(formatTag).join(', ')}`
        doc.text(ageText, 20, currentY)
        currentY += 6
      }
      
      if (drillData.tags.skill_level && drillData.tags.skill_level.length > 0) {
        const skillText = `Skill Level: ${drillData.tags.skill_level.map(formatTag).join(', ')}`
        doc.text(skillText, 20, currentY)
        currentY += 6
      }
      
      if (drillData.tags.equipment && drillData.tags.equipment.length > 0) {
        const equipmentText = `Equipment Needed: ${drillData.tags.equipment.map(formatTag).join(', ')}`
        doc.text(equipmentText, 20, currentY)
        currentY += 6
      }
      
      currentY += 5

      // Description section
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text("Description", 20, currentY)
      currentY += 8

      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      const descriptionLines = doc.splitTextToSize(drillData.description, pageWidth - 40)
      doc.text(descriptionLines, 20, currentY)
      currentY += descriptionLines.length * 5 + 8

      // Coaching Points section
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text("Coaching Points", 20, currentY)
      currentY += 8

      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      
      if (drillData.coaching_points && drillData.coaching_points.length > 0) {
        drillData.coaching_points.forEach((point) => {
          const pointLines = doc.splitTextToSize(`• ${point}`, pageWidth - 45)
          doc.text(pointLines, 25, currentY)
          currentY += pointLines.length * 5 + 2
        })
      }
      
      currentY += 5

      // Add images if there's space or add new page
      if (drillData.images && drillData.images.length > 0) {
        const pageHeight = doc.internal.pageSize.height
        
        for (let i = 0; i < drillData.images.length; i++) {
          // Check if we need a new page
          if (currentY > pageHeight - 80) {
            doc.addPage()
            currentY = 20
          }

          try {
            // Load image and add to PDF
            const imagePath = `/drills/${drillFolder}/${drillData.images[i]}`
            const imgWidth = pageWidth - 40
            const imgHeight = 60 // Fixed height for consistency
            
            // Note: In a real implementation, we would need to load the image properly
            // For now, we'll add a placeholder box
            doc.setDrawColor(200)
            doc.setFillColor(240, 240, 240)
            doc.rect(20, currentY, imgWidth, imgHeight, 'FD')
            doc.setFontSize(9)
            doc.text(`Drill diagram ${i + 1}`, pageWidth / 2, currentY + imgHeight / 2, { align: "center" })
            
            currentY += imgHeight + 8
          } catch (error) {
            console.error(`Error adding image ${i + 1}:`, error)
          }
        }
      }

      // Skills Focus section
      const pageHeight = doc.internal.pageSize.height
      if (currentY > pageHeight - 60) {
        doc.addPage()
        currentY = 20
      } else {
        currentY += 5
      }

      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text("Skills Focus", 20, currentY)
      currentY += 8

      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')

      if (drillData.tags.fundamental_skill && drillData.tags.fundamental_skill.length > 0) {
        doc.setFont(undefined, 'bold')
        doc.text("Fundamental Skills:", 20, currentY)
        doc.setFont(undefined, 'normal')
        currentY += 6
        
        drillData.tags.fundamental_skill.forEach((skill) => {
          doc.text(`• ${formatTag(skill)}`, 25, currentY)
          currentY += 5
        })
        currentY += 3
      }

      if (drillData.tags.skating_skill && drillData.tags.skating_skill.length > 0) {
        doc.setFont(undefined, 'bold')
        doc.text("Skating Skills:", 20, currentY)
        doc.setFont(undefined, 'normal')
        currentY += 6
        
        drillData.tags.skating_skill.forEach((skill) => {
          doc.text(`• ${formatTag(skill)}`, 25, currentY)
          currentY += 5
        })
      }

      // Generate PDF blob and download
      const fileName = `${drillData.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim().replace(/_+/g, '_')}.pdf`
      const blob = doc.output('blob')
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Track event
      trackEvent('download_drill_pdf', {
        drill_name: drillData.name,
        drill_folder: drillFolder
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please ensure your browser supports PDF generation and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className={`bg-usa-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors ${
        isGenerating ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isGenerating ? 'Generating...' : 'Download Drill'}
    </button>
  )
}
