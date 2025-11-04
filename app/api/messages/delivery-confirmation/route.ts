import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/messages/delivery-confirmation
 * Confirms that MacroDroid successfully sent an SMS
 * 
 * Expected payload from MacroDroid:
 * {
 *   "phone": "07410381247",
 *   "message": "The message text that was sent",
 *   "status": "delivered",
 *   "timestamp": "2024-11-04 19:35:22"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { phone, message, status, timestamp } = await request.json()

    console.log('[Delivery Confirmation] Received:', { phone, messageLength: message?.length, status })

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, message' },
        { status: 400 }
      )
    }

    // Find the most recent message with this exact text sent to this phone number
    // within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: messages, error: findError } = await supabase
      .from('messages')
      .select(`
        id,
        text,
        created_at,
        conversation:conversations!inner(
          customer:customers!inner(phone)
        )
      `)
      .eq('text', message)
      .eq('sender', 'ai')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)

    if (findError) {
      console.error('[Delivery Confirmation] Error finding message:', findError)
      return NextResponse.json(
        { error: 'Failed to find message' },
        { status: 500 }
      )
    }

    if (!messages || messages.length === 0) {
      console.log('[Delivery Confirmation] No matching message found')
      return NextResponse.json(
        { 
          success: false,
          message: 'No matching message found (may be older than 5 minutes)'
        },
        { status: 404 }
      )
    }

    const messageId = messages[0].id

    // Update message with delivery confirmation
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        delivered: true,
        delivered_at: timestamp || new Date().toISOString(),
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('[Delivery Confirmation] Error updating message:', updateError)
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      )
    }

    console.log('[Delivery Confirmation] Success:', messageId)

    return NextResponse.json({
      success: true,
      messageId,
      message: 'Delivery confirmed'
    })

  } catch (error) {
    console.error('[Delivery Confirmation] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
