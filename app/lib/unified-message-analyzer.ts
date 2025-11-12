/**
 * Unified Message Analyzer
 * 
 * ONE AI CALL to analyze:
 * 1. Sentiment (frustrated, angry, etc.)
 * 2. Intent (what customer wants)
 * 3. Context confidence (should AI respond?)
 * 4. Customer name extraction (if introducing themselves)
 * 5. Urgency level
 * 
 * COST: $0.0002 per message (vs $0.0003+ for 3 separate calls)
 * SPEED: 1 API call instead of 3
 * ACCURACY: Better because AI sees full context at once
 */

import { OpenAI } from 'openai'

export interface UnifiedAnalysis {
  // Sentiment
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | 'angry'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  requiresStaffAttention: boolean
  sentimentKeywords: string[]
  
  // Intent
  intent: 'question' | 'complaint' | 'booking' | 'status_check' | 'greeting' | 'acknowledgment' | 'device_issue' | 'buyback' | 'purchase' | 'unclear'
  intentConfidence: number
  
  // Content Type (NEW!)
  contentType: 'pricing' | 'business_hours' | 'location' | 'services' | 'warranty' |
               'troubleshooting' | 'water_damage' | 'battery_issue' | 'screen_damage' |
               'camera_issue' | 'charging_issue' | 'software_issue' |
               'device_sale' | 'device_purchase' | 'appointment' | 'repair_status' |
               'introduction' | 'acknowledgment' | 'dissatisfaction' | 'unclear'
  
  // Context
  shouldAIRespond: boolean
  contextConfidence: number
  isDirectedAtAI: boolean
  reasoning: string
  
  // Name extraction
  customerName: string | null
  nameConfidence: number
  
  // Overall
  overallConfidence: number
}

/**
 * Quick regex pre-check (free, instant)
 * Returns null if needs AI analysis
 */
