import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = 'sow2025'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-admin-password')
    if (authHeader !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 403 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service role key is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const wordId = formData.get('wordId') as string
    const section = formData.get('section') as string

    if (!file || !wordId || !section) {
      return NextResponse.json(
        { error: 'Missing required fields: file, wordId, section' },
        { status: 400 }
      )
    }

    // Get file extension
    const fileName = file.name
    const ext = fileName.split('.').pop()?.toLowerCase() || 'mp3'

    // Validate file type
    const allowedExts = ['mp3', 'wav', 'ogg', 'm4a']
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedExts.join(', ')}` },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const filePath = `${section}/${wordId}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('spelling-audio')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('spelling-audio')
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    // Update database with audio URL
    const { error: updateError } = await supabaseAdmin
      .from('spelling_words')
      .update({ audio_url: publicUrl })
      .eq('id', wordId)

    if (updateError) {
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-admin-password')
    if (authHeader !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 403 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service role key is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { wordId, filePath } = body

    if (!wordId || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields: wordId, filePath' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Delete from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('spelling-audio')
      .remove([filePath])

    if (deleteError) {
      return NextResponse.json(
        { error: `Delete failed: ${deleteError.message}` },
        { status: 500 }
      )
    }

    // Update database to clear audio URL
    const { error: updateError } = await supabaseAdmin
      .from('spelling_words')
      .update({ audio_url: null })
      .eq('id', wordId)

    if (updateError) {
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}
