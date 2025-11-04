import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('business_info')
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get business hours error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business hours' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Note: Admin check removed - any authenticated user can update business hours
    // This is fine for a single-user business app

    const body = await request.json()

    // Check if business_info exists
    const { data: existing } = await supabase
      .from('business_info')
      .select('id')
      .single()

    let result

    if (existing) {
      // Update existing record
      result = await supabase
        .from('business_info')
        .update({
          business_name: body.business_name,
          google_maps_url: body.google_maps_url || null,
          timezone: body.timezone,
          monday_open: body.monday_open || null,
          monday_close: body.monday_close || null,
          tuesday_open: body.tuesday_open || null,
          tuesday_close: body.tuesday_close || null,
          wednesday_open: body.wednesday_open || null,
          wednesday_close: body.wednesday_close || null,
          thursday_open: body.thursday_open || null,
          thursday_close: body.thursday_close || null,
          friday_open: body.friday_open || null,
          friday_close: body.friday_close || null,
          saturday_open: body.saturday_open || null,
          saturday_close: body.saturday_close || null,
          sunday_open: body.sunday_open || null,
          sunday_close: body.sunday_close || null,
          special_hours_note: body.special_hours_note || null,
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Insert new record
      result = await supabase
        .from('business_info')
        .insert({
          business_name: body.business_name,
          google_maps_url: body.google_maps_url || null,
          timezone: body.timezone,
          monday_open: body.monday_open || null,
          monday_close: body.monday_close || null,
          tuesday_open: body.tuesday_open || null,
          tuesday_close: body.tuesday_close || null,
          wednesday_open: body.wednesday_open || null,
          wednesday_close: body.wednesday_close || null,
          thursday_open: body.thursday_open || null,
          thursday_close: body.thursday_close || null,
          friday_open: body.friday_open || null,
          friday_close: body.friday_close || null,
          saturday_open: body.saturday_open || null,
          saturday_close: body.saturday_close || null,
          sunday_open: body.sunday_open || null,
          sunday_close: body.sunday_close || null,
          special_hours_note: body.special_hours_note || null,
        })
        .select()
        .single()
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Update business hours error:', error)
    return NextResponse.json(
      { error: 'Failed to update business hours' },
      { status: 500 }
    )
  }
}
