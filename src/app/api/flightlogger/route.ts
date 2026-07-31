import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { flightloggerQuery } from '@/lib/flightlogger'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's FlightLogger API key from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('flightlogger_api_key')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.flightlogger_api_key) {
      return NextResponse.json(
        { error: 'No FlightLogger API key configured. Please add your API key in Settings.' },
        { status: 422 }
      )
    }

    // Parse the request body
    const { query, variables } = await req.json()
    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }

    // Forward to FlightLogger API
    const data = await flightloggerQuery(profile.flightlogger_api_key, query, variables)
    return NextResponse.json({ data })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
