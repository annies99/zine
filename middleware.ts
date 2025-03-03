import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function middleware(request: NextRequest) {
  const albumName = request.nextUrl.pathname.split("/").pop()

  if (request.nextUrl.pathname.startsWith("/photos/")) {
    const sessionCookie = request.cookies.get("user_session")

    if (!sessionCookie) {
      return NextResponse.redirect(new URL(`/photos?album=${albumName}`, request.url))
    }

    // Check if user exists in the database
    const { data: user, error } = await supabase
      .from("users")
      .select()
      .eq('id', sessionCookie.value)
      .single()

    if (error || !user) {
      return NextResponse.redirect(new URL(`/photos?album=${albumName}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/photos/:path*",
}

