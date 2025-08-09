import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Trip, Destination, Activity } from '../types'
import { format } from 'date-fns'

export class ExportService {
  async exportToPDF(trip: Trip, destinations: Destination[], activities: Record<string, Activity[]>): Promise<void> {
    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20

      // Title
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text(trip.name, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Trip details
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const tripDates = `${format(new Date(trip.start_date), 'MMM d, yyyy')} - ${format(new Date(trip.end_date), 'MMM d, yyyy')}`
      pdf.text(tripDates, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      if (trip.description) {
        pdf.text(trip.description, pageWidth / 2, yPosition, { align: 'center', maxWidth: pageWidth - 40 })
        yPosition += 15
      }

      // Destinations and activities
      for (const destination of destinations) {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage()
          yPosition = 20
        }

        // Destination header
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text(destination.name, 20, yPosition)
        yPosition += 10

        const destDates = `${format(new Date(destination.arrival_date), 'MMM d')} - ${format(new Date(destination.departure_date), 'MMM d')}`
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.text(destDates, 20, yPosition)
        yPosition += 15

        // Activities
        const destActivities = activities[destination.id] || []
        for (const activity of destActivities) {
          if (yPosition > pageHeight - 30) {
            pdf.addPage()
            yPosition = 20
          }

          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`• ${activity.title}`, 25, yPosition)
          yPosition += 8

          if (activity.description) {
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            const lines = pdf.splitTextToSize(activity.description, pageWidth - 60)
            pdf.text(lines, 30, yPosition)
            yPosition += lines.length * 5
          }

          // Activity details
          const details = []
          if (activity.start_time) details.push(`Time: ${activity.start_time}${activity.end_time ? ` - ${activity.end_time}` : ''}`)
          if (activity.location) details.push(`Location: ${activity.location}`)
          if (activity.price_estimate) details.push(`Est. Cost: $${activity.price_estimate}`)

          if (details.length > 0) {
            pdf.setFontSize(9)
            pdf.setTextColor(100)
            pdf.text(details.join(' | '), 30, yPosition)
            pdf.setTextColor(0)
            yPosition += 8
          }

          yPosition += 5
        }

        yPosition += 10
      }

      // Save the PDF
      pdf.save(`${trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.pdf`)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      throw new Error('Failed to export itinerary to PDF')
    }
  }

  async exportToJSON(trip: Trip, destinations: Destination[], activities: Record<string, Activity[]>): Promise<void> {
    try {
      const exportData = {
        trip,
        destinations,
        activities,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting to JSON:', error)
      throw new Error('Failed to export trip data')
    }
  }

  generateShareableLink(tripId: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/shared/${tripId}`
  }

  async shareTrip(trip: Trip): Promise<void> {
    try {
      if (navigator.share) {
        await navigator.share({
          title: trip.name,
          text: trip.description || `Check out my trip to ${trip.name}`,
          url: this.generateShareableLink(trip.id)
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(this.generateShareableLink(trip.id))
        // Show a better notification
        this.showNotification('Trip link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing trip:', error)
      // Fallback to manual copy
      this.copyToClipboardFallback(this.generateShareableLink(trip.id))
    }
  }

  private showNotification(message: string): void {
    // Create a temporary notification element
    const notification = document.createElement('div')
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
    `
    
    document.body.appendChild(notification)
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }

  private copyToClipboardFallback(text: string): void {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    
    try {
      document.execCommand('copy')
      this.showNotification('Trip link copied to clipboard!')
    } catch (error) {
      this.showNotification('Please copy the link manually: ' + text)
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

export const exportService = new ExportService()