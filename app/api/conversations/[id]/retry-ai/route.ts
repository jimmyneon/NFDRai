import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSmartResponse } from '@/lib/ai/smart-response-generator'
import { sendMessageViaProvider } from '@/app/lib/messaging/provider'

/**
 * POST /api/conversations/[id]/retry-ai
 * 
 * Manually trigger AI to respond to the latest customer message
 * Used when AI didn't respond due to mode switching or blocking checks
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()

    // Get conversation and verify it exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, customer:customers(*)')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get the latest customer message
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('sender', 'customer')
      .order('created_at', { ascending: false })
      .limit(1)

    if (msgError || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No customer messages found' },
        { status: 404 }
      )
    }

    const latestMessage = messages[0]

    console.log('[Manual AI Retry] Generating AI response for:', latestMessage.text.substring(0, 50))

    // Generate AI response
    const aiResult = await generateSmartResponse({
      customerMessage: latestMessage.text,
      conversationId: conversation.id,
      customerPhone: conversation.customer.phone,
    })

    console.log('[Manual AI Retry] Response generated:', {
      state: aiResult.context.state,
      intent: aiResult.context.intent,
      confidence: aiResult.confidence,
      responsesCount: aiResult.responses.length,
    })

    // Send each response
    for (let i = 0; i < aiResult.responses.length; i++) {
      const messageText = aiResult.responses[i]

      console.log(`[Manual AI Retry] Sending message ${i + 1}/${aiResult.responses.length}`)

      // Insert AI response into database
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender: 'ai',
        text: messageText,
        ai_provider: aiResult.provider,
        ai_model: aiResult.model,
        ai_confidence: aiResult.confidence,
      })

      // Send message via provider
      await sendMessageViaProvider({
        channel: 'sms',
        to: conversation.customer.phone,
        text: messageText,
      })

      // Add delay between messages
      if (i < aiResult.responses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    return NextResponse.json({
      success: true,
      message: 'AI response sent',
      responsesCount: aiResult.responses.length,
      confidence: aiResult.confidence,
    })
  } catch (error) {
    console.error('[Manual AI Retry] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}