export function quickAnalysis(
  message: string,
  recentMessages: Array<{ sender: string; text: string }>
): UnifiedAnalysis | null {
  const lowerMessage = message.toLowerCase().trim()
  
  // VERY CLEAR CASES - Don't need AI
  
  // 1. Pure acknowledgments (don't respond)
  const acknowledgmentPatterns = [
    /^(ok|okay|alright|sure|fine|thanks|thank you|cheers|ta)[\s.!]*$/i,
    /^(yes|yeah|yep|yup|no|nope|nah)[\s.!]*$/i,
    /^(got it|understood|sounds good|perfect|great)[\s.!]*$/i,
  ]
  
  for (const pattern of acknowledgmentPatterns) {
    if (pattern.test(message) && message.length < 30) {
      return {
        sentiment: 'neutral',
        urgency: 'low',
        requiresStaffAttention: false,
        sentimentKeywords: [],
        intent: 'acknowledgment',
        intentConfidence: 0.9,
        contentType: 'acknowledgment',
        shouldAIRespond: false,
        contextConfidence: 0.9,
        isDirectedAtAI: false,
        reasoning: 'Pure acknowledgment - no response needed',
        customerName: null,
        nameConfidence: 0,
        overallConfidence: 0.9,
      }
    }
  }
  
  // 2. Clearly frustrated (high confidence)
  const frustrationKeywords = [
    'third time', 'still waiting', 'ridiculous', 'unacceptable',
    'terrible', 'worst', 'disgusting', 'complaint',
    'ai failure', 'ai fail', 'not helping', 'useless',
  ]
  
  const hasFrustration = frustrationKeywords.some(kw => lowerMessage.includes(kw))
  if (hasFrustration) {
    return {
      sentiment: 'frustrated',
      urgency: 'high',
      requiresStaffAttention: true,
      sentimentKeywords: frustrationKeywords.filter(kw => lowerMessage.includes(kw)),
      intent: 'complaint',
      intentConfidence: 0.8,
      contentType: 'dissatisfaction',
      shouldAIRespond: false,
      contextConfidence: 0.9,
      isDirectedAtAI: true,
      reasoning: 'Customer is frustrated - needs staff attention',
      customerName: null,
      nameConfidence: 0,
      overallConfidence: 0.8,
    }
  }
  
  // 3. Clearly angry (high confidence)
  const angerKeywords = [
    'money back', 'refund', 'never again', 'report you',
    'trading standards', 'lawyer', 'solicitor', 'sue',
  ]
  
  const hasAnger = angerKeywords.some(kw => lowerMessage.includes(kw))
  if (hasAnger) {
    return {
      sentiment: 'angry',
      urgency: 'critical',
      requiresStaffAttention: true,
      sentimentKeywords: angerKeywords.filter(kw => lowerMessage.includes(kw)),
      intent: 'complaint',
      intentConfidence: 0.9,
      contentType: 'dissatisfaction',
      shouldAIRespond: false,
      contextConfidence: 0.95,
      isDirectedAtAI: true,
      reasoning: 'Customer is very angry - urgent staff attention required',
      customerName: null,
      nameConfidence: 0,
      overallConfidence: 0.9,
    }
  }
  
  // 4. Referring to physical person or asking staff to call back (don't respond)
  const physicalPersonPatterns = [
    /for (the )?(tall|short|big|small|young|old)?\s*(guy|man|gentleman|person|bloke|lad|chap)/i,
    /with (the )?(beard|glasses|tattoo|hat)/i,
    /tell (him|her|them|john)/i,
    /(phone|call|ring)\s+(me|us)\s+(when|once|after)/i,  // "phone me when you start"
    /(can|could|would)\s+you\s+(phone|call|ring)\s+(me|us)/i,  // "can you phone me"
    /if\s+you\s+(can|could)\s+(phone|call|ring)/i,  // "if you can phone me"
  ]
  
  for (const pattern of physicalPersonPatterns) {
    if (pattern.test(message)) {
      return {
        sentiment: 'neutral',
        urgency: 'medium',  // Changed from 'low' - callback requests need attention
        requiresStaffAttention: true,
        sentimentKeywords: [],
        intent: 'unclear',
        intentConfidence: 0.5,
        contentType: 'unclear',
        shouldAIRespond: false,
        contextConfidence: 0.85,
        isDirectedAtAI: false,
        reasoning: 'Customer requesting callback from staff',
        customerName: null,
        nameConfidence: 0,
        overallConfidence: 0.8,
      }
    }
  }
  
  // 5. Simple questions (can respond)
  const simpleQuestionPatterns = [
    /when (are|do) you (open|close)/i,
    /what (time|are your hours)/i,
    /where are you/i,
    /how much (for|is|does)/i,
    /do you (fix|repair|do)/i,
  ]
  
  for (const pattern of simpleQuestionPatterns) {
    if (pattern.test(message)) {
      // Detect content type from pattern
      let contentType: UnifiedAnalysis['contentType'] = 'unclear'
      if (/when (are|do) you (open|close)|what (time|are your hours)/i.test(message)) {
        contentType = 'business_hours'
      } else if (/where are you|location|address/i.test(message)) {
        contentType = 'location'
      } else if (/how much/i.test(message)) {
        contentType = 'pricing'
      } else if (/do you (fix|repair|do)/i.test(message)) {
        contentType = 'services'
      }
      
      return {
        sentiment: 'neutral',
        urgency: 'low',
        requiresStaffAttention: false,
        sentimentKeywords: [],
        intent: 'question',
        intentConfidence: 0.85,
        contentType,
        shouldAIRespond: true,
        contextConfidence: 0.85,
        isDirectedAtAI: true,
        reasoning: 'Simple question AI can answer',
        customerName: null,
        nameConfidence: 0,
        overallConfidence: 0.85,
      }
    }
  }
  
  // Need AI analysis for uncertain cases
  return null
}

/**
 * Full AI analysis (when regex is uncertain)
 */
