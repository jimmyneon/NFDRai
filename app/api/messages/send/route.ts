import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, text, sendVia, customerPhone, sender } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      )
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

    const channel = sendVia || conversation.channel
    const customerPhoneNumber = conversation.customer?.phone

    // Send via MacroDroid webhook (if configured) or external provider
    const deliveryStatus = await sendMessageViaProvider({
      channel,
      to: customerPhoneNumber,
      text,
    })

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

/**
 * Send message via MacroDroid webhook or external provider
 */
async function sendMessageViaProvider({
  channel,
  to,
  text,
}: {
  channel: string
  to: string | null
  text: string
}): Promise<{ sent: boolean; provider: string; error?: string }> {
  if (!to) {
    return {
      sent: false,
      provider: channel,
      error: 'No recipient phone/ID',
    }
  }

  // Option 1: MacroDroid Webhook (for SMS via your Android phone)
  const macrodroidWebhook = process.env.MACRODROID_WEBHOOK_URL
  
  if (macrodroidWebhook && channel === 'sms') {
    try {
      const response = await fetch(macrodroidWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: to,
          message: text,
        }),
      })

      if (response.ok) {
        console.log(`[MacroDroid] SMS sent to ${to}`)
        return { sent: true, provider: 'macrodroid' }
      } else {
        console.error(`[MacroDroid] Failed: ${response.status}`)
        return { 
          sent: false, 
          provider: 'macrodroid', 
          error: `HTTP ${response.status}` 
        }
      }
    } catch (error) {
      console.error('[MacroDroid] Error:', error)
      return { 
        sent: false, 
        provider: 'macrodroid', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Option 2: Twilio SMS
  if (channel === 'sms' && process.env.TWILIO_ACCOUNT_SID) {
    try {
      // Uncomment when you add Twilio credentials:
      // const twilioClient = require('twilio')(
      //   process.env.TWILIO_ACCOUNT_SID,
      //   process.env.TWILIO_AUTH_TOKEN
      // )
      // await twilioClient.messages.create({
      //   body: text,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: to,
      // })
      
      console.log(`[Twilio SMS] Would send to ${to}: ${text}`)
      return { sent: true, provider: 'twilio-sms' }
    } catch (error) {
      console.error('[Twilio SMS] Error:', error)
      return { 
        sent: false, 
        provider: 'twilio-sms', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Option 3: Twilio WhatsApp
  if (channel === 'whatsapp' && process.env.TWILIO_ACCOUNT_SID) {
    try {
      // Uncomment when you add Twilio credentials:
      // const twilioClient = require('twilio')(
      //   process.env.TWILIO_ACCOUNT_SID,
      //   process.env.TWILIO_AUTH_TOKEN
      // )
      // await twilioClient.messages.create({
      //   body: text,
      //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      //   to: `whatsapp:${to}`,
      // })
      
      console.log(`[Twilio WhatsApp] Would send to ${to}: ${text}`)
      return { sent: true, provider: 'twilio-whatsapp' }
    } catch (error) {
      console.error('[Twilio WhatsApp] Error:', error)
      return { 
        sent: false, 
        provider: 'twilio-whatsapp', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Option 4: Meta Messenger
  if (channel === 'messenger' && process.env.META_PAGE_ACCESS_TOKEN) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.META_PAGE_ACCESS_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: to },
            message: { text },
          }),
        }
      )

      if (response.ok) {
        console.log(`[Messenger] Sent to ${to}`)
        return { sent: true, provider: 'meta-messenger' }
      } else {
        console.error(`[Messenger] Failed: ${response.status}`)
        return { 
          sent: false, 
          provider: 'meta-messenger', 
          error: `HTTP ${response.status}` 
        }
      }
    } catch (error) {
      console.error('[Messenger] Error:', error)
      return { 
        sent: false, 
        provider: 'meta-messenger', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // No provider configured
  console.log(`[${channel}] No provider configured for ${to}: ${text}`)
  return {
    sent: false,
    provider: 'none',
    error: 'No messaging provider configured',
  }
}
