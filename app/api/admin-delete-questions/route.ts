import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Guard: check for required service role key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Service role key is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.' },
      { status: 500 }
    )
  }

  try {
    const { deleteAll, ids } = await req.json()

    // Use service role key for RLS bypass
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    if (deleteAll) {
      // Delete all questions
      const { error } = await supabaseAdmin
        .from('questions')
        .delete()
        .neq('id', '')
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ success: true, message: 'All questions deleted' })
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      // Delete specific questions by IDs
      const { error } = await supabaseAdmin
        .from('questions')
        .delete()
        .in('id', ids)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ success: true, message: `Deleted ${ids.length} questions`, deleted: ids.length })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
