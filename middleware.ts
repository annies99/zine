import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function middleware(request: NextRequest) {
  const albumName = request.nextUrl.pathname.split("/").pop()
  console.log('Middleware processing request for album:', albumName)

  if (request.nextUrl.pathname.startsWith("/photos/")) {
    // Check if album exists
    try {
      if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
        console.error('Missing required AWS environment variables in middleware')
        return NextResponse.redirect(new URL("/", request.url))
      }

      console.log('Checking album existence in S3...')
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Prefix: `albums/${albumName}/`,
        })
      )

      console.log('S3 response:', response.Contents?.length, 'files found')

      // If no contents found, album doesn't exist
      if (!response.Contents || response.Contents.length === 0) {
        console.log('No album found, redirecting to home')
        return NextResponse.redirect(new URL("/", request.url))
      }

      const sessionCookie = request.cookies.get("user_session")
      console.log('Session cookie present:', !!sessionCookie)

      if (!sessionCookie) {
        console.log('No session cookie, redirecting to login')
        return NextResponse.redirect(new URL(`/photos?album=${albumName}`, request.url))
      }

      // Check if user exists in the database
      console.log('Checking user in database...')
      const { data: user, error } = await supabase
        .from("users")
        .select()
        .eq('id', sessionCookie.value)
        .single()

      if (error) {
        console.error('Supabase error:', error)
      }

      if (error || !user) {
        console.log('User not found or error, redirecting to login')
        return NextResponse.redirect(new URL(`/photos?album=${albumName}`, request.url))
      }

      console.log('User authenticated, proceeding to album')
      return NextResponse.next()
    } catch (error) {
      console.error("Detailed error in middleware:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/photos/:path*",
}

