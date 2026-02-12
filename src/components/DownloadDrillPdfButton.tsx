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

  const loadImageAsDataURL = (imagePath: string): Promise<{ dataURL: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0)
        
        try {
          const dataURL = canvas.toDataURL('image/png')
          resolve({ dataURL, width: img.width, height: img.height })
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imagePath}`))
      }
      
      img.src = imagePath
    })
  }

  const generatePDF = async () => {
    setIsGenerating(true)

    try {
      const doc = new jsPDF()
      let currentY = 20

      // Add header with USA Hockey branding
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      
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

      // Load and add drill diagrams
      if (drillData.images && drillData.images.length > 0) {
        doc.setTextColor(0)
        
        for (let i = 0; i < drillData.images.length; i++) {
          // Check if we need a new page
          if (currentY > pageHeight - 80) {
            doc.addPage()
            currentY = 20
          }

          try {
            const imagePath = `/drills/${drillFolder}/${drillData.images[i]}`
            const imageInfo = await loadImageAsDataURL(imagePath)
            
            // Calculate dimensions to fit within page width while preserving aspect ratio
            const maxWidth = pageWidth - 40
            const maxHeight = 80
            
            const aspectRatio = imageInfo.width / imageInfo.height
            let imgWidth = maxWidth
            let imgHeight = imgWidth / aspectRatio
            
            // If height exceeds max, scale down based on height
            if (imgHeight > maxHeight) {
              imgHeight = maxHeight
              imgWidth = imgHeight * aspectRatio
            }
            
            // Add image to PDF
            doc.addImage(imageInfo.dataURL, 'PNG', 20, currentY, imgWidth, imgHeight)
            currentY += imgHeight + 8
          } catch (error) {
            console.error(`Error adding image ${i + 1} (${drillData.images[i]}):`, error)
            // If image fails to load, add a note
            doc.setFontSize(9)
            doc.setTextColor(100)
            doc.text(`[Drill diagram ${i + 1} (${drillData.images[i]}) - unable to load]`, 20, currentY)
            currentY += 10
            doc.setTextColor(0)
          }
        }
      }

      currentY += 5

      // Skills Focus section
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
      const fileName = `${drillData.name.replace(/[<>:"/\\|?*]/g, '_')}.pdf`
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
      trackEvent('download_drill', {
        drill_name: drillData.name,
        age_group: drillData.tags.age_level?.join(', ') || '',
        skill_level: drillData.tags.skill_level?.join(', ') || ''
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
