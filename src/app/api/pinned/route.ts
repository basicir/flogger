import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('pinned_students')
    .select('*')
    .eq('instructor_id', user.id)
    .order('pinned_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pinned: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { callsign, display_name, flightlogger_user_id } = await req.json()
  if (!callsign) return NextResponse.json({ error: 'callsign required' }, { status: 400 })

  const { error } = await supabase.from('pinned_students').upsert({
    instructor_id: user.id,
    callsign,
    display_name: display_name ?? callsign,
    flightlogger_user_id: flightlogger_user_id ?? null,
    pinned_at: new Date().toISOString(),
  }, { onConflict: 'instructor_id,callsign' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { callsign } = await req.json()
  if (!callsign) return NextResponse.json({ error: 'callsign required' }, { status: 400 })

  const { error } = await supabase
    .from('pinned_students')
    .delete()
    .eq('instructor_id', user.id)
    .eq('callsign', callsign)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
