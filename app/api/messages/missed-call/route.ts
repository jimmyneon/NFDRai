import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMessageViaProvider } from '@/app/lib/messaging/provider'

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
    const payload = await request.json()
    const { from, channel = 'sms' } = payload

    if (!from) {
      return NextResponse.json(
        { error: 'Missing required field: from' },
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
          phone: from,
        })
        .select()
        .single()

      customer = newCustomer
    }

    // Check if customer has any active conversations or repairs
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('customer_id', customer?.id || '')
      .order('updated_at', { ascending: false })
      .limit(1)

    // Get business info
    const { data: businessInfo } = await supabase
      .from('business_info')
      .select('*')
      .eq('active', true)
      .single()

    // Determine context
    const isExistingCustomer = conversations && conversations.length > 0
    const customerName = customer?.name || null
    const hasActiveRepair = conversations?.[0]?.status === 'auto' || conversations?.[0]?.status === 'manual'

    // Check if within business hours
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay() // 0 = Sunday, 6 = Saturday
    const isBusinessHours = day >= 1 && day <= 6 && hour >= 9 && hour < 18 // Mon-Sat 9am-6pm

    // Generate contextual response
    let response = ''

    // Greeting
    if (customerName) {
      response += `Hi ${customerName}! `
    } else {
      response += 'Hi! '
    }

    response += `This is ${businessInfo?.name || 'NFD Repairs'}. Sorry I missed your call!\n\n`

    // Active repair status
    if (hasActiveRepair) {
      response += `I see you have an active repair with us. `
      if (conversations?.[0]?.status === 'manual') {
        response += `I'll check on the status for you!\n\n`
      }
    }

    // Business hours status
    if (!isBusinessHours) {
      response += `We're currently closed. Our hours are ${businessInfo?.opening_hours || 'Mon-Sat 9am-6pm'}.\n\n`
    }

    // Services offered
    response += `I can help you with:\n`
    response += `• Screen repairs & quotes (iPhone, Samsung, all brands)\n`
    response += `• Check your repair status\n`
    response += `• Opening hours & location\n`
    response += `• Any phone/tablet repair questions\n\n`

    // Call to action
    if (isBusinessHours) {
      response += `Just text me what you need and I'll respond right away! Or call back - we're open until 6pm.\n\n`
    } else {
      response += `Just text me what you need and I'll respond right away! Or call back during business hours.\n\n`
    }

    // Signature
    response += `- ${businessInfo?.name || 'NFD Repairs'} Team`

    // Log the missed call as a conversation
    if (customer) {
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

      // Log the missed call as a system message
      if (conversation) {
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender: 'system',
          text: `Missed call from ${from}`,
        })

        // Log the auto-response
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender: 'ai',
          text: response,
          ai_provider: 'system',
          ai_model: 'missed-call-template',
          ai_confidence: 100,
        })
      }
    }

    console.log(`[Missed Call] Generated response for ${from}`)

    // Send via MacroDroid webhook
    const deliveryStatus = await sendMessageViaProvider({
      channel: 'sms',
      to: from,
      text: response,
    })

    console.log(`[Missed Call] Delivery status:`, deliveryStatus)

    return NextResponse.json({
      success: true,
      message: response,
      isExistingCustomer,
      isBusinessHours,
      delivered: deliveryStatus.sent,
      deliveryProvider: deliveryStatus.provider,
    })
  } catch (error) {
    console.error('Missed call handler error:', error)
    
    // Fallback response if something goes wrong
    const fallbackResponse = 
      `Hi! This is NFD Repairs. Sorry I missed your call!\n\n` +
      `I can help with screen repairs, quotes, and repair status.\n\n` +
      `Just text me what you need and I'll respond right away!\n\n` +
      `Opening hours: Mon-Sat 9am-6pm\n\n` +
      `- NFD Repairs Team`

    return NextResponse.json({
      success: true,
      message: fallbackResponse,
      error: 'Used fallback response',
    })
  }
}
