/**
 * AI-powered name extraction from staff messages
 * More accurate than regex patterns for handling variations like:
 * - "Hi Carol"
 * - "Hi there Carol"
 * - "Carol,"
 * - "Hi Carol, your phone is ready"
 * - Just "Carol" at the start
 */

import { OpenAI } from 'openai'

export interface AIExtractedName {
  name: string | null
  confidence: number
  reasoning?: string
}

/**
 * Extract customer name from staff message using AI
 */
export async function extractNameWithAI(
  message: string,
  apiKey: string
): Promise<AIExtractedName> {
  try {
    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap
      temperature: 0, // Deterministic
      max_tokens: 50,
      messages: [
        {
          role: 'system',
          content: `You are a name extraction expert. Extract the customer's first name from staff messages.

RULES:
1. Look for names after greetings: "Hi Carol", "Hello Sarah", "Hey Mike"
2. Look for names with "there": "Hi there Carol", "Hello there Mike"
3. Look for names at the start: "Carol,", "Sarah -", "Mike:"
4. Look for names after "for": "Ready for Carol", "Quote for Mike"
5. Return ONLY the first name (not "John" from "John (Owner)")
6. Return null if no customer name found
7. Ignore "John" if it refers to the staff member
8. NEVER extract status/availability words as names: "away", "out", "busy", "unavailable", "late", "free", "off", "working"

OUTPUT FORMAT (JSON only):
{
  "name": "Carol" or null,
  "confidence": 0.0 to 1.0,
  "reasoning": "Found after 'Hi'"
}

EXAMPLES:
"Hi Carol, your iPhone is ready" → {"name": "Carol", "confidence": 1.0, "reasoning": "Found after 'Hi'"}
"Hi there Sarah, it's £149" → {"name": "Sarah", "confidence": 1.0, "reasoning": "Found after 'Hi there'"}
"Carol, your phone is ready" → {"name": "Carol", "confidence": 1.0, "reasoning": "Found at start"}
"Your phone is ready" → {"name": null, "confidence": 0.0, "reasoning": "No name found"}
"Many thanks, John" → {"name": null, "confidence": 0.0, "reasoning": "John is staff, not customer"}
"Hi there, your phone is ready" → {"name": null, "confidence": 0.0, "reasoning": "No name found"}
"I am away until tomorrow" → {"name": null, "confidence": 0.0, "reasoning": "Away is status, not a name"}
`
        },
        {
          role: 'user',
          content: message
        }
      ]
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      return { name: null, confidence: 0 }
    }

    // Parse JSON response
    const result = JSON.parse(content)
    
    return {
      name: result.name || null,
      confidence: result.confidence || 0,
      reasoning: result.reasoning
    }
  } catch (error) {
    console.error('[AI Name Extractor] Error:', error)
    return { name: null, confidence: 0 }
  }
}

/**
 * Fallback regex-based extraction (if AI fails)
 */
export function extractNameWithRegex(message: string): AIExtractedName {
  const patterns = [
    // "Hi there Carol" or "Hello there Carol" (check this FIRST before "Hi Carol")
    { pattern: /(?:hi|hello|hey)\s+there\s+([A-Z][a-z]+)/i, confidence: 0.9 },
    // "Hi Carol" or "Hello Carol" or "Hey Carol"
    { pattern: /(?:hi|hello|hey)\s+([A-Z][a-z]+)/i, confidence: 0.9 },
    // "Carol," at start
    { pattern: /^([A-Z][a-z]+),/i, confidence: 0.85 },
    // "Carol -" or "Carol:" at start
    { pattern: /^([A-Z][a-z]+)\s*[-:]/i, confidence: 0.85 },
    // "for Carol"
    { pattern: /for\s+([A-Z][a-z]+)(?:\s|,|\.)/i, confidence: 0.8 },
    // Just a name at the very start (risky)
    { pattern: /^([A-Z][a-z]{2,})\s/i, confidence: 0.6 },
  ]
  
  const excludeWords = [
    'the', 'your', 'this', 'that', 'device', 'phone', 'repair', 'iphone',
    'samsung', 'screen', 'battery', 'many', 'thanks', 'john', 'ready',
    'quote', 'price', 'cost', 'fixed', 'broken', 'cracked', 'there',
    // Status/availability words (NOT names)
    'away', 'out', 'busy', 'unavailable', 'available', 'free', 'off', 'working',
    'late', 'early', 'soon', 'later', 'tomorrow', 'today', 'tonight', 'now'
  ]
  
  for (const { pattern, confidence } of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      const name = match[1]
      if (!excludeWords.includes(name.toLowerCase())) {
        return {
          name,
          confidence,
          reasoning: `Regex pattern: ${pattern.source}`
        }
      }
    }
  }
  
  return { name: null, confidence: 0 }
}

/**
 * Extract name with REGEX FIRST, AI as backup for edge cases
 * 
 * Strategy:
 * 1. Try regex first (fast, free, handles 95% of cases)
 * 2. If regex finds name with high confidence (>0.8) → Use it
 * 3. If regex finds name with low confidence (0.6-0.8) → Verify with AI
 * 4. If regex finds nothing → Try AI as last resort
 * 
 * This minimizes AI calls while maintaining accuracy
 */
export async function extractCustomerNameSmart(
  message: string,
  apiKey?: string
): Promise<AIExtractedName> {
  // STEP 1: Try regex first (fast and free)
  const regexResult = extractNameWithRegex(message)
  
  // STEP 2: If regex found name with HIGH confidence (>0.8), use it
  if (regexResult.name && regexResult.confidence >= 0.85) {
    console.log('[AI Name Extractor] ✅ Regex found (high confidence):', regexResult.name, `(${regexResult.confidence})`)
    return regexResult
  }
  
  // STEP 3: If regex found name with MEDIUM confidence (0.6-0.8), verify with AI
  if (regexResult.name && regexResult.confidence >= 0.6 && apiKey) {
    console.log('[AI Name Extractor] 🤔 Regex found (medium confidence):', regexResult.name, `(${regexResult.confidence}) - verifying with AI...`)
    const aiResult = await extractNameWithAI(message, apiKey)
    
    // If AI agrees, use AI result (higher confidence)
    if (aiResult.name === regexResult.name) {
      console.log('[AI Name Extractor] ✅ AI confirmed:', aiResult.name)
      return { ...aiResult, reasoning: 'Regex + AI confirmed' }
    }
    
    // If AI disagrees, trust AI (it has more context)
    if (aiResult.name && aiResult.confidence > 0.7) {
      console.log('[AI Name Extractor] ⚠️  AI corrected:', regexResult.name, '→', aiResult.name)
      return aiResult
    }
    
    // If AI is uncertain, stick with regex
    console.log('[AI Name Extractor] ✅ Keeping regex result (AI uncertain)')
    return regexResult
  }
  
  // STEP 4: If regex found nothing, try AI as last resort
  if (!regexResult.name && apiKey) {
    console.log('[AI Name Extractor] 🔍 Regex found nothing - trying AI...')
    const aiResult = await extractNameWithAI(message, apiKey)
    if (aiResult.name && aiResult.confidence > 0.7) {
      console.log('[AI Name Extractor] ✅ AI found:', aiResult.name, `(${aiResult.confidence})`)
      return aiResult
    }
  }
  
  // STEP 5: Return regex result (or null if nothing found)
  if (regexResult.name) {
    console.log('[AI Name Extractor] ✅ Using regex result:', regexResult.name, `(${regexResult.confidence})`)
  } else {
    console.log('[AI Name Extractor] ❌ No name found')
  }
  
  return regexResult
}
