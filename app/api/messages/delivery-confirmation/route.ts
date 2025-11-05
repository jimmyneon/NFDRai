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
    
    // Check content type and parse accordingly
    const contentType = request.headers.get('content-type') || ''
    let phone, message, status, timestamp
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Parse form data
      const formData = await request.formData()
      phone = formData.get('phone') as string
      message = formData.get('message') as string
      status = formData.get('status') as string
      timestamp = formData.get('timestamp') as string
      console.log('[Delivery Confirmation] Parsed form data')
    } else {
      // Try to parse as JSON
      try {
        const rawBody = await request.text()
        console.log('[Delivery Confirmation] Raw body (first 100):', rawBody.substring(0, 100))
        
        // Simple approach: just try to parse, if it fails return helpful error
        const body = JSON.parse(rawBody)
        phone = body.phone
        message = body.message
        status = body.status
        timestamp = body.timestamp
      } catch (parseError: any) {
        console.error('[Delivery Confirmation] JSON parse error:', parseError.message)
        return NextResponse.json(
          { 
            error: 'Invalid JSON. Use form-encoded data instead',
            hint: 'Change Content-Type to application/x-www-form-urlencoded in MacroDroid',
            success: false
          },
          { status: 400 }
        )
      }
    }

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
      .in('sender', ['ai', 'system', 'staff'])
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

    // Parse timestamp - MacroDroid sends Unix timestamp in seconds
    let deliveredAt: string
    if (timestamp) {
      // Check if it's a Unix timestamp (number as string)
      if (/^\d+$/.test(timestamp)) {
        // Convert Unix timestamp (seconds) to ISO string
        const timestampMs = parseInt(timestamp) * 1000
        deliveredAt = new Date(timestampMs).toISOString()
        console.log('[Delivery Confirmation] Converted Unix timestamp:', timestamp, '→', deliveredAt)
      } else {
        // Assume it's already an ISO string or parseable date
        deliveredAt = new Date(timestamp).toISOString()
      }
    } else {
      deliveredAt = new Date().toISOString()
    }

    // Update message with delivery confirmation
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        delivered: true,
        delivered_at: deliveredAt,
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('[Delivery Confirmation] Error updating message:', updateError)
      // If columns don't exist yet, still return success
      if (updateError.message?.includes('column') || updateError.code === '42703') {
        console.log('[Delivery Confirmation] Columns not yet added - run migration 013')
        return NextResponse.json({
          success: true,
          messageId,
          message: 'Message found but delivery columns not yet added. Run migration 013.',
          warning: 'Delivery tracking columns missing'
        })
      }
      return NextResponse.json(
        { error: 'Failed to update message', details: updateError.message },
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
