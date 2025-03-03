"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AllPicturesModal } from "./all-pictures-modal"
import { RequestUsModal } from "./request-us-modal"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { addWatermark } from "@/app/actions"

interface ActionButtonsProps {
  currentImageUrl?: string
}

export function ActionButtons({ currentImageUrl }: ActionButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    if (!currentImageUrl) return

    try {
      setIsDownloading(true)
      const watermarkedImageBuffer = await addWatermark(currentImageUrl)
      
      if (!watermarkedImageBuffer || watermarkedImageBuffer.length === 0) {
        throw new Error('Received empty image buffer')
      }
      
      // Convert buffer to base64
      const base64Image = Buffer.from(watermarkedImageBuffer).toString('base64')
      
      // Create a data URL
      const dataUrl = `data:image/jpeg;base64,${base64Image}`
      
      // Check if we're on a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile) {
        // For mobile devices, create an image element and use the Web Share API
        const img = new Image()
        img.src = dataUrl
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
        
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        
        // Draw the image
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get canvas context')
        ctx.drawImage(img, 0, 0)
        
        // Convert canvas to blob with maximum quality
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
          }, 'image/jpeg', 1.0)
        })
        
        // Use Web Share API if available
        if (navigator.share) {
          // Create a new File from the blob with explicit MIME type
          const file = new File([blob], 'zine-photo.jpg', { 
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          
          try {
            await navigator.share({
              files: [file],
              title: 'Zine Photo',
              text: 'Check out this photo from the zine!'
            })
          } catch (shareError) {
            console.error('Share API error:', shareError)
            // Fallback to download if share fails
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'zine-photo.jpg'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }
        } else {
          // Fallback for older mobile browsers
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'zine-photo.jpg'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      } else {
        // For desktop, use the download link approach
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = 'zine-photo.jpg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toast({
        title: "Saved!",
        description: isMobile ? "The photo has been saved to your camera roll." : "The photo has been saved to your device.",
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Error",
        description: "Failed to save the photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button 
        variant="ghost" 
        className="flex flex-col items-center gap-1 h-auto py-2"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        <Download className="h-6 w-6" />
        <span className="text-xs">{isDownloading ? "Saving..." : "save"}</span>
      </Button>
      <AllPicturesModal />
      <RequestUsModal />
    </div>
  )
}

