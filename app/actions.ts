"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import sharp from 'sharp'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function getAlbumContent(albumName: string) {
  try {
    console.log('Starting getAlbumContent for album:', albumName)
    console.log('AWS Region:', process.env.AWS_REGION)
    console.log('AWS Bucket:', process.env.AWS_S3_BUCKET_NAME)
    
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      console.error('Missing required AWS environment variables')
      throw new Error('Missing required AWS environment variables')
    }

    const photoResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Prefix: `albums/${albumName}/`,
      })
    )

    console.log('Photo response:', photoResponse.Contents?.length, 'files found')

    const photos = await Promise.all(
      (photoResponse.Contents || [])
        .filter((item) => item.Key?.endsWith(".jpg") || item.Key?.endsWith(".png"))
        .map(async (item) => {
          const photoCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: item.Key!,
          })
          const url = await getSignedUrl(s3Client, photoCommand, { expiresIn: 3600 })
          return { url, key: item.Key! }
        })
    )

    console.log('Processed photos:', photos.length)

    const audioResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Prefix: `albums/${albumName}/`,
      })
    )

    console.log('Audio response:', audioResponse.Contents?.length, 'files found')
    
    const audioFile = audioResponse.Contents?.find(item => {
      return item.Key?.toLowerCase().endsWith('.mp3')
    })
    console.log('Found audio file:', audioFile?.Key)

    let audioData = null
    if (audioFile?.Key) {
      const audioUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: audioFile.Key,
        }),
        { expiresIn: 3600 }
      )
      
      const songName = audioFile.Key.split('/').pop()?.replace('.mp3', '') || "Album Audio"
      console.log('Generated audio URL and song name:', { songName })
      
      audioData = {
        url: audioUrl,
        songName: songName
      }
    }

    return { 
      photos,
      audioFile: audioData
    }
  } catch (error) {
    console.error("Detailed error in getAlbumContent:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    throw new Error(`Failed to fetch album content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function submitEventForm(name: string, phone: string) {
  // Remove formatting from phone number before storing
  const cleanedPhone = phone.replace(/\D/g, "")
  
  // Validate phone number
  if (!cleanedPhone || cleanedPhone.length !== 10) {
    console.error("Invalid phone number:", phone)
    throw new Error("Please enter a valid 10-digit phone number")
  }

  try {
    console.log("Starting form submission with Supabase URL:", process.env.SUPABASE_URL)
    
    // Insert user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{
        name,
        phone: cleanedPhone,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (userError) {
      console.error("Supabase error:", userError)
      throw new Error(userError.message || "Failed to submit form")
    }

    if (!userData) {
      console.error("No user data returned from Supabase")
      throw new Error("Failed to create user")
    }

    // Instead of using auth.signUp, just create a session token directly
    cookies().set("user_session", userData.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return userData
  } catch (error) {
    console.error("Detailed submission error:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    throw new Error("Failed to process submission")
  }
}

export async function sendAccessRequest(userEmail: string, requestType: string) {
  "use server"
  
  console.log("Received request to send email for:", userEmail)
  console.log("Request type:", requestType)
  
  const emailContent = `
    ${requestType === "New Zine Request" ? "New Zine Request" : "Album Access Request"}:
    User Email: ${userEmail}
    ${requestType === "New Zine Request" ? "Time: " : "Album URL: "}${requestType}
    Time: ${new Date().toLocaleString()}
  `
  
  console.log("Preparing to send email with content:", emailContent)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'zine <onboarding@resend.dev>',
        to: 'annieshaw51@gmail.com',
        subject: requestType === "New Zine Request" ? 'New Zine Request' : 'Album Access Request',
        text: emailContent,
      }),
    })

    const responseData = await response.json()
    console.log("Email API response:", responseData)

    if (!response.ok) {
      console.error("Email API error:", response.status, responseData)
      throw new Error('Failed to send email')
    }

    console.log("Email sent successfully!")
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Failed to send access request')
  }
}

export async function addWatermark(imageUrl: string) {
  try {
    console.log('Starting watermark process for URL:', imageUrl)
    
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText)
      throw new Error('Failed to fetch image')
    }
    
    const imageBuffer = await response.arrayBuffer()
    console.log('Image buffer size:', imageBuffer.byteLength)
    
    // Create SVG watermark with better mobile compatibility
    const svgBuffer = Buffer.from(
      `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <text 
          x="105%" 
          y="80%" 
          font-family="Arial, sans-serif" 
          font-style="italic"
          font-weight="bold"
          font-size="45" 
          fill="white" 
          text-anchor="end" 
          opacity="0.8"
          dominant-baseline="hanging"
          transform="translate(0, 0)"
        >@nyczine.</text>
      </svg>`
    )
    
    // Process the image with sharp
    const watermarkedImage = await sharp(Buffer.from(imageBuffer))
      .composite([{
        input: svgBuffer,
        gravity: 'northeast',
        top: 20,
        left: 20
      }])
      .jpeg({
        quality: 100,
        progressive: true,
        mozjpeg: true,
        chromaSubsampling: '4:4:4'
      })
      .toBuffer()

    console.log('Watermarked image size:', watermarkedImage.length)
    return watermarkedImage
  } catch (error) {
    console.error('Detailed watermark error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw new Error('Failed to watermark image')
  }
}

