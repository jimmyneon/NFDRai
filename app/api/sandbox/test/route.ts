import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProvider } from '@/lib/ai/providers'
import { getBusinessHoursStatus, formatBusinessHoursMessage } from '@/lib/business-hours'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get AI settings
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('active', true)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'No active AI settings found. Please configure AI in Settings first.' },
        { status: 400 }
      )
    }

    // Get pricing and FAQs for context
    const { data: prices } = await supabase
      .from('prices')
      .select('*')
      .or(`expiry.is.null,expiry.gt.${new Date().toISOString()}`)

    const { data: faqs } = await supabase
      .from('faqs')
      .select('*')

    const { data: docs } = await supabase
      .from('docs')
      .select('*')
      .eq('active', true)

    // Get real-time business hours status
    const hoursStatus = await getBusinessHoursStatus()
    const hoursMessage = formatBusinessHoursMessage(hoursStatus)

    // Build context
    const pricingContext = prices
      ?.map((p) => `${p.device} ${p.repair_type}: £${p.cost} (${p.turnaround})`)
      .join('\n') || 'No pricing data available.'

    const faqContext = faqs
      ?.map((f) => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n') || 'No FAQ data available.'

    const docsContext = docs
      ?.map((d) => `[${d.category.toUpperCase()}] ${d.title}:\n${d.content}`)
      .join('\n\n') || 'No additional documentation available.'

    const fullPrompt = `${settings.system_prompt}

CURRENT BUSINESS HOURS STATUS (REAL-TIME):
${hoursMessage}

CRITICAL HOURS RULES:
1. When asked about opening hours or if the business is open, ALWAYS use the REAL-TIME status above
2. The "Current Status" shows if we are OPEN or CLOSED RIGHT NOW
3. NEVER guess or assume - use the exact information provided above
4. If asked "are you open", check the "Current Status" field
5. Always provide the Google Maps link for live updates when discussing hours

Available Pricing:
${pricingContext}

FAQs:
${faqContext}

Knowledge Base Documents:
${docsContext}

Customer Query: ${query}

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
4. Always use real-time business hours information when discussing opening times`

    // Generate AI response directly (no database records needed for sandbox)
    const provider = getProvider(settings.provider)
    const result = await provider.generateResponse({
      prompt: fullPrompt,
      systemPrompt: settings.system_prompt,
      temperature: Number(settings.temperature),
      maxTokens: settings.max_tokens,
      apiKey: settings.api_key,
      model: settings.model_name,
    })

    return NextResponse.json({
      text: result.response,
      confidence: result.confidence,
      provider: settings.provider,
      model: settings.model_name,
      settings: {
        temperature: Number(settings.temperature),
        maxTokens: settings.max_tokens,
        confidenceThreshold: settings.confidence_threshold,
      },
    })
  } catch (error) {
    console.error('Sandbox test error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate response' },
      { status: 500 }
    )
  }
}
