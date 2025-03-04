"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import type { Photo } from "@/types/album"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PhotoGalleryProps {
  photos: Photo[]
  onCurrentImageChange?: (imageUrl: string) => void
}

function CarouselImages({ photos, onCurrentImageChange }: PhotoGalleryProps) {
  const { api } = useCarousel()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!api || !onCurrentImageChange) return

    const onSelect = () => {
      const selectedIndex = api.selectedScrollSnap()
      setCurrentIndex(selectedIndex)
      if (photos[selectedIndex]) {
        onCurrentImageChange(photos[selectedIndex].url)
      }
    }

    api.on("select", onSelect)
    // Call once to set initial value
    onSelect()

    return () => {
      api.off("select", onSelect)
    }
  }, [api, photos, onCurrentImageChange])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full">
        <CarouselContent>
          {photos.map((photo, index) => (
            <CarouselItem key={photo.key}>
              <div className="p-1">
                <Card className="bg-transparent border-none shadow-none">
                  <CardContent className="relative aspect-[3/4] p-0">
                    <Image
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-contain rounded-lg"
                      priority={index === 0}
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-white" : "bg-white/50"
              )}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-8">
        <CarouselPrevious className="static translate-y-0 bg-white hover:bg-gray-100 border-black text-black" />
        <CarouselNext className="static translate-y-0 bg-white hover:bg-gray-100 border-black text-black" />
      </div>
    </div>
  )
}

export function PhotoGallery({ photos, onCurrentImageChange }: PhotoGalleryProps) {
  if (!photos.length) {
    return <div>No photos available</div>
  }

  return (
    <Carousel className="w-full max-w-lg mx-auto">
      <CarouselImages photos={photos} onCurrentImageChange={onCurrentImageChange} />
    </Carousel>
  )
}

