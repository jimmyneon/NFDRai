import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMessageViaProvider } from '@/app/lib/messaging/provider'
import { checkRateLimit } from '@/app/lib/rate-limiter'
import { generateAIResponse } from '@/lib/ai/response-generator'

/**
 * POST /api/messages/missed-call
 * Handle missed call notifications from MacroDroid
 * Generate AI response with business info, opening hours, services
 * 
 * Expected payload:
 * {
 *   "from": "+1234567890",
 *   "channel": "sms"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with explicit UTF-8 handling
    const rawBody = await request.text()
    const payload = JSON.parse(rawBody)
    const { from, channel = 'sms' } = payload

    if (!from) {
      return NextResponse.json(
        { error: 'Missing required field: from' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      )
    }

    // Rate limiting: Max 1 missed call response per 2 minutes per phone number
    const rateLimit = checkRateLimit(from, 'missed-call', {
      windowMs: 2 * 60 * 1000, // 2 minutes
      maxRequests: 1,
    })

    if (!rateLimit.allowed) {
      console.log(`[Missed Call] Rate limited: ${from} (retry after ${rateLimit.retryAfter}s)`)
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Please wait before calling again',
          retryAfter: rateLimit.retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
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
          phone: from,
        })
        .select()
        .single()

      customer = newCustomer
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('customer_id', customer?.id || '')
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
        .select('*, messages(*)')
        .single()

      conversation = newConversation
    }

    // Log the missed call as a system message
    if (conversation) {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender: 'system',
        text: `Missed call from ${from}`,
      })
    }

    // Generate AI response using the normal AI system with all guardrails
    const aiResponse = await generateAIResponse({
      customerMessage: 'You just missed my call. What can you help me with?',
      conversationId: conversation?.id || '',
    })

    console.log(`[Missed Call] Generated ${aiResponse.responses.length} message(s) for ${from}`)

    // Handle multiple messages (split by |||)
    if (conversation) {
      for (let i = 0; i < aiResponse.responses.length; i++) {
        const messageText = aiResponse.responses[i]
        
        // Log the AI response
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender: 'ai',
          text: messageText,
          ai_provider: aiResponse.provider,
          ai_model: aiResponse.model,
          ai_confidence: aiResponse.confidence,
        })

        // Send via MacroDroid webhook
        await sendMessageViaProvider({
          channel: 'sms',
          to: from,
          text: messageText,
        })

        // Add 2-second delay between messages (except after last one)
        if (i < aiResponse.responses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    console.log(`[Missed Call] All messages sent successfully`)

    return NextResponse.json({
      success: true,
      message: aiResponse.response,
      messages: aiResponse.responses,
      messageCount: aiResponse.responses.length,
      delivered: true,
      deliveryProvider: 'macrodroid',
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Missed call handler error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate missed call response',
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  }
}
