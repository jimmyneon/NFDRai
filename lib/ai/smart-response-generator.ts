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

  // STEP 3: Load prompt modules from database
  const { modules: promptModules, moduleNames } = await loadPromptModules(supabase, context.intent || 'unknown')
  
  // STEP 4: Build focused prompt based on state
  const stateGuidance = getPromptForState(context)
  
  // Get only relevant data (not everything)
  const relevantData = await getRelevantData(supabase, context)

  // STEP 5: Build compact, focused prompt (with database modules)
  const focusedPrompt = buildFocusedPrompt({
    context,
    stateGuidance,
    relevantData,
    customerMessage: params.customerMessage,
    recentMessages: messages.slice(-5), // Only last 5 messages
    promptModules // Pass database modules
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
  let finalResponse = shouldFallback ? settings.fallback_message : result.response

  // Check if this is the first AI message to this customer
  const isFirstAIMessage = !messages.some(m => m.sender === 'ai')
  
  if (isFirstAIMessage) {
    // Add AI disclosure to first message only
    const disclosure = "Hi! I'm AI Steve, your automated assistant for New Forest Device Repairs. I can help with pricing, bookings, and questions. "
    
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
  promptModules?: Array<{ module_name: string; prompt_text: string }>
}) {
  const { context, stateGuidance, relevantData, customerMessage, recentMessages, promptModules = [] } = params

  // Determine what context is relevant based on conversation
  const conversationText = recentMessages.map(m => m.text.toLowerCase()).join(' ')
  const needsScreenInfo = context.intent === 'screen_repair' || conversationText.includes('screen')
  const needsBatteryInfo = context.intent === 'battery_replacement' || conversationText.includes('battery')
  const needsWaterDamageInfo = conversationText.includes('water') || conversationText.includes('wet') || conversationText.includes('sea')
  const needsBuybackInfo = conversationText.includes('sell') || conversationText.includes('trade')
  const needsWarrantyInfo = conversationText.includes('warranty') || conversationText.includes('guarantee')
  const needsDiagnosticInfo = conversationText.includes('diagnostic') || conversationText.includes('check') || conversationText.includes('won\'t turn on')

  // Core identity (always included)
  const coreIdentity = `You are AI Steve, friendly assistant for New Forest Device Repairs.

WHAT YOU KNOW ABOUT THIS CONVERSATION:
${context.customerName ? `- Customer name: ${context.customerName}` : ''}
${context.deviceModel ? `- Device: ${context.deviceModel}` : context.deviceType ? `- Device type: ${context.deviceType}` : ''}

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
      
      // Context-specific modules (only when relevant)
      if (needsScreenInfo && (moduleName.includes('pricing_flow') || moduleName.includes('screen'))) {
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
      if (needsBuybackInfo && moduleName.includes('common_scenarios')) {
        shouldInclude = true
      }
      if (needsDiagnosticInfo && moduleName.includes('common_scenarios')) {
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
    // Fallback to hardcoded modules if database not available
    console.log('[Prompt Builder] Using fallback hardcoded modules')
    
    if (needsScreenInfo) {
      contextualInfo += `\n\nSCREEN REPAIRS:
- OLED screens: £100 (recommend first) - "very similar to genuine, 12-month warranty"
- Genuine Apple: £150+ (needs ordering, small deposit)
- Budget LCD: £50+ (only if they say too expensive)
- DRIP-FED FLOW: Present options → They choose → Confirm + stock info → THEN battery upsell in 2nd message
- ALWAYS mention battery combo AFTER they choose screen: "By the way, if your battery's not holding charge as well, we do £20 off battery replacements when done with a screen - so it'd be £30 instead of £50. Just a heads-up!"`
    }

    if (needsBatteryInfo) {
      contextualInfo += `\n\nBATTERY REPLACEMENTS:
- Most models: £50 (usually 30 minutes)
- Combo with screen: £30 (£20 off)
- Check battery health: Settings > Battery > Battery Health
- Below 85%: "That definitely needs replacing!"
- 6-month warranty on batteries`
    }

    if (needsWaterDamageInfo) {
      contextualInfo += `\n\nWATER DAMAGE:
- Free diagnostic
- "Water damage can be tricky and future reliability is always uncertain"
- "The sooner the better with water damage!"
- Sea water: "Mostly considered a data recovery job - future reliability uncertain"
- 30-day warranty on water damage repairs (due to progressive nature)`
    }

    if (needsBuybackInfo) {
      contextualInfo += `\n\nBUYBACK/TRADE-IN:
- Ask for: model, storage, condition, any issues
- "Send me details and I'll get you a quote ASAP" or "Pop in for instant appraisal"
- "We offer good rates and don't mess you about like online shops"
- Can do trade-ins towards repairs or purchases
- DON'T pass to John - you handle this`
    }

    if (needsWarrantyInfo) {
      contextualInfo += `\n\nWARRANTY:
- Screen replacements: 12 months
- Batteries & standard repairs: 6 months
- Water damage: 30 days
- Within warranty: "Pop in and we'll sort it out no charge"
- Just outside: "Pop in and we'll give you a discount"
- Refurbished devices: 12 months with full replacement if needed`
    }

    if (needsDiagnosticInfo) {
      contextualInfo += `\n\nDIAGNOSTICS:
- Water damage: Free
- Won't turn on: Free (suggest hard restart first: "Hold power and volume down together for 10 seconds")
- Complex issues: £10-£20 mobiles/iPads, £40 laptops/MacBooks
- "Usually take 15-30 minutes depending on how busy we are"`
    }

    // Add general service info if no specific context
    if (!needsScreenInfo && !needsBatteryInfo && !needsWaterDamageInfo && !needsBuybackInfo) {
      contextualInfo += `\n\nWHAT WE DO:
- REPAIRS: All devices (iPhones, iPads, Samsung, tablets, MacBooks, laptops)
- BUY DEVICES: Good rates, instant appraisals, trade-ins
- SELL DEVICES: Refurbished with 12-month warranty
- ACCESSORIES: Cases, screen protectors (£10, or £5 with screen repair), chargers
- SOFTWARE: Updates, data transfers, virus removal (£40-£70)
- Walk-in only, phone repairs done immediately unless complex`
    }
    
    // CRITICAL: Device model detection guidance (fallback)
    contextualInfo += `\n\nDEVICE MODEL DETECTION (CRITICAL):
- If customer doesn't know their model, HELP THEM FIND IT FIRST
- iPhone/iPad: "On your iPhone, go to Settings > General > About and look for 'Model Name'"
- Android: "On your phone, go to Settings > About Phone and look for the model number"
- DO NOT say "bring it in" until they've tried to find the model themselves
- Only suggest bringing it in if they tried and still can't find it
- Example: "No worries! On your iPhone, go to Settings > General > About and look for 'Model Name' - it'll say something like iPhone 12 or iPhone 13. What does yours say?"`
  }

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
