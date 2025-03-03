"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { submitEventForm } from "@/app/actions"
import { Newsreader } from "next/font/google"
import { createClient } from "@supabase/supabase-js"
import { Alert, AlertDescription } from "@/components/ui/alert"

const newsreader = Newsreader({ subsets: ["latin"], style: ["italic"] })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface EventFormProps {
  albumName?: string
}

export function EventForm({ albumName }: EventFormProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showConfirmation) {
      console.log("Confirmation shown, preparing to redirect...")
      console.log("Album name:", albumName)
      timer = setTimeout(() => {
        console.log("Redirecting now...")
        const redirectUrl = albumName ? `/photos/${albumName}` : "/"
        console.log("Redirect URL:", redirectUrl)
        router.push(redirectUrl)
      }, 5000) // 5 seconds delay
    }
    return () => clearTimeout(timer)
  }, [showConfirmation, albumName, router])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (showConfirmation && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [showConfirmation, countdown])

  const formatPhoneNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return input
  }

  const validatePhoneNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, "")
    return cleaned.length === 10
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value)
    setPhone(formattedNumber)
    setPhoneError(validatePhoneNumber(formattedNumber) ? "" : "Please enter a valid 10-digit phone number")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePhoneNumber(phone)) {
      setPhoneError("Please enter a valid 10-digit phone number")
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await submitEventForm(name, phone)
      setFadeOut(true)
      setTimeout(() => {
        setShowConfirmation(true)
      }, 500) // Start showing confirmation after form fades out
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("There was an error submitting your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex flex-col h-[350px]">
      <h1 className={`text-4xl font-bold text-center mb-6 ${newsreader.className}`}>zine</h1>
      <div
        className={`flex flex-col justify-between h-full transition-opacity duration-500 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
        style={{ display: showConfirmation ? "none" : "flex" }}
      >
        <div>
          <p className="text-xl text-center mb-8">
            {albumName
              ? `Enter your name and number to confirm you were at the ${albumName} event.`
              : "Enter your name and number to confirm you were at the event."}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="first & last"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div>
              <Input type="tel" placeholder="(123) 456-7890" value={phone} onChange={handlePhoneChange} required />
              {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
            </div>
          </form>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          className="w-full bg-purple-200 hover:bg-purple-300 text-black mt-4"
          disabled={isSubmitting || !!phoneError}
          onClick={handleSubmit}
        >
          {isSubmitting ? "submitting..." : "submit"}
        </Button>
      </div>
      <div
        className={`flex items-center justify-center h-full text-center absolute top-0 left-0 right-0 transition-opacity duration-500 ${
          showConfirmation ? "opacity-100" : "opacity-0"
        }`}
        style={{ display: showConfirmation ? "flex" : "none" }}
      >
        <p className="text-xl px-4">
          {albumName
            ? `thanks! we'll text you if you appear in the ${albumName} album or any other albums. Redirecting to album page in ${countdown} seconds...`
            : `thanks! we'll text you if you appear in any other photo albums. Redirecting in ${countdown} seconds...`}
        </p>
      </div>
    </div>
  )
}

