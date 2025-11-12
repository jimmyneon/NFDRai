/**
 * Sentiment Analysis for Customer Messages
 * Detects frustrated, angry, or urgent customers using GPT-4o-mini
 */

import { OpenAI } from 'openai'

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | 'angry'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  reasoning: string
  keywords?: string[]
  requiresStaffAttention: boolean
}

/**
 * Analyze sentiment of customer message using AI
 */
export async function analyzeSentiment(
  message: string,
  apiKey: string
): Promise<SentimentAnalysis> {
  try {
    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis expert for customer service messages. Analyze the customer's emotional state and urgency level.

SENTIMENT LEVELS:
- positive: Happy, satisfied, grateful
- neutral: Factual, no strong emotion
- negative: Disappointed, concerned
- frustrated: Impatient, annoyed, repeated questions
- angry: Very upset, threatening, demanding

URGENCY LEVELS:
- low: Casual inquiry, no time pressure
- medium: Wants response soon, but patient
- high: Needs immediate attention, impatient
- critical: Emergency, very upset, threatening to leave

KEYWORDS TO WATCH FOR:
Frustration: "still waiting", "third time", "again", "ridiculous", "unacceptable"
Anger: "terrible", "worst", "never again", "disgusting", "appalling"
Urgency: "urgent", "asap", "immediately", "now", "emergency"

OUTPUT FORMAT (JSON only):
{
  "sentiment": "frustrated",
  "urgency": "high",
  "confidence": 0.95,
  "reasoning": "Customer has asked multiple times and is impatient",
  "keywords": ["third time", "still waiting"],
  "requiresStaffAttention": true
}

EXAMPLES:
"Hi, when will my phone be ready?" → neutral, low urgency
"This is the third time I've asked! Where is my phone?!" → frustrated, high urgency
"Your service is terrible. I want my money back NOW!" → angry, critical urgency
"Thanks so much! You've been really helpful" → positive, low urgency
"I've been waiting 3 days with no response. This is unacceptable." → frustrated, high urgency
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
      return getDefaultSentiment()
    }

    const result = JSON.parse(content)
    
    return {
      sentiment: result.sentiment || 'neutral',
      urgency: result.urgency || 'low',
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || 'No analysis available',
      keywords: result.keywords || [],
      requiresStaffAttention: result.requiresStaffAttention || false
    }
  } catch (error) {
    console.error('[Sentiment Analyzer] Error:', error)
    return getDefaultSentiment()
  }
}

/**
 * Quick regex-based sentiment check (fallback if AI fails)
 */
export function quickSentimentCheck(message: string): SentimentAnalysis {
  const lowerMessage = message.toLowerCase()
  
  // Frustrated keywords
  const frustratedKeywords = [
    'third time', 'second time', 'again', 'still waiting', 'still no',
    'ridiculous', 'unacceptable', 'disappointed', 'frustrated',
    'ai failure', 'ai fail', 'not helping', 'useless', 'doesn\'t understand',
    'not working', 'this isn\'t working'
  ]
  
  // Angry keywords
  const angryKeywords = [
    'terrible', 'worst', 'disgusting', 'appalling', 'pathetic',
    'never again', 'money back', 'refund', 'complaint', 'report'
  ]
  
  // Urgency keywords
  const urgencyKeywords = [
    'urgent', 'asap', 'immediately', 'now', 'emergency', 'critical'
  ]
  
  // Positive keywords
  const positiveKeywords = [
    'thanks', 'thank you', 'great', 'excellent', 'perfect',
    'brilliant', 'helpful', 'appreciate'
  ]
  
  const foundFrustrated = frustratedKeywords.filter(kw => lowerMessage.includes(kw))
  const foundAngry = angryKeywords.filter(kw => lowerMessage.includes(kw))
  const foundUrgent = urgencyKeywords.filter(kw => lowerMessage.includes(kw))
  const foundPositive = positiveKeywords.filter(kw => lowerMessage.includes(kw))
  
  // Check for multiple question marks or exclamation marks
  const hasMultipleQuestions = (message.match(/\?/g) || []).length >= 2
  const hasMultipleExclamations = (message.match(/!/g) || []).length >= 2
  const hasAllCaps = message === message.toUpperCase() && message.length > 10
  
  // Determine sentiment
  let sentiment: SentimentAnalysis['sentiment'] = 'neutral'
  let urgency: SentimentAnalysis['urgency'] = 'low'
  let confidence = 0.6
  let reasoning = 'Regex-based analysis'
  let keywords: string[] = []
  let requiresStaffAttention = false
  
  if (foundAngry.length > 0 || hasAllCaps) {
    sentiment = 'angry'
    urgency = 'critical'
    confidence = 0.8
    reasoning = 'Angry language detected'
    keywords = foundAngry
    requiresStaffAttention = true
  } else if (foundFrustrated.length > 0 || hasMultipleQuestions || hasMultipleExclamations) {
    sentiment = 'frustrated'
    urgency = foundUrgent.length > 0 ? 'high' : 'medium'
    confidence = 0.7
    reasoning = 'Frustration indicators detected'
    keywords = [...foundFrustrated, ...foundUrgent]
    requiresStaffAttention = true
  } else if (foundPositive.length > 0) {
    sentiment = 'positive'
    urgency = 'low'
    confidence = 0.7
    reasoning = 'Positive language detected'
    keywords = foundPositive
  } else if (foundUrgent.length > 0) {
    sentiment = 'neutral'
    urgency = 'high'
    confidence = 0.6
    reasoning = 'Urgent keywords detected'
    keywords = foundUrgent
    requiresStaffAttention = true
  }
  
  return {
    sentiment,
    urgency,
    confidence,
    reasoning,
    keywords,
    requiresStaffAttention
  }
}

/**
 * Smart sentiment analysis: Try regex first, use AI for uncertain cases
 */
export async function analyzeSentimentSmart(
  message: string,
  apiKey?: string
): Promise<SentimentAnalysis> {
  // STEP 1: Quick regex check
  const regexResult = quickSentimentCheck(message)
  
  // STEP 2: If high confidence from regex, use it
  if (regexResult.confidence >= 0.7) {
    console.log('[Sentiment] ✅ Regex detected:', regexResult.sentiment, `(${regexResult.confidence})`)
    return regexResult
  }
  
  // STEP 3: If uncertain and API key available, verify with AI
  if (apiKey) {
    console.log('[Sentiment] 🤔 Regex uncertain - verifying with AI...')
    const aiResult = await analyzeSentiment(message, apiKey)
    
    if (aiResult.confidence > 0.7) {
      console.log('[Sentiment] ✅ AI analyzed:', aiResult.sentiment, `(${aiResult.confidence})`)
      return aiResult
    }
  }
  
  // STEP 4: Return regex result as fallback
  console.log('[Sentiment] ✅ Using regex result:', regexResult.sentiment)
  return regexResult
}

/**
 * Default sentiment (neutral, low urgency)
 */
function getDefaultSentiment(): SentimentAnalysis {
  return {
    sentiment: 'neutral',
    urgency: 'low',
    confidence: 0.5,
    reasoning: 'Default sentiment',
    keywords: [],
    requiresStaffAttention: false
  }
}
