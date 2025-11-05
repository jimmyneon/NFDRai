import { createClient } from '@/lib/supabase/server'
import { getProvider } from './providers'
import { getBusinessHoursStatus, formatBusinessHoursMessage } from '@/lib/business-hours'

export async function generateAIResponse(params: {
  customerMessage: string
  conversationId: string
}): Promise<{
  response: string
  confidence: number
  provider: string
  model: string
  shouldFallback: boolean
}> {
  const supabase = await createClient()

  // Get active AI settings
  const { data: settings, error: settingsError } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('active', true)
    .single()

  if (settingsError || !settings) {
    throw new Error('No active AI settings found')
  }

  // Get conversation context - fetch more messages for better context
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  // Build context from previous messages with clear labels
  const conversationContext = messages
    ?.map((m) => {
      // Make sender labels explicit for AI to understand
      const senderLabel = m.sender === 'staff' ? 'John (Owner)' : 
                         m.sender === 'ai' ? 'AI Assistant' : 
                         'Customer'
      return `${senderLabel}: ${m.text}`
    })
    .join('\n') || ''

  // Get relevant pricing data
  const { data: prices } = await supabase
    .from('prices')
    .select('*')
    .or(`expiry.is.null,expiry.gt.${new Date().toISOString()}`)

  // Get FAQs
  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')

  // Get active knowledge base docs
  const { data: docs } = await supabase
    .from('docs')
    .select('*')
    .eq('active', true)

  // Get real-time business hours status
  const hoursStatus = await getBusinessHoursStatus()
  const hoursMessage = formatBusinessHoursMessage(hoursStatus)

  // Build enhanced system prompt with context
  const enhancedPrompt = `
${settings.system_prompt}

═══════════════════════════════════════════════════════════════
🔴 STEP 1: READ THE CONVERSATION HISTORY FIRST (CRITICAL!)
═══════════════════════════════════════════════════════════════

Previous Conversation:
${conversationContext || 'No previous messages in this conversation.'}

Customer's Current Message:
${params.customerMessage}

⚠️ MANDATORY CONTEXT RULES - READ BEFORE RESPONDING:
1. ALWAYS read the ENTIRE conversation history above BEFORE formulating your response
2. NEVER ask for information the customer has ALREADY PROVIDED in previous messages
3. If the customer mentioned their name, device, or issue before - USE THAT INFORMATION
4. PAY SPECIAL ATTENTION to messages from "John (Owner)" - these contain important context like appointments, pricing, and commitments
5. If customer says "still on for tomorrow" or similar, CHECK THE HISTORY for what was arranged
6. Build on the conversation naturally - don't restart from scratch each time
7. Reference previous messages when relevant (e.g., "Based on the appointment John arranged for tomorrow...")
8. If you're unsure what they already told you, CHECK THE HISTORY ABOVE - the answer is there
9. When customer references something from earlier ("that repair", "tomorrow", "the price you quoted"), FIND IT in the history above

═══════════════════════════════════════════════════════════════
STEP 2: REFERENCE DATA & BUSINESS INFORMATION
═══════════════════════════════════════════════════════════════

CURRENT BUSINESS HOURS STATUS (REAL-TIME):
${hoursMessage}

CRITICAL HOURS RULES:
1. When asked about opening hours or if the business is open, ALWAYS use the REAL-TIME status above
2. The "Current Status" shows if we are OPEN or CLOSED RIGHT NOW
3. NEVER guess or assume - use the exact information provided above
4. If asked "are you open", check the "Current Status" field
5. Always provide the Google Maps link for live updates when discussing hours

Available Pricing:
${prices?.map(p => `- ${p.device} ${p.repair_type}: £${p.cost} (${p.turnaround})`).join('\n') || 'No pricing data available'}

Frequently Asked Questions:
${faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') || 'No FAQs available'}

Knowledge Base Documents:
${docs?.map(d => `[${d.category.toUpperCase()}] ${d.title}:\n${d.content}`).join('\n\n') || 'No additional documentation available'}

═══════════════════════════════════════════════════════════════
STEP 3: APPLY THESE RULES WHEN RESPONDING
═══════════════════════════════════════════════════════════════

CRITICAL PRICING RULES:
1. ONLY use prices from the "Available Pricing" section above
2. If a device or repair type is NOT listed in "Available Pricing", you MUST say "I don't have pricing information for that specific repair. Let me connect you with someone who can help."
3. NEVER estimate, guess, or make up prices under any circumstances
4. NEVER provide price ranges unless they are explicitly listed above
5. If asked about a repair not in the pricing list, acknowledge the question but clearly state you need to check with the team

GENERAL RULES:
1. Be friendly, professional, and concise
2. Be confident - you can handle most queries yourself
3. ONLY pass to John for: explicit requests to speak to owner, complex disputes, unusual custom work, or business partnerships
4. DO NOT pass to John for: standard repairs, pricing, hours, bookings, buybacks, sales, accessories, or warranty questions
5. If you don't have exact info, offer alternatives: "Pop in for details" or "Send me more info and I'll get back to you ASAP"
6. Always use real-time business hours information when discussing opening times

⚠️ CRITICAL: NEVER USE EMOJIS ⚠️
- Do NOT use emojis, emoticons, or special characters in your response
- SMS does not display them correctly
- Use plain text only - no symbols, no emoticons
- This is MANDATORY - absolutely no exceptions
`

  // Get AI provider and generate response
  const provider = getProvider(settings.provider)
  
  const result = await provider.generateResponse({
    prompt: enhancedPrompt,
    systemPrompt: settings.system_prompt,
    temperature: settings.temperature,
    maxTokens: settings.max_tokens,
    apiKey: settings.api_key,
    model: settings.model_name,
  })

  const shouldFallback = result.confidence < settings.confidence_threshold

  return {
    response: shouldFallback ? settings.fallback_message : result.response,
    confidence: result.confidence,
    provider: settings.provider,
    model: settings.model_name,
    shouldFallback,
  }
}
