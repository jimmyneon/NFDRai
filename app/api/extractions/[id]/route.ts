import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/extractions/[id]
 * Update a staff message extraction (manual correction)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Update extraction
    const { error } = await supabase
      .from('staff_message_extractions')
      .update({
        customer_name: body.customer_name,
        device_type: body.device_type,
        device_model: body.device_model,
        device_issue: body.device_issue,
        repair_status: body.repair_status,
        price_quoted: body.price_quoted,
        price_final: body.price_final,
        message_type: body.message_type,
        extraction_method: body.extraction_method || 'manual',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('[Extraction Update] Error:', error)
      return NextResponse.json(
        { error: 'Failed to update extraction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Extraction Update] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
