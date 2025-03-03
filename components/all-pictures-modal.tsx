"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Image, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { sendAccessRequest } from "@/app/actions"

export function AllPicturesModal() {
  const [email, setEmail] = useState("")
  const [hasShared, setHasShared] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) { // When modal is closing
      setIsSuccess(false)
      setEmail("")
      setHasShared(false)
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleShare = () => {
    const shareText = `Check out this album: ${currentUrl}`
    const shareUrl = `sms:&body=${encodeURIComponent(shareText)}`
    window.open(shareUrl, '_blank')
    setHasShared(true)
    toast({
      title: "Share initiated!",
      description: "Please send the text message to share the album.",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }
    
    console.log("Starting album access request for:", email)
    
    try {
      const result = await sendAccessRequest(email, currentUrl)
      console.log("Album access request result:", result)
      setIsSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } catch (error) {
      console.error("Failed to send album access request:", error)
      toast({
        title: "Error sending request",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isSubmitDisabled = !hasShared || !email || !isValidEmail(email)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
          <Image className="h-6 w-6" />
          <span className="text-xs">all pictures</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>See All Pictures</DialogTitle>
          <DialogDescription>
            Share this album and enter your email to get access to all pictures.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <Input
              value={currentUrl}
              readOnly
              className="flex-1"
            />
            <Button 
              variant="secondary" 
              onClick={handleShare}
              className="min-w-[80px]"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {hasShared ? "Shared!" : "Share"}
            </Button>
          </div>
          <div className="h-2" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
            />
            <Button 
              type="submit" 
              disabled={isSubmitDisabled}
              className={isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""}
            >
              Get access
            </Button>
            {isSuccess && (
              <p className="text-center text-green-600 font-medium">
                Album access requested!
              </p>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

