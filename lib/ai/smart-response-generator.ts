/**
 * Smart Response Generator with State Awareness and Learning
 * Fixes AI confusion by tracking conversation state and learning from interactions
 */

import { createClient } from '@/lib/supabase/server'
import { getProvider } from './providers'
import { getBusinessHoursStatus, formatBusinessHoursMessage } from '@/lib/business-hours'
import { 
  analyzeConversationState, 
  getPromptForState, 
  validateResponseForState,
  type ConversationContext 
} from './conversation-state'
import { classifyIntent, type IntentClassification } from './intent-classifier'

interface SmartResponseParams {
  customerMessage: string
  conversationId: string
}

interface SmartResponseResult {
  response: string
  responses: string[]
  confidence: number
  provider: string
  model: string
  shouldFallback: boolean
  context: ConversationContext
  analytics: {
    intent: string
    state: string
    intentConfidence: number
    classificationTimeMs: number
    responseTimeMs: number
    promptTokens: number
    completionTokens: number
    totalTokens: number
    costUsd: number
    validationPassed: boolean
    validationIssues: string[]
    promptModulesUsed: string[]
  }
}

/**
 * Generate AI response with state awareness and learning
 */
export async function generateSmartResponse(
  params: SmartResponseParams
): Promise<SmartResponseResult> {
  const startTime = Date.now()
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

  // STEP 0: Classify intent FIRST (fast and cheap)
  const classificationStartTime = Date.now()
  let intentClassification: IntentClassification
  
  try {
    intentClassification = await classifyIntent({
      customerMessage: params.customerMessage,
      conversationHistory: [], // Will add history in next step
      apiKey: settings.api_key
    })
    console.log('[Smart AI] Intent classified:', {
      intent: intentClassification.intent,
      confidence: intentClassification.confidence,
      device: intentClassification.deviceModel || intentClassification.deviceType
    })
  } catch (error) {
    console.error('[Smart AI] Classification failed, using fallback')
    intentClassification = {
      intent: 'general_info',
      confidence: 0.5,
      reasoning: 'Classification failed'
    }
  }
  
  const classificationTimeMs = Date.now() - classificationStartTime

  // Get conversation history (last 10 messages - reduced from 20)
  const { data: messagesDesc } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: false })
    .limit(10) // Reduced to prevent information overload

  const messages = messagesDesc?.reverse() || []

  // STEP 1: Analyze conversation state
  const context = analyzeConversationState(messages)
  
  console.log('[Smart AI] Conversation State:', {
    state: context.state,
    intent: context.intent,
    device: context.deviceModel || context.deviceType,
    customerName: context.customerName
  })

  // STEP 2: Get or create conversation context in DB
  const { data: existingContext } = await supabase
    .from('conversation_context')
    .select('*')
    .eq('conversation_id', params.conversationId)
    .single()

  if (existingContext) {
    // Update existing context
    await supabase
      .from('conversation_context')
      .update({
        state: context.state,
        intent: context.intent,
        device_type: context.deviceType,
        device_model: context.deviceModel,
        customer_name: context.customerName,
        state_history: [
          ...(existingContext.state_history || []),
          { state: context.state, timestamp: new Date().toISOString() }
        ]
      })
      .eq('id', existingContext.id)
  } else {
    // Create new context
    await supabase
      .from('conversation_context')
      .insert({
        conversation_id: params.conversationId,
        state: context.state,
        intent: context.intent,
        device_type: context.deviceType,
        device_model: context.deviceModel,
        customer_name: context.customerName,
        state_history: [{ state: context.state, timestamp: new Date().toISOString() }]
      })
  }

  // STEP 3: Build focused prompt based on state
  const stateGuidance = getPromptForState(context)
  
  // Get only relevant data (not everything)
  const relevantData = await getRelevantData(supabase, context)

  // STEP 4: Build compact, focused prompt
  const focusedPrompt = buildFocusedPrompt({
    context,
    stateGuidance,
    relevantData,
    customerMessage: params.customerMessage,
    recentMessages: messages.slice(-5) // Only last 5 messages
  })

  // STEP 5: Build conversation messages for API
  const conversationMessages = buildConversationMessages({
    systemPrompt: focusedPrompt,
    messages: messages.slice(-5), // Only last 5 messages
    currentMessage: params.customerMessage
  })

  console.log('[Smart AI] Prompt size:', focusedPrompt.length, 'characters')
  console.log('[Smart AI] Message history:', conversationMessages.length, 'messages')

  // STEP 6: Generate response
  const provider = getProvider(settings.provider)
  const result = await provider.generateResponse({
    prompt: focusedPrompt,
    systemPrompt: focusedPrompt,
    temperature: settings.temperature,
    maxTokens: settings.max_tokens,
    apiKey: settings.api_key,
    model: settings.model_name,
    conversationMessages
  })

  // STEP 7: Validate response against state
  const validation = validateResponseForState(result.response, context)
  
  if (!validation.valid) {
    console.warn('[Smart AI] Validation issues:', validation.issues)
    // Could auto-correct here or regenerate
  }

  // STEP 8: Calculate costs and metrics
  const responseTimeMs = Date.now() - startTime
  const promptTokens = Math.ceil(focusedPrompt.length / 4) // Rough estimate
  const completionTokens = Math.ceil(result.response.length / 4)
  const totalTokens = promptTokens + completionTokens
  
  // Cost calculation (GPT-4o pricing)
  const costUsd = (promptTokens * 0.0025 / 1000) + (completionTokens * 0.01 / 1000)

  // STEP 9: Store analytics
  const { data: insertedMessage } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  await supabase.from('ai_analytics').insert({
    conversation_id: params.conversationId,
    message_id: insertedMessage?.id,
    intent: context.intent,
    intent_confidence: result.confidence / 100,
    state: context.state,
    response_time_ms: responseTimeMs,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    cost_usd: costUsd,
    validation_passed: validation.valid,
    validation_issues: validation.issues,
    handoff_to_staff: result.response.toLowerCase().includes('john will') || 
                      result.response.toLowerCase().includes('pass this to')
  })

  // STEP 10: Learn from patterns (async, don't wait)
  learnFromInteraction(supabase, params.conversationId, context, result.response)
    .catch(err => console.error('[Learning] Error:', err))

  const shouldFallback = result.confidence < settings.confidence_threshold
  const finalResponse = shouldFallback ? settings.fallback_message : result.response

  const responses = finalResponse.includes('|||')
    ? finalResponse.split('|||').map((msg: string) => msg.trim())
    : [finalResponse]

  return {
    response: finalResponse,
    responses,
    confidence: result.confidence,
    provider: settings.provider,
    model: settings.model_name,
    shouldFallback,
    context,
    analytics: {
      intent: context.intent,
      state: context.state,
      intentConfidence: intentClassification.confidence,
      classificationTimeMs,
      responseTimeMs,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      validationPassed: validation.valid,
      validationIssues: validation.issues,
      promptModulesUsed: [] // Will be populated when we add modular prompts
    }
  }
}

