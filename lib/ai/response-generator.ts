import { createClient } from '@/lib/supabase/server'
import { getProvider } from './providers'

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

  // Get conversation context
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: true })
    .limit(10)

  // Build context from previous messages
  const conversationContext = messages
    ?.map((m) => `${m.sender}: ${m.text}`)
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

  // Build enhanced system prompt with context
  const enhancedPrompt = `
${settings.system_prompt}

IMPORTANT CONTEXT:

Available Pricing:
${prices?.map(p => `- ${p.device} ${p.repair_type}: £${p.cost} (${p.turnaround})`).join('\n') || 'No pricing data available'}

Frequently Asked Questions:
${faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') || 'No FAQs available'}

Knowledge Base Documents:
${docs?.map(d => `[${d.category.toUpperCase()}] ${d.title}:\n${d.content}`).join('\n\n') || 'No additional documentation available'}

Previous Conversation:
${conversationContext}

Customer's Current Message:
${params.customerMessage}

CRITICAL PRICING RULES:
1. ONLY use prices from the "Available Pricing" section above
2. If a device or repair type is NOT listed in "Available Pricing", you MUST say "I don't have pricing information for that specific repair. Let me connect you with someone who can help."
3. NEVER estimate, guess, or make up prices under any circumstances
4. NEVER provide price ranges unless they are explicitly listed above
5. If asked about a repair not in the pricing list, acknowledge the question but clearly state you need to check with the team

GENERAL RULES:
1. Be friendly, professional, and concise
2. If you don't know something, admit it immediately
3. If the query is complex or requires human judgment, indicate lower confidence
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
