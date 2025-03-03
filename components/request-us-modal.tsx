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
import { MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { sendAccessRequest } from "@/app/actions"

export function RequestUsModal() {
  const [email, setEmail] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) { // When modal is closing
      setIsSuccess(false)
      setEmail("")
      setIsSubmitting(false)
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
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
    
    setIsSubmitting(true)
    console.log("Starting zine request for:", email)
    
    try {
      const result = await sendAccessRequest(email, "New Zine Request")
      console.log("Zine request result:", result)
      setIsSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } catch (error) {
      console.error("Failed to send zine request:", error)
      toast({
        title: "Error sending request",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
          <MessageSquare className="h-6 w-6" />
          <span className="text-xs">request us</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request a Zine</DialogTitle>
          <DialogDescription>
            Do you want us to make a zine for your past/next event? Enter your email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
            disabled={isSubmitting}
          />
          <Button 
            type="submit"
            disabled={isSubmitting || !isValidEmail(email)}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
          {isSuccess && (
            <p className="text-center text-green-600 font-medium">
              Zine requested!
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