/**
 * Get only relevant data based on conversation context
 */
async function getRelevantData(supabase: any, context: ConversationContext) {
  const data: any = {
    businessHours: await getBusinessHoursStatus().then(formatBusinessHoursMessage)
  }

  // Only fetch pricing if intent is repair-related
  if (['screen_repair', 'battery_replacement', 'diagnostic'].includes(context.intent)) {
    const { data: prices } = await supabase
      .from('prices')
      .select('*')
      .or(`expiry.is.null,expiry.gt.${new Date().toISOString()}`)
    
    // Filter to relevant device type
    if (context.deviceType) {
      data.prices = prices?.filter((p: any) => 
        p.device.toLowerCase().includes(context.deviceType || '')
      )
    } else {
      data.prices = prices
    }
  }

  // Only fetch FAQs if intent is general inquiry
  if (context.intent === 'general_info') {
    const { data: faqs } = await supabase
      .from('faqs')
      .select('*')
      .limit(5) // Only top 5 FAQs
    data.faqs = faqs
  }

  return data
}

/**
 * Load modular prompts from database
 */
async function loadPromptModules(supabase: any, intent: string): Promise<{
  modules: Array<{ module_name: string; prompt_text: string }>
  moduleNames: string[]
}> {
  try {
    // Try to load from database first
    const { data: modules, error } = await supabase
      .rpc('get_prompt_modules', { p_intent: intent })
    
    if (!error && modules && modules.length > 0) {
      console.log('[Prompt Modules] Loaded from database:', modules.map((m: any) => m.module_name))
      
      // Update usage stats for each module (async, don't wait)
      modules.forEach((m: any) => {
        supabase.rpc('update_prompt_usage', { p_module_name: m.module_name })
          .catch((err: any) => console.error('[Prompt Modules] Usage update failed:', err))
      })
      
      return {
        modules,
        moduleNames: modules.map((m: any) => m.module_name)
      }
    }
  } catch (error) {
    console.warn('[Prompt Modules] Database load failed, using fallback:', error)
  }
  
  // Fallback to hardcoded modules if database not available yet
  return {
    modules: [],
    moduleNames: []
  }
}

