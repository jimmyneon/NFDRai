import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

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
    const supabase = createServiceClient()
    
    // Parse JSON with error handling for malformed input
    let body
    try {
      const rawBody = await request.text()
      console.log('[Delivery Confirmation] Raw body:', rawBody.substring(0, 200))
      
      // Try to fix common JSON issues
      let fixedBody = rawBody
        .replace(/\n/g, '\\n')  // Escape line breaks
        .replace(/\r/g, '\\r')  // Escape carriage returns
        .replace(/\t/g, '\\t')  // Escape tabs
      
      body = JSON.parse(fixedBody)
    } catch (parseError) {
      console.error('[Delivery Confirmation] JSON parse error:', parseError)
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          hint: 'Message text contains unescaped special characters',
          success: false
        },
        { status: 400 }
      )
    }

    const { phone, message, status, timestamp } = body

    console.log('[Delivery Confirmation] Received:', { phone, messageLength: message?.length, status })

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, message' },
        { status: 400 }
      )
    }

    // Find the most recent message with this exact text
    // within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: messages, error: findError } = await supabase
      .from('messages')
      .select('id, text, created_at, sender')
      .eq('text', message)
      .in('sender', ['ai', 'system'])
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)

    if (findError) {
      console.error('[Delivery Confirmation] Error finding message:', findError)
      return NextResponse.json(
        { error: 'Failed to find message', details: findError.message },
        { status: 500 }
      )
    }

    if (!messages || messages.length === 0) {
      console.log('[Delivery Confirmation] No matching message found for:', { 
        phone, 
        messageLength: message.length,
        searchedSince: fiveMinutesAgo 
      })
      return NextResponse.json(
        { 
          success: false,
          message: 'No matching message found (may be older than 5 minutes or text mismatch)'
        },
        { status: 404 }
      )
    }

    const messageId = messages[0].id
    console.log('[Delivery Confirmation] Found message:', messageId)

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
