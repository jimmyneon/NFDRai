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
import { getCustomerHistory, updateCustomerHistory } from './smart-handoff'
import { detectHolidayMode, generateHolidayGreeting, getHolidaySystemPrompt } from '@/app/lib/holiday-mode-detector'

interface SmartResponseParams {
  customerMessage: string
  conversationId: string
  customerPhone?: string
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

  // Get conversation history FIRST (needed for intent classification)
  const { data: messagesDesc } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: false })
    .limit(10)

  const messages = messagesDesc?.reverse() || []
  
  // STEP 0: Classify intent FIRST (fast and cheap) WITH CONTEXT
  const classificationStartTime = Date.now()
  let intentClassification: IntentClassification
  
  try {
    intentClassification = await classifyIntent({
      customerMessage: params.customerMessage,
      conversationHistory: messages.slice(-5).map(m => ({ // Last 5 messages for context
        sender: m.sender,
        text: m.text
      })),
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

  // Check confidence threshold - if too low, default to unknown
  if (intentClassification.confidence < 0.7) {
    console.warn('[Smart AI] Low confidence classification:', intentClassification.confidence, '- defaulting to unknown')
    intentClassification.intent = 'unknown'
  }

  // STEP 1: Analyze conversation state
  const context = analyzeConversationState(messages)
  
  // STEP 1.5: Merge intent classifier results with state analysis
  // Intent classifier is more accurate for device detection
  if (intentClassification.deviceType && !context.deviceType) {
    context.deviceType = intentClassification.deviceType
    console.log('[Smart AI] Using classifier device type:', intentClassification.deviceType)
  }
  if (intentClassification.deviceModel && !context.deviceModel) {
    context.deviceModel = intentClassification.deviceModel
    console.log('[Smart AI] Using classifier device model:', intentClassification.deviceModel)
  }
  
  // Use classifier intent if state analyzer returned 'unknown'
  if (context.intent === 'unknown' && intentClassification.intent !== 'unknown') {
    context.intent = intentClassification.intent
    console.log('[Smart AI] Using classifier intent:', intentClassification.intent)
  }
  
  console.log('[Smart AI] Conversation State:', {
    state: context.state,
    intent: context.intent,
    device: context.deviceModel || context.deviceType,
    customerName: context.customerName,
    classifierConfidence: intentClassification.confidence
  })

  // STEP 1.5: Load customer history for personalization
  let customerHistory = null
  if (params.customerPhone) {
    try {
      customerHistory = await getCustomerHistory(params.customerPhone)
      console.log('[Customer History]', {
        isReturning: customerHistory.isReturning,
        totalConversations: customerHistory.totalConversations,
        customerType: customerHistory.customerType
      })
    } catch (error) {
      console.log('[Customer History] Not found or error:', error)
    }
  }

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

  // STEP 3: Load prompt modules from database
  const { modules: promptModules, moduleNames } = await loadPromptModules(supabase, context.intent || 'unknown')
  
  // STEP 4: Build focused prompt based on state
  const stateGuidance = getPromptForState(context)
  
  // Get only relevant data (not everything)
  const relevantData = await getRelevantData(supabase, context)

  // STEP 5: Build compact, focused prompt (with database modules and customer history)
  const focusedPrompt = buildFocusedPrompt({
    context,
    stateGuidance,
    relevantData,
    customerMessage: params.customerMessage,
    recentMessages: messages.slice(-5), // Only last 5 messages
    promptModules, // Pass database modules
    customerHistory // Pass customer history for personalization
  })

  // STEP 5: Build conversation messages for API
  const conversationMessages = buildConversationMessages({
    systemPrompt: focusedPrompt,
    messages: messages.slice(-15), // Last 15 messages for better context (increased from 5)
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
  }

  // Apply lightweight auto-fixes to invalid responses BEFORE disclosure/sign-off
  let adjustedResponse = result.response
  if (!validation.valid) {
    adjustedResponse = applyResponseFixes(result.response, context, validation.issues)
  }

  // STEP 8: Calculate costs and metrics
  const responseTimeMs = Date.now() - startTime
  const promptTokens = Math.ceil(focusedPrompt.length / 4) // Rough estimate
  const completionTokens = Math.ceil(adjustedResponse.length / 4)
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

  // STEP 10.5: Update customer history (async, don't wait)
  if (params.customerPhone) {
    updateCustomerHistory({
      phone: params.customerPhone,
      name: context.customerName,
      device: context.deviceModel
    }).catch(err => console.error('[Customer History] Update error:', err))
  }

  const shouldFallback = result.confidence < settings.confidence_threshold
  let finalResponse = shouldFallback ? settings.fallback_message : adjustedResponse

  // Check if this is the first AI message to this customer
  // IMPORTANT: Check ALL messages in the conversation, not just recent ones
  const { data: allMessages } = await supabase
    .from('messages')
    .select('sender')
    .eq('conversation_id', params.conversationId)
    .eq('sender', 'ai')
    .limit(1)
  
  const isFirstAIMessage = !allMessages || allMessages.length === 0
  
  console.log('[AI Disclosure] First AI message check:', {
    isFirstAIMessage,
    conversationId: params.conversationId,
    recentMessagesCount: messages.length,
    hasAIInRecent: messages.some(m => m.sender === 'ai')
  })
  
  if (isFirstAIMessage) {
    // Add AI disclosure to first message only (with line breaks for readability)
    const disclosure = "Hi! I'm AI Steve, your automated assistant for New Forest Device Repairs.\n\nI can help with pricing, bookings, and questions.\n\n"
    
    console.log('[AI Disclosure] Adding disclosure to first message')
    
    // If response starts with a greeting, replace it; otherwise prepend
    if (finalResponse.match(/^(hi|hello|hey)/i)) {
      finalResponse = disclosure + finalResponse.replace(/^(hi|hello|hey)[!,.\s]*/i, '')
    } else {
      finalResponse = disclosure + finalResponse
    }
  }

  // FORCE sign-off if not present (critical for message tracking)
  const signOff = "Many Thanks,\nAI Steve,\nNew Forest Device Repairs"
  if (!finalResponse.toLowerCase().includes('many thanks')) {
    // Add sign-off to end of response with proper spacing
    finalResponse = finalResponse.trim() + '\n\n' + signOff
  }

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
      promptModulesUsed: moduleNames
    }
  }
}

/**
 * Get only relevant data based on conversation context
 */
async function getRelevantData(supabase: any, context: ConversationContext) {
  // Get business hours and check for holiday mode
  const hoursStatus = await getBusinessHoursStatus()
  const businessHoursMessage = formatBusinessHoursMessage(hoursStatus)
  
  // Check if on holiday and get price ranges
  const { data: businessInfo } = await supabase
    .from('business_info')
    .select('special_hours_note, price_ranges, use_exact_prices')
    .single()
  
  const holidayStatus = detectHolidayMode(businessInfo?.special_hours_note)
  
  const data: any = {
    businessHours: businessHoursMessage,
    holidayStatus,
    holidayGreeting: holidayStatus.isOnHoliday ? generateHolidayGreeting(holidayStatus) : null,
    priceRanges: businessInfo?.price_ranges || [],
    useExactPrices: businessInfo?.use_exact_prices || false
  }

  // ALWAYS fetch pricing for repair conversations (don't rely on intent classification)
  // Intent classifier might miss repair intent, so load pricing if device is mentioned
  const shouldLoadPricing = 
    ['screen_repair', 'battery_replacement', 'diagnostic', 'unknown'].includes(context.intent) ||
    context.deviceType || // If device mentioned, likely repair
    context.deviceModel   // If model mentioned, likely repair
  
  if (shouldLoadPricing) {
    const { data: prices } = await supabase
      .from('prices')
      .select('*')
      .or(`expiry.is.null,expiry.gt.${new Date().toISOString()}`)
    
    // Filter to relevant device type if known
    if (context.deviceType) {
      data.prices = prices?.filter((p: any) => 
        p.device.toLowerCase().includes(context.deviceType || '')
      )
      
      // Log if no prices found for this device type
      if (!data.prices || data.prices.length === 0) {
        console.warn('[Pricing] No prices found for device type:', context.deviceType, {
          deviceModel: context.deviceModel,
          intent: context.intent,
          totalPricesInDb: prices?.length || 0
        })
      } else {
        console.log('[Pricing] Loaded', data.prices.length, 'prices for', context.deviceType)
      }
    } else {
      // Load all pricing if device type not yet known
      data.prices = prices
      console.log('[Pricing] Loaded all prices (device type unknown):', prices?.length || 0)
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
  modules: Array<{ module_name: string; prompt_text: string; priority: number }>
  moduleNames: string[]
}> {
  try {
    // Try to load from database first
    console.log('[Prompt Modules] Calling get_prompt_modules with intent:', intent)
    const { data: modules, error } = await supabase
      .rpc('get_prompt_modules', { p_intent: intent })
    
    console.log('[Prompt Modules] RPC response:', { 
      hasError: !!error, 
      error: error?.message,
      modulesCount: modules?.length,
      modules: modules?.map((m: any) => m.module_name)
    })
    
    if (error) {
      console.error('[Prompt Modules] RPC error:', error)
      throw new Error(`RPC call failed: ${error.message}`)
    }
    
    if (!modules || modules.length === 0) {
      console.error('[Prompt Modules] No modules returned from RPC')
      throw new Error('No modules returned from get_prompt_modules RPC')
    }
    
    console.log('[Prompt Modules] Loaded from database:', modules.map((m: any) => m.module_name))
    
    // Update usage stats for each module (async, don't wait)
    modules.forEach((m: any) => {
      supabase.rpc('update_prompt_usage', { p_module_name: m.module_name })
        .then(() => {})
        .catch((err: any) => console.error('[Prompt Modules] Usage update failed:', err))
    })
    
    return {
      modules,
      moduleNames: modules.map((m: any) => m.module_name)
    }
  } catch (error) {
    console.error('[Prompt Modules] Database load FAILED:', error)
    throw error
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
  promptModules?: Array<{ module_name: string; prompt_text: string; priority: number }>
  customerHistory?: any
}) {
  const { context, stateGuidance, relevantData, customerMessage, recentMessages, promptModules = [], customerHistory } = params

  // Determine what context is relevant based on conversation
  const conversationText = recentMessages.map(m => m.text.toLowerCase()).join(' ')
  const needsScreenInfo = context.intent === 'screen_repair' || conversationText.includes('screen')
  const needsBatteryInfo = context.intent === 'battery_replacement' || conversationText.includes('battery')
  const needsWaterDamageInfo = conversationText.includes('water') || conversationText.includes('wet') || conversationText.includes('sea')
  const needsBuybackInfo = context.intent === 'buyback' || conversationText.includes('sell') || conversationText.includes('trade') || conversationText.includes('buy') || conversationText.includes('old tech')
  const needsWarrantyInfo = conversationText.includes('warranty') || conversationText.includes('guarantee')
  const needsDiagnosticInfo = conversationText.includes('diagnostic') || conversationText.includes('check') || conversationText.includes('won\'t turn on')
  const needsTroubleshooting = conversationText.includes('black screen') || conversationText.includes('won\'t turn on') || 
    conversationText.includes('not working') || conversationText.includes('dead') || conversationText.includes('broken') ||
    conversationText.includes('not responding') || conversationText.includes('display') || context.intent === 'diagnostic'
  const needsDifferenceInfo = /what'?s the difference|difference between|what is the difference/i.test(conversationText)

  // Core identity (always included)
  const coreIdentity = `You are AI Steve, friendly assistant for New Forest Device Repairs.

${relevantData.holidayStatus?.isOnHoliday ? getHolidaySystemPrompt(relevantData.holidayStatus) : ''}

WHAT YOU KNOW ABOUT THIS CONVERSATION:
${context.customerName ? `- Customer name: ${context.customerName}` : ''}
${context.deviceModel ? `- Device: ${context.deviceModel}` : context.deviceType ? `- Device type: ${context.deviceType}` : ''}
${customerHistory?.isReturning ? `- RETURNING CUSTOMER (${customerHistory.totalConversations} previous conversations) - Greet warmly: "Good to hear from you again!"` : ''}
${customerHistory?.name && !context.customerName ? `- Customer name from history: ${customerHistory.name}` : ''}

CRITICAL: REMEMBER THE CONVERSATION
- ALWAYS check what you already know from previous messages
- If customer told you their model, DON'T ask again
- Reference previous parts: "So for that ${context.deviceModel || 'device'} you mentioned..."
- Build on what they've already said

${stateGuidance}

DEVICE MODEL DETECTION (CRITICAL):
If customer doesn't know their device model, HELP THEM FIND IT:
- For iPhones: "No worries! On your iPhone, go to Settings > General > About and look for 'Model Name' - it'll say something like iPhone 12 or iPhone 13. What does yours say?"
- For Android phones: "No problem! Go to Settings > About Phone (usually near the bottom) and look for the model name. What does it show?"
- For laptops: "Check the logo on the lid - is it Apple, Dell, HP, or Lenovo? There's usually a model sticker on the bottom too"
- For tablets: "Is it an iPad or Android tablet? If iPad, go to Settings > General > About. If Android, go to Settings > About Tablet"
- ONLY suggest "bring it in" if they've tried and still can't find it
- ALWAYS try to help them find it themselves FIRST

TONE & STYLE:
- Warm and conversational - like a helpful friend
- Use natural language: "Ah, that sounds like..." not "This indicates..."
- Show empathy: "That must be frustrating!"
- Vary phrases: "pop in", "bring it in", "come by", "drop in"
- Use casual language: "No worries!", "Just a heads-up!", "Perfect!"

CRITICAL RULES:
1. NO EMOJIS - SMS doesn't display them
2. Keep responses 2-3 sentences max per message
3. Use SHORT PARAGRAPHS - break up text
4. ALWAYS use customer name if known: ${context.customerName || 'unknown'}
5. Sign off: "Many Thanks,\nAI Steve,\nNew Forest Device Repairs" (each on new line)
6. Split multiple topics with ||| for separate messages
7. IF CUSTOMER IS FRUSTRATED WITH AI (says "AI failure", "not helping", "useless", etc) - IMMEDIATELY say: "I understand this isn't working for you. Let me pass you to John who'll message you back ASAP." Then STOP responding.

PRICING POLICY (CRITICAL):
- ALWAYS give PRICE RANGES, never exact prices
- Use the price ranges from the data context below
- ALWAYS say: "John will confirm the exact price when he assesses it"
- NEVER quote exact prices like "£89" - always use ranges
- Example: "For an iPhone screen repair, it's typically around £80-120 depending on the model. John will confirm the exact price when he sees it."
- Be helpful with estimates but make it clear John confirms final price

${relevantData.priceRanges && relevantData.priceRanges.length > 0 ? `
AVAILABLE PRICE RANGES:
${relevantData.priceRanges.map((r: any) => `- ${r.category}: £${r.min}-${r.max} ${r.description}`).join('\n')}
` : ''}

BUDGET CONSTRAINTS (CRITICAL):
- If customer mentions a budget or says price is too high:
  * Be empathetic: "I understand budget is important"
  * Offer flexibility: "We try to work with all budgets - let me see what John can do for you"
  * NEVER say "unfortunately we can't" or "the price is fixed"
  * ALWAYS offer to check with John for options
  * Example: "I understand you're working with a budget of £35. We try to meet all budgets where we can - let me pass this to John and he'll see what options he can offer you. He'll be in touch shortly!"
- Be helpful and solution-focused, not rigid
- John can offer payment plans, discounts, or alternative solutions

MULTIPLE MESSAGES:
- If response has multiple parts, BREAK INTO SEPARATE MESSAGES with |||
- Example: "Main answer|||By the way, battery combo is £20 off!"
- Each message needs its own signature
- Feels more natural and conversational`

  // Add relevant context based on conversation
  let contextualInfo = ''

  // Try to load from database modules first
  if (promptModules && promptModules.length > 0) {
    console.log('[Prompt Builder] Database modules available:', promptModules.map(m => m.module_name))
    
    const modulesUsed: string[] = []
    
    // Add relevant modules based on conversation context (SELECTIVE)
    promptModules.forEach(module => {
      const moduleName = module.module_name.toLowerCase()
      let shouldInclude = false
      
      // CRITICAL: Always include high-priority modules (priority >= 99)
      if (module.priority >= 99) {
        shouldInclude = true
        console.log(`[Prompt Builder] Including high-priority module: ${moduleName} (priority ${module.priority})`)
      }
      
      // Context-specific modules (only when relevant)
      if (needsScreenInfo && (moduleName.includes('pricing_flow') || moduleName.includes('screen'))) {
        shouldInclude = true
      }
      if (needsDifferenceInfo && (moduleName.includes('genuine') || moduleName.includes('aftermarket') || moduleName.includes('difference'))) {
        shouldInclude = true
      }
      if (needsBatteryInfo && moduleName.includes('battery')) {
        shouldInclude = true
      }
      if (needsWarrantyInfo && moduleName.includes('warranty')) {
        shouldInclude = true
      }
      if (needsWaterDamageInfo && (moduleName.includes('water') || moduleName.includes('common_scenarios'))) {
        shouldInclude = true
      }
      if (needsBuybackInfo && (moduleName.includes('buyback') || moduleName.includes('common_scenarios'))) {
        shouldInclude = true
      }
      if (needsDiagnosticInfo && moduleName.includes('common_scenarios')) {
        shouldInclude = true
      }
      if (needsTroubleshooting && moduleName.includes('proactive_troubleshooting')) {
        shouldInclude = true
      }
      
      // Tone modules (always include for consistency)
      if (moduleName.includes('friendly_tone') || moduleName.includes('context_awareness')) {
        shouldInclude = true
      }
      
      // Handoff rules (only if conversation is getting complex or customer asking for John)
      if (conversationText.includes('john') || conversationText.includes('owner') || conversationText.includes('manager')) {
        if (moduleName.includes('handoff_rules')) {
          shouldInclude = true
        }
      }
      
      // Services info (only if general inquiry or no specific intent)
      if (!needsScreenInfo && !needsBatteryInfo && !needsWaterDamageInfo && !needsBuybackInfo) {
        if (moduleName.includes('services_comprehensive')) {
          shouldInclude = true
        }
      }
      
      if (shouldInclude) {
        contextualInfo += `\n\n${module.prompt_text}`
        modulesUsed.push(moduleName)
      }
    })
    
    console.log('[Prompt Builder] Context-aware modules used:', modulesUsed)
  } else {
    // NO FALLBACK - Database must work!
    console.error('[Prompt Builder] No database modules provided - this is a critical error!')
    throw new Error('Database prompt modules not loaded - check RLS policies and database connection')
  }

  // Add relevant data only
  let dataContext = ''
  
  // Include exact prices if toggle is enabled
  if (relevantData.useExactPrices && relevantData.prices) {
    dataContext += `\n\nAVAILABLE PRICING (USE THESE EXACT PRICES):\n${relevantData.prices
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

  return `${coreIdentity}${contextualInfo}${dataContext}${conversationSummary}

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

function applyResponseFixes(response: string, context: ConversationContext, issues: string[]): string {
  let out = response

  const hasModel = !!context.deviceModel
  const hasName = !!context.customerName

  if (issues.some(i => i.toLowerCase().includes('quote price without knowing specific model'))) {
    const lines = out.split('\n').filter(l => !l.match(/£|price|cost/i))
    const ask = 'What seems to be the problem, and which model is it?'
    if (!hasModel) lines.push(ask)
    out = lines.join('\n')
  }

  if (hasModel && /what\s+model|which\s+model|what\s+make\s+and\s+model/i.test(out)) {
    out = out.replace(/.*(what\s+model|which\s+model|what\s+make\s+and\s+model).*\n?/gi, '')
  }

  if (hasName && /what'?s\s+your\s+name|your\s+name\??/i.test(out)) {
    out = out.replace(/.*(what'?s\s+your\s+name|your\s+name\??).*\n?/gi, '')
  }

  out = out.replace(/\n{3,}/g, '\n\n').trim()
  if (!out) {
    out = hasModel ? 'What seems to be the problem with it?' : 'What seems to be the problem, and which model is it?'
  }
  return out
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
