"use client"

import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface AudioPlayerProps {
  audioUrl: string
  songName: string
}

export function AudioPlayer({ audioUrl, songName }: AudioPlayerProps) {
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      // Try to play the audio when the component mounts
      const playPromise = audioRef.current.play()
      
      // Handle any errors that might occur during autoplay
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay failed:", error)
          // You might want to add a play button here if autoplay fails
        })
      }
    }
  }, [audioUrl]) // Re-run when audioUrl changes

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMute}
        className="h-8 w-8"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      <span className="text-sm text-muted-foreground">{songName}</span>
      <audio
        ref={audioRef}
        src={audioUrl}
        autoPlay
        loop
        className="hidden"
      />
    </div>
  )
}