export async function analyzeWithAI(
  message: string,
  recentMessages: Array<{ sender: string; text: string }>,
  apiKey: string
): Promise<UnifiedAnalysis> {
  try {
    const openai = new OpenAI({ apiKey })
    
    // Build conversation context
    const contextStr = recentMessages
      .slice(-5) // Last 5 messages
      .map(m => `${m.sender === 'staff' ? 'John (Owner)' : 'Customer'}: ${m.text}`)
      .join('\n')
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `You are an expert customer service analyst. Analyze the customer's message and provide a comprehensive assessment.

RECENT CONVERSATION CONTEXT:
${contextStr || 'No previous messages'}

ANALYZE THE FOLLOWING:

1. SENTIMENT:
   - positive: Happy, satisfied, grateful
   - neutral: Factual, no strong emotion
   - negative: Disappointed, concerned
   - frustrated: Impatient, annoyed, repeated questions
   - angry: Very upset, threatening, demanding

2. URGENCY:
   - low: Casual inquiry, no time pressure
   - medium: Wants response soon
   - high: Needs immediate attention, impatient
   - critical: Emergency, very upset, threatening to leave

3. INTENT (what customer wants):
   - question: Asking for information
   - complaint: Expressing dissatisfaction
   - booking: Wants to book/schedule
   - status_check: Checking on existing repair
   - greeting: Introducing themselves
   - acknowledgment: Simple "ok", "thanks", etc.
   - device_issue: Technical problem with device
   - buyback: Wants to sell device
   - purchase: Wants to buy device
   - unclear: Can't determine intent

4. CONTENT TYPE (specific topic):
   Questions: pricing, business_hours, location, services, warranty
   Device Issues: troubleshooting, water_damage, battery_issue, screen_damage, camera_issue, charging_issue, software_issue
   Transactions: device_sale, device_purchase, appointment, repair_status
   Communication: introduction, acknowledgment, dissatisfaction, unclear

5. CONTEXT CONFIDENCE:
   - Is message directed at AI or at a physical person?
   - Does message make sense in context?
   - Would AI response be helpful or confusing?
   - Should AI respond or stay silent?

6. NAME EXTRACTION:
   - Is customer introducing themselves? ("Hi, I'm Carol", "This is Mike", "Carol here")
   - Extract ONLY first name if present
   - Don't extract staff names (John)

OUTPUT FORMAT (JSON only, no markdown):
{
  "sentiment": "positive|neutral|negative|frustrated|angry",
  "urgency": "low|medium|high|critical",
  "requiresStaffAttention": true|false,
  "sentimentKeywords": ["keyword1", "keyword2"],
  "intent": "question|complaint|booking|status_check|greeting|acknowledgment|device_issue|buyback|purchase|unclear",
  "intentConfidence": 0.0-1.0,
  "contentType": "pricing|business_hours|location|services|warranty|troubleshooting|water_damage|battery_issue|screen_damage|camera_issue|charging_issue|software_issue|device_sale|device_purchase|appointment|repair_status|introduction|acknowledgment|dissatisfaction|unclear",
  "shouldAIRespond": true|false,
  "contextConfidence": 0.0-1.0,
  "isDirectedAtAI": true|false,
  "reasoning": "Brief explanation of decision",
  "customerName": "Name" or null,
  "nameConfidence": 0.0-1.0,
  "overallConfidence": 0.0-1.0
}`
        },
        {
          role: 'user',
          content: `Analyze this message: "${message}"`
        }
      ]
    })
    
    const content = response.choices[0]?.message?.content?.trim() || '{}'
    
    // Parse JSON response
    const analysis = JSON.parse(content) as UnifiedAnalysis
    
    console.log('[Unified Analysis] AI result:', {
      sentiment: analysis.sentiment,
      intent: analysis.intent,
      shouldRespond: analysis.shouldAIRespond,
      confidence: analysis.overallConfidence,
    })
    
    return analysis
    
  } catch (error) {
    console.error('[Unified Analysis] AI error:', error)
    
    // Safe fallback
    return {
      sentiment: 'neutral',
      urgency: 'medium',
      requiresStaffAttention: true,
      sentimentKeywords: [],
      intent: 'unclear',
      intentConfidence: 0.3,
      contentType: 'unclear',
      shouldAIRespond: false,
      contextConfidence: 0.3,
      isDirectedAtAI: true,
      reasoning: 'AI analysis failed - defaulting to manual mode for safety',
      customerName: null,
      nameConfidence: 0,
      overallConfidence: 0.3,
    }
  }
}

/**
 * Main entry point - uses regex first, AI if uncertain
 */
export async function analyzeMessage(
  message: string,
  recentMessages: Array<{ sender: string; text: string }>,
  apiKey?: string
): Promise<UnifiedAnalysis> {
  // Try quick regex analysis first
  const quickResult = quickAnalysis(message, recentMessages)
  
  if (quickResult) {
    console.log('[Unified Analysis] Regex result:', {
      sentiment: quickResult.sentiment,
      intent: quickResult.intent,
      shouldRespond: quickResult.shouldAIRespond,
      confidence: quickResult.overallConfidence,
    })
    return quickResult
  }
  
  // Need AI analysis
  if (!apiKey) {
    console.log('[Unified Analysis] No API key - defaulting to safe mode')
    return {
      sentiment: 'neutral',
      urgency: 'medium',
      requiresStaffAttention: true,
      sentimentKeywords: [],
      intent: 'unclear',
      intentConfidence: 0.5,
      contentType: 'unclear',
      shouldAIRespond: false,
      contextConfidence: 0.5,
      isDirectedAtAI: true,
      reasoning: 'No API key available - defaulting to manual mode for safety',
      customerName: null,
      nameConfidence: 0,
      overallConfidence: 0.5,
    }
  }
  
  console.log('[Unified Analysis] Using AI for uncertain case...')
  return analyzeWithAI(message, recentMessages, apiKey)
}
