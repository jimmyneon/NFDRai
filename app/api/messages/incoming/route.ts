import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/response-generator'
import { sendMessageViaProvider } from '@/app/lib/messaging/provider'
import { checkRateLimit } from '@/app/lib/rate-limiter'
import { checkMessageBatch } from '@/app/lib/message-batcher'
import { logApiCall } from '@/app/lib/api-logger'
import { shouldSwitchToAutoMode, getModeDecisionReason } from '@/app/lib/conversation-mode-analyzer'

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
  const startTime = Date.now()
  let payload: any = null
  
  try {
    payload = await request.json()
    const { from, message, channel, customerName } = payload

    if (!from || !message || !channel) {
      const response = NextResponse.json(
        { error: 'Missing required fields: from, message, channel' },
        { status: 400 }
      )
      
      // Log failed request
      await logApiCall({
        endpoint: '/api/messages/incoming',
        method: 'POST',
        statusCode: 400,
        requestBody: payload,
        responseBody: { error: 'Missing required fields' },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        startTime,
      })
      
      return response
    }

    // Rate limiting: Max 10 messages per minute per phone number (prevents spam)
    const rateLimit = checkRateLimit(from, 'incoming-sms', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
    })

    if (!rateLimit.allowed) {
      console.log(`[Incoming SMS] Rate limited: ${from}`)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many messages. Please slow down.',
        },
        { status: 429 }
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

    // Check if we should batch this message with others (handles rapid messages)
    const batchResult = await checkMessageBatch(
      customer.id,
      conversation.id,
      message
    )

    // If this is part of a batch, combine all messages for a comprehensive response
    const messageToProcess = batchResult.shouldBatch
      ? batchResult.allMessages.join('\n')
      : message

    if (batchResult.shouldBatch) {
      console.log(`[Batching] Combined ${batchResult.allMessages.length} rapid messages from ${from}`)
    }

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

    // Check if conversation is in manual mode
    if (conversation.status !== 'auto') {
      // Check if staff has manually replied in this conversation
      const { data: staffMessages } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('conversation_id', conversation.id)
        .eq('sender', 'staff')
        .order('created_at', { ascending: false })
        .limit(1)
      
      const hasStaffReplied = staffMessages && staffMessages.length > 0
      
      console.log('[Smart Mode] Conversation in manual mode')
      console.log('[Smart Mode] Staff has replied?', hasStaffReplied)
      
      if (hasStaffReplied) {
        // Staff has replied - analyze if we should switch back to auto mode
        const shouldAutoSwitch = shouldSwitchToAutoMode(message)
        const reason = getModeDecisionReason(message, shouldAutoSwitch)
        
        console.log('[Smart Mode] Message:', message.substring(0, 50))
        console.log('[Smart Mode] Should switch to auto?', shouldAutoSwitch)
        console.log('[Smart Mode] Reason:', reason)
        
        if (shouldAutoSwitch) {
          // Switch back to auto mode - this is a generic question AI can handle
          await supabase
            .from('conversations')
            .update({ 
              status: 'auto',
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversation.id)
          
          console.log('[Smart Mode] ✅ Switched to auto mode -', reason)
          
          // Continue to AI response generation below
          // Don't return here - let the AI handle the message
        } else {
          // Stay in manual mode - send alert to staff
          console.log('[Smart Mode] ⏸️  Staying in manual mode -', reason)
          
          await supabase.from('alerts').insert({
            conversation_id: conversation.id,
            type: 'manual_required',
            notified_to: 'admin',
          })

          return NextResponse.json({
            success: true,
            mode: 'manual',
            message: 'Message received - manual response required',
            reason,
          })
        }
      } else {
        // No staff reply yet - just stay in manual mode
        console.log('[Smart Mode] No staff reply yet - staying in manual mode')
        
        await supabase.from('alerts').insert({
          conversation_id: conversation.id,
          type: 'manual_required',
          notified_to: 'admin',
        })

        return NextResponse.json({
          success: true,
          mode: 'manual',
          message: 'Message received - manual response required (no staff reply yet)',
        })
      }
    }

    // Check if staff has recently replied
    // If staff replied, wait a few minutes before AI responds (give staff time to reply)
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('sender, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const lastStaffMessage = recentMessages?.find(
      (msg) => msg.sender === 'staff'
    )

    if (lastStaffMessage) {
      const minutesSinceStaffMessage = 
        (Date.now() - new Date(lastStaffMessage.created_at).getTime()) / 1000 / 60

      // If staff replied within last 5 minutes, wait and let staff handle it
      if (minutesSinceStaffMessage < 5) {
        // Send alert to notify staff of new message
        await supabase.from('alerts').insert({
          conversation_id: conversation.id,
          type: 'manual_required',
          notified_to: 'admin',
        })

        return NextResponse.json({
          success: true,
          mode: 'waiting',
          message: 'Staff recently active - waiting for staff response',
        })
      }
      
      // If staff replied 5+ minutes ago, send a generic holding response
      // This lets the customer know we got their message
    }

    // Generate AI response (using batched message if applicable)
    const aiResult = await generateAIResponse({
      customerMessage: messageToProcess,
      conversationId: conversation.id,
    })

    // Check if AI response indicates manual handoff (more specific patterns)
    const handoffPhrases = [
      /i'?ll pass.*(?:onto|on to|to).*john/i,
      /i'?ll check.*with.*john/i,
      /let me.*check.*with.*john/i,
      /i'?ll.*forward.*(?:this|that|it).*to.*john/i,
      /i'?ll.*ask.*john/i,
      /john.*will.*(?:get back|contact|call)/i,
      /need.*to.*(?:check|speak|talk).*with.*john/i,
      /i'?ll.*have.*john.*(?:contact|call|reach out)/i,
    ]
    
    const indicatesHandoff = handoffPhrases.some(pattern => 
      pattern.test(aiResult.response)
    )

    // Insert AI response
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender: 'ai',
      text: aiResult.response,
      ai_provider: aiResult.provider,
      ai_model: aiResult.model,
      ai_confidence: aiResult.confidence,
    })

    // If fallback was triggered or AI indicates manual handoff, create alert
    // Don't switch modes - just notify staff
    if (aiResult.shouldFallback || indicatesHandoff) {
      await supabase.from('alerts').insert({
        conversation_id: conversation.id,
        type: indicatesHandoff ? 'manual_required' : 'low_confidence',
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

    const responseBody = {
      success: true,
      response: aiResult.response,
      confidence: aiResult.confidence,
      fallback: aiResult.shouldFallback,
      delivered: deliveryStatus.sent,
      deliveryProvider: deliveryStatus.provider,
    }

    // Log successful request
    await logApiCall({
      endpoint: '/api/messages/incoming',
      method: 'POST',
      statusCode: 200,
      requestBody: payload,
      responseBody,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      startTime,
    })

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('Incoming message error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process message'
    
    // Log error
    await logApiCall({
      endpoint: '/api/messages/incoming',
      method: 'POST',
      statusCode: 500,
      requestBody: payload,
      error: errorMessage,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      startTime,
    })
    
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
