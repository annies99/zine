"use client"

import { Newsreader } from "next/font/google"
import { PhotoGallery } from "@/components/photo-gallery"
import { AudioPlayer } from "@/components/audio-player"
import { ActionButtons } from "@/components/action-buttons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { getAlbumContent } from "@/lib/s3"

const newsreader = Newsreader({ subsets: ["latin"], style: ["italic"] })

export default function AlbumPage({ params }: { params: { albumName: string } }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>()
  const [audioFile, setAudioFile] = useState<{ url: string; songName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAlbumContent() {
      try {
        const content = await getAlbumContent(params.albumName)
        setPhotos(content.photos)
        console.log('Received audio file:', content.audioFile)
        setAudioFile(content.audioFile)
      } catch (e) {
        console.error("Error fetching album content:", e)
        setError("There was an error loading the album content. Please try again later.")
      }
    }

    fetchAlbumContent()
  }, [params.albumName])

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h1 className={`text-4xl mb-1 ${newsreader.className}`}>zine</h1>
          <div className="flex justify-center">
            <AudioPlayer 
              audioUrl={audioFile?.url ?? null}
              songName={audioFile?.songName ?? "No audio available"}
            />
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : photos.length === 0 ? (
          <p className="text-center text-xl">No photos available for this album yet.</p>
        ) : (
          <div className="relative">
            <PhotoGallery 
              photos={photos} 
              onCurrentImageChange={setCurrentImageUrl}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <ActionButtons currentImageUrl={currentImageUrl} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

