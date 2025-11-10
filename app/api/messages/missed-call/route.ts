import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMessageViaProvider } from '@/app/lib/messaging/provider'
import { checkRateLimit } from '@/app/lib/rate-limiter'

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

    // Compose a friendly, concise missed-call message
    // Improved: warmer tone, shorter, emphasizes speed, maintains AI disclosure
    const apologyMessage = [
      'Sorry we missed your call!',
      '',
      'I can help with pricing, bookings, or any questions you have. Just text back and I\'ll get you sorted straight away.',
      '',
      'Many thanks,',
      'AI Steve',
      'New Forest Device Repairs'
    ].join('\n')

    if (conversation) {
      // Log the AI response
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender: 'ai',
        text: apologyMessage,
        ai_provider: 'system',
        ai_model: 'missed-call-template',
        ai_confidence: 1.0,
      })

      // Send via MacroDroid webhook
      await sendMessageViaProvider({
        channel: 'sms',
        to: from,
        text: apologyMessage,
      })
    }

    console.log(`[Missed Call] Missed-call template sent successfully`)

    return NextResponse.json({
      success: true,
      message: apologyMessage,
      messages: [apologyMessage],
      messageCount: 1,
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
