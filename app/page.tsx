import Image from "next/image"
import { EventForm } from "@/components/event-form"
import { Newsreader } from "next/font/google"

const newsreader = Newsreader({ subsets: ["latin"], style: ["italic"] })

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pile-of-developed-film-prints-from-a-disposable-camera.jpg-dcnWDzJ3fJPDLe8zDG5b7REDdnbGD3.jpeg"
        alt="Vintage photographs scattered"
        fill
        className="object-cover opacity-50"
        priority
      />
      <div className="z-10 w-full max-w-md p-8 rounded-lg bg-white/80 backdrop-blur-sm">
        <EventForm />
      </div>
    </main>
  )
}

