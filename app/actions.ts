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
    const photoResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Prefix: `albums/${albumName}/`,
      })
    )

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

    const audioResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Prefix: `albums/${albumName}/`,
      })
    )

    console.log('Album name:', albumName)
    console.log('All files in album:', audioResponse.Contents?.map(item => item.Key))
    
    const audioFile = audioResponse.Contents?.find(item => {
      console.log('Checking file:', item.Key)
      return item.Key?.toLowerCase().endsWith('.mp3')
    })
    console.log('Found audio file:', audioFile)

    let audioData = null
    if (audioFile?.Key) {
      console.log('Audio file key:', audioFile.Key)
      const audioUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: audioFile.Key,
        }),
        { expiresIn: 3600 }
      )
      
      const songName = audioFile.Key.split('/').pop()?.replace('.mp3', '') || "Album Audio"
      console.log('Extracted song name:', songName)
      console.log('Generated audio URL:', audioUrl)
      
      audioData = {
        url: audioUrl,
        songName: songName
      }
    } else {
      console.log('No audio file found in the album')
    }

    console.log('Final audioData being returned:', audioData)

    return { 
      photos,
      audioFile: audioData
    }
  } catch (error) {
    console.error("Error fetching album content:", error)
    throw new Error("Failed to fetch album content")
  }
}

export async function submitEventForm(name: string, phone: string) {
  // Remove formatting from phone number before storing
  const cleanedPhone = phone.replace(/\D/g, "")

  try {
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
      console.error("Error inserting data:", userError)
      throw new Error("Failed to submit form")
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
    console.error("Error:", error)
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
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }
    
    const imageBuffer = await response.arrayBuffer()
    
    // Process the image with sharp
    const watermarkedImage = await sharp(Buffer.from(imageBuffer))
      .composite([{
        input: Buffer.from(
          `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <text 
              x="95%" 
              y="5%" 
              font-family="Arial" 
              font-size="120" 
              fill="white" 
              text-anchor="end" 
              opacity="0.8"
              transform="translate(0, 0)"
            >zine</text>
          </svg>`
        ),
        top: 0,
        left: 0,
      }])
      .jpeg({
        quality: 100,
        progressive: true
      })
      .toBuffer()

    return watermarkedImage
  } catch (error) {
    console.error('Watermark error:', error)
    throw new Error('Failed to watermark image')
  }
}

