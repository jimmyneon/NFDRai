import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/response-generator'
import { sendMessageViaProvider } from '@/app/lib/messaging/provider'

/**
 * Webhook endpoint for incoming messages from SMS/WhatsApp/Messenger
 * 
 * Expected payload:
 * {
 *   "from": "+1234567890" or "messenger_id",
 *   "message": "Customer message text",
 *   "channel": "sms" | "whatsapp" | "messenger",
 *   "customerName": "John Doe" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { from, message, channel, customerName } = payload

    if (!from || !message || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: from, message, channel' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find or create customer
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', from)
      .single()

    if (!customer) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          name: customerName || null,
          phone: from,
        })
        .select()
        .single()

      customer = newCustomer
    }

    if (!customer) {
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          customer_id: customer.id,
          channel,
          status: 'auto',
        })
        .select()
        .single()

      conversation = newConversation
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Insert customer message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender: 'customer',
      text: message,
    })

    // Check global kill switch
    const { data: globalSettings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('automation_enabled')
      .eq('active', true)
      .single()

    console.log('Global settings:', globalSettings)
    console.log('Settings error:', settingsError)

    if (!globalSettings?.automation_enabled) {
      await supabase.from('alerts').insert({
        conversation_id: conversation.id,
        type: 'manual_required',
        notified_to: 'admin',
      })

      return NextResponse.json({
        success: true,
        mode: 'manual',
        message: 'Message received - AI automation is disabled',
      })
    }

    // Check if conversation is in auto mode
    if (conversation.status !== 'auto') {
      // Send alert to staff
      await supabase.from('alerts').insert({
        conversation_id: conversation.id,
        type: 'manual_required',
        notified_to: 'admin',
      })

      return NextResponse.json({
        success: true,
        mode: 'manual',
        message: 'Message received - manual response required',
      })
    }

    // Check if staff has recently replied (within last 5 messages)
    // This prevents AI from jumping back in after manual intervention
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('sender, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const hasRecentStaffMessage = recentMessages?.some(
      (msg) => msg.sender === 'staff'
    )

    if (hasRecentStaffMessage) {
      // Staff has manually intervened - switch to manual mode
      await supabase
        .from('conversations')
        .update({ status: 'manual' })
        .eq('id', conversation.id)

      await supabase.from('alerts').insert({
        conversation_id: conversation.id,
        type: 'manual_required',
        notified_to: 'admin',
      })

      return NextResponse.json({
        success: true,
        mode: 'manual',
        message: 'Staff has taken over - AI paused',
      })
    }

    // Generate AI response
    const aiResult = await generateAIResponse({
      customerMessage: message,
      conversationId: conversation.id,
    })

    // Insert AI response
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender: 'ai',
      text: aiResult.response,
      ai_provider: aiResult.provider,
      ai_model: aiResult.model,
      ai_confidence: aiResult.confidence,
    })

    // If fallback was triggered, switch to manual mode
    if (aiResult.shouldFallback) {
      await supabase
        .from('conversations')
        .update({ status: 'manual' })
        .eq('id', conversation.id)

      await supabase.from('alerts').insert({
        conversation_id: conversation.id,
        type: 'low_confidence',
        notified_to: 'admin',
      })
    }

    // Send AI response via MacroDroid webhook
    const deliveryStatus = await sendMessageViaProvider({
      channel: 'sms',
      to: from,
      text: aiResult.response,
    })

    // Update message with delivery status
    if (deliveryStatus.sent) {
      const { data: aiMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversation.id)
        .eq('sender', 'ai')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (aiMessage) {
        await supabase
          .from('messages')
          .update({ 
            delivered: true,
            delivered_at: new Date().toISOString(),
          })
          .eq('id', aiMessage.id)
      }
    }

    return NextResponse.json({
      success: true,
      response: aiResult.response,
      confidence: aiResult.confidence,
      fallback: aiResult.shouldFallback,
      delivered: deliveryStatus.sent,
      deliveryProvider: deliveryStatus.provider,
    })
  } catch (error) {
    console.error('Incoming message error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
