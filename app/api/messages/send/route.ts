import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendMessageViaProvider } from '@/app/lib/messaging/provider'

/**
 * POST /api/messages/send
 * Send an outbound message (manual response from staff)
 * 
 * Expected payload:
 * {
 *   "conversationId": "uuid",
 *   "text": "Message text",
 *   "sendVia": "sms" | "whatsapp" | "messenger" (optional - defaults to conversation channel)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Note: Authentication check removed for MacroDroid compatibility
    // This endpoint is used for tracking sent SMS from MacroDroid
    // which cannot authenticate

    const { conversationId, text, sendVia, customerPhone, sender, trackOnly } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      )
    }

    // If trackOnly is true, this is from MacroDroid tracking an already-sent message
    // We should only log it, not send it again
    const isTrackingOnly = trackOnly === true || sender === 'staff'

    // Check if this exact message was recently sent by AI or system (within last 30 seconds)
    // to avoid duplicate tracking from MacroDroid
    if (isTrackingOnly && text) {
      try {
        const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
        
        // Check for exact match in recent messages
        const { data: recentMessages, error: checkError } = await supabase
          .from('messages')
          .select('id, text, sender, created_at')
          .eq('text', text)
          .in('sender', ['ai', 'system'])
          .gte('created_at', thirtySecondsAgo)
          .limit(1)

        if (checkError) {
          console.error('[Track SMS] Error checking duplicates:', checkError)
          // Continue anyway - better to track than to fail
        } else if (recentMessages && recentMessages.length > 0) {
          // This message was just sent by AI/system, don't track it again
          console.log(`[Track SMS] Skipping duplicate - ${recentMessages[0].sender} already sent this message`)
          return NextResponse.json({
            success: true,
            message: 'Skipped - already tracked',
            duplicate: true,
            originalSender: recentMessages[0].sender
          })
        }
      } catch (err) {
        console.error('[Track SMS] Exception checking duplicates:', err)
        // Continue anyway
      }
    }

    // Handle lookup by phone (for MacroDroid sent SMS tracking)
    let actualConversationId = conversationId
    
    if (conversationId === 'lookup-by-phone' && customerPhone) {
      // Find conversation by customer phone number
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', customerPhone)
        .single()

      if (customer) {
        const { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('customer_id', customer.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (conversation) {
          actualConversationId = conversation.id
        }
      }
    }

    if (!actualConversationId || actualConversationId === 'lookup-by-phone') {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', actualConversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Insert message into database
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: actualConversationId,
        sender: sender || 'staff',
        text,
      })
      .select()
      .single()

    if (messageError) {
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Only send the message if this is NOT just tracking
    let deliveryStatus = { sent: false, provider: 'none' }
    
    if (!isTrackingOnly) {
      const channel = sendVia || conversation.channel
      const customerPhoneNumber = conversation.customer?.phone

      // Send via MacroDroid webhook (if configured) or external provider
      deliveryStatus = await sendMessageViaProvider({
        channel,
        to: customerPhoneNumber,
        text,
      })
    }

    // Update message with delivery status
    if (deliveryStatus.sent) {
      await supabase
        .from('messages')
        .update({ 
          delivered: true,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', message.id)
    }

    // Update conversation status to manual (staff has taken over)
    await supabase
      .from('conversations')
      .update({ 
        status: 'manual',
        updated_at: new Date().toISOString(),
      })
      .eq('id', actualConversationId)

    return NextResponse.json({
      success: true,
      message,
      deliveryStatus,
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
