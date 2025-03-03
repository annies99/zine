"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import { useSwipeable } from "react-swipeable"
import type { Photo } from "@/types/album"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PhotoGalleryProps {
  photos: Photo[]
  onCurrentImageChange?: (imageUrl: string) => void
}

export function PhotoGallery({ photos, onCurrentImageChange }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
    setDragOffset(0)
  }

  const previousImage = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
    setDragOffset(0)
  }

  const handlers = useSwipeable({
    onSwipedLeft: nextImage,
    onSwipedRight: previousImage,
    trackMouse: true,
  })

  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX)
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const currentX = e.clientX
    const diff = touchStart - currentX
    setDragOffset(diff)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    const touchEnd = e.clientX
    const diff = touchStart - touchEnd

    if (Math.abs(diff) > 50) { // minimum drag distance to trigger change
      if (diff > 0) {
        nextImage()
      } else {
        previousImage()
      }
    } else {
      setDragOffset(0)
    }
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setDragOffset(0)
    }
    setIsDragging(false)
  }

  // Notify parent of current image changes
  useEffect(() => {
    if (onCurrentImageChange && photos[currentIndex]) {
      onCurrentImageChange(photos[currentIndex].url)
    }
  }, [currentIndex, photos, onCurrentImageChange])

  if (!photos.length) {
    return <div>No photos available</div>
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[3/4] cursor-grab active:cursor-grabbing overflow-hidden"
      {...handlers}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          width: `${photos.length * 100}%`
        }}
      >
        {photos.map((photo, index) => (
          <div 
            key={photo.key}
            className="relative w-full h-full flex-shrink-0"
          >
            <Image
              src={photo.url || "/placeholder.svg"}
              alt={`Photo ${index + 1}`}
              fill
              className="object-cover select-none"
              priority={index === currentIndex}
              draggable={false}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? "bg-white" : "bg-white/50"
            }`}
            onClick={() => {
              setCurrentIndex(index)
              setDragOffset(0)
            }}
            aria-label={`Go to photo ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

