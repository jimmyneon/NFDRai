/**
 * Context Confidence Checker
 * Determines if AI should respond based on message context and clarity
 * Prevents AI from responding to messages that don't make sense or aren't directed at it
 */

import { OpenAI } from 'openai'

export interface ContextConfidence {
  shouldRespond: boolean
  confidence: number
  reasoning: string
  isDirectedAtAI: boolean
  contextMakesSense: boolean
  wouldBeHelpful: boolean
}

/**
 * Quick regex-based context check (fast, free)
 */
export function quickContextCheck(
  message: string,
  recentMessages: Array<{ sender: string; text: string }>
): ContextConfidence {
  const lowerMessage = message.toLowerCase()
  
  // Patterns that suggest message is NOT for AI
  const notForAIPatterns = [
    // Referring to physical person
    /for (the )?(tall|short|big|small|young|old)?\s*(guy|man|gentleman|person|bloke|lad|chap)/i,
    /with (the )?(beard|glasses|tattoo|hat)/i,
    
    // Vague/unclear messages
    /^(it's|its|this is|that's|thats)\s+for\s+/i,
    /^(tell|give|pass|show)\s+(him|her|them|john)/i,
    
    // Messages that need context we don't have
    /^(yes|yeah|yep|yup|no|nope|nah)[\s.!]*$/i,
    /^(ok|okay|alright|sure|fine)[\s.!]*$/i,
    
    // Continuing previous conversation we're not part of
    /^(and|also|plus|but|so|then)/i,
  ]
  
  for (const pattern of notForAIPatterns) {
    if (pattern.test(message)) {
      return {
        shouldRespond: false,
        confidence: 0.8,
        reasoning: 'Message appears to be directed at someone else or lacks context',
        isDirectedAtAI: false,
        contextMakesSense: false,
        wouldBeHelpful: false
      }
    }
  }
  
  // Check if message is very short and vague
  const words = message.trim().split(/\s+/)
  if (words.length <= 3 && !message.includes('?')) {
    return {
      shouldRespond: false,
      confidence: 0.7,
      reasoning: 'Message too short and vague to respond confidently',
      isDirectedAtAI: false,
      contextMakesSense: false,
      wouldBeHelpful: false
    }
  }
  
  // Default: probably OK to respond
  return {
    shouldRespond: true,
    confidence: 0.6,
    reasoning: 'No obvious issues detected',
    isDirectedAtAI: true,
    contextMakesSense: true,
    wouldBeHelpful: true
  }
}

/**
 * AI-powered context check (accurate, cheap)
 */
export async function checkContextWithAI(
  message: string,
  recentMessages: Array<{ sender: string; text: string }>,
  apiKey: string
): Promise<ContextConfidence> {
  try {
    const openai = new OpenAI({ apiKey })
    
    // Build conversation context
    const conversationContext = recentMessages
      .slice(-5) // Last 5 messages
      .map(m => `${m.sender === 'customer' ? 'Customer' : m.sender === 'staff' ? 'John (Owner)' : 'AI Steve'}: ${m.text}`)
      .join('\n')
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are a context analyzer for an AI assistant (AI Steve) at a phone repair shop.

Your job: Determine if the customer's latest message is directed at AI Steve and if AI Steve should respond.

CONTEXT TO CONSIDER:
1. Is the message directed at AI Steve or at John (the human owner)?
2. Does the message make sense given the conversation history?
3. Would an AI response be helpful or confusing/annoying?
4. Is the customer referring to something physical (like "the tall guy with beard")?
5. Is the message too vague to respond to confidently?

WHEN AI SHOULD NOT RESPOND:
- Message refers to physical person ("the tall guy", "the one with beard")
- Message is for John specifically ("tell John", "for the owner")
- Message is too vague without context ("it's for...", "yes", "ok")
- Customer is continuing a conversation AI wasn't part of
- Message doesn't make sense as a repair inquiry
- Responding would likely confuse or annoy the customer

OUTPUT FORMAT (JSON only):
{
  "shouldRespond": false,
  "confidence": 0.9,
  "reasoning": "Customer is referring to a physical person ('tall gentleman with beard'), clearly directed at John not AI",
  "isDirectedAtAI": false,
  "contextMakesSense": false,
  "wouldBeHelpful": false
}

Be conservative - when in doubt, don't respond. Better to stay silent than annoy the customer.`
        },
        {
          role: 'user',
          content: `Recent conversation:
${conversationContext}

Latest customer message: "${message}"

Should AI Steve respond to this message?`
        }
      ]
    })
    
    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      return getDefaultConfidence()
    }
    
    const result = JSON.parse(content)
    
    return {
      shouldRespond: result.shouldRespond ?? true,
      confidence: result.confidence ?? 0.5,
      reasoning: result.reasoning ?? 'No analysis available',
      isDirectedAtAI: result.isDirectedAtAI ?? true,
      contextMakesSense: result.contextMakesSense ?? true,
      wouldBeHelpful: result.wouldBeHelpful ?? true
    }
  } catch (error) {
    console.error('[Context Confidence] AI check error:', error)
    return getDefaultConfidence()
  }
}

/**
 * Smart context check: Try regex first, use AI for uncertain cases
 */
export async function checkContextConfidence(
  message: string,
  recentMessages: Array<{ sender: string; text: string }>,
  apiKey?: string
): Promise<ContextConfidence> {
  // STEP 1: Quick regex check
  const regexResult = quickContextCheck(message, recentMessages)
  
  // STEP 2: If high confidence from regex, use it
  if (regexResult.confidence >= 0.7) {
    console.log('[Context Check] ✅ Regex decision:', regexResult.shouldRespond ? 'RESPOND' : 'STAY SILENT', `(${regexResult.confidence})`)
    console.log('[Context Check] Reasoning:', regexResult.reasoning)
    return regexResult
  }
  
  // STEP 3: If uncertain and API key available, verify with AI
  if (apiKey) {
    console.log('[Context Check] 🤔 Regex uncertain - verifying with AI...')
    const aiResult = await checkContextWithAI(message, recentMessages, apiKey)
    
    if (aiResult.confidence > 0.7) {
      console.log('[Context Check] ✅ AI decision:', aiResult.shouldRespond ? 'RESPOND' : 'STAY SILENT', `(${aiResult.confidence})`)
      console.log('[Context Check] Reasoning:', aiResult.reasoning)
      return aiResult
    }
  }
  
  // STEP 4: Default to regex result
  console.log('[Context Check] ✅ Using regex result:', regexResult.shouldRespond ? 'RESPOND' : 'STAY SILENT')
  return regexResult
}

/**
 * Default confidence (allow response)
 */
function getDefaultConfidence(): ContextConfidence {
  return {
    shouldRespond: true,
    confidence: 0.5,
    reasoning: 'Default - no clear reason to stay silent',
    isDirectedAtAI: true,
    contextMakesSense: true,
    wouldBeHelpful: true
  }
}