/**
 * Build focused prompt based on current state
 */
function buildFocusedPrompt(params: {
  context: ConversationContext
  stateGuidance: string
  relevantData: any
  customerMessage: string
  recentMessages: any[]
}) {
  const { context, stateGuidance, relevantData, customerMessage, recentMessages } = params

  // Core identity (shortened)
  const coreIdentity = `You are AI Steve, assistant for New Forest Device Repairs.

WHAT YOU KNOW:
${context.customerName ? `- Customer name: ${context.customerName}` : ''}
${context.deviceModel ? `- Device: ${context.deviceModel}` : context.deviceType ? `- Device type: ${context.deviceType}` : ''}

${stateGuidance}

CRITICAL RULES:
1. NO EMOJIS - SMS doesn't display them
2. Keep responses 2-3 sentences max
3. Use customer name if known: ${context.customerName || 'unknown'}
4. Sign off: "Many Thanks, AI Steve, New Forest Device Repairs"
5. Split multiple topics with ||| for separate messages`

  // Add relevant data only
  let dataContext = ''
  
  if (relevantData.prices) {
    dataContext += `\n\nAVAILABLE PRICING:\n${relevantData.prices
      .map((p: any) => `- ${p.device} ${p.repair_type}: £${p.cost}`)
      .join('\n')}`
  }

  if (relevantData.businessHours) {
    dataContext += `\n\nBUSINESS HOURS:\n${relevantData.businessHours}`
  }

  // Recent conversation (compact format)
  const conversationSummary = recentMessages.length > 0
    ? `\n\nRECENT CONVERSATION:\n${recentMessages
        .map(m => `${m.sender === 'customer' ? 'Customer' : m.sender === 'ai' ? 'You' : 'John'}: ${m.text}`)
        .join('\n')}`
    : ''

  return `${coreIdentity}${dataContext}${conversationSummary}

CURRENT MESSAGE: ${customerMessage}

RESPOND NOW (remember your state and don't repeat yourself):`
}

/**
 * Build conversation messages array for API
 */
function buildConversationMessages(params: {
  systemPrompt: string
  messages: any[]
  currentMessage: string
}) {
  const { systemPrompt, messages, currentMessage } = params

  const conversationMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: systemPrompt }
  ]

  // Add recent message history
  messages.forEach(m => {
    if (m.sender === 'customer') {
      conversationMessages.push({ role: 'user', content: m.text })
    } else if (m.sender === 'ai') {
      conversationMessages.push({ role: 'assistant', content: m.text })
    } else if (m.sender === 'staff') {
      conversationMessages.push({ role: 'user', content: `[John]: ${m.text}` })
    }
  })

  // Add current message
  conversationMessages.push({ role: 'user', content: currentMessage })

  return conversationMessages
}

/**
 * Learn from interaction (async)
 */
async function learnFromInteraction(
  supabase: any,
  conversationId: string,
  context: ConversationContext,
  response: string
) {
  // Store intent classification for accuracy tracking
  await supabase.from('intent_classifications').insert({
    conversation_id: conversationId,
    message_text: response,
    predicted_intent: context.intent,
    predicted_confidence: 0.85, // Would come from classifier
    conversation_history: { state: context.state }
  })

  // Extract and store useful patterns (simplified)
  // In production, this would use NLP to extract patterns
  if (context.deviceModel) {
    await supabase.from('learned_patterns').upsert({
      pattern_type: 'device_mention',
      pattern_text: context.deviceModel,
      intent: context.intent,
      learned_from_count: 1,
      last_seen: new Date().toISOString()
    }, {
      onConflict: 'pattern_text',
      ignoreDuplicates: false
    })
  }
}
