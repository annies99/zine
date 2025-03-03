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
    if (!currentImageUrl) {
      toast({
        title: "Download failed",
        description: "No image selected to download.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDownloading(true)
      
      // Get watermarked image from server action
      const watermarkedImageBuffer = await addWatermark(currentImageUrl)
      
      // Convert buffer to base64
      const base64Image = Buffer.from(watermarkedImageBuffer).toString('base64')
      
      // Create a data URL
      const dataUrl = `data:image/jpeg;base64,${base64Image}`
      
      // Create a download link
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = 'zine-photo.jpg'
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Downloaded!",
        description: "The photo has been saved to your device.",
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: "Download failed",
        description: "Could not download the photo. Please try again.",
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

