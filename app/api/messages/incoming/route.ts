import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateAIResponse } from '@/lib/ai/response-generator'
import { generateSmartResponse } from '@/lib/ai/smart-response-generator'
import { sendMessageViaProvider } from '@/app/lib/messaging/provider'
import { checkRateLimit } from '@/app/lib/rate-limiter'
import { checkMessageBatch } from '@/app/lib/message-batcher'
import { logApiCall } from '@/app/lib/api-logger'
import { shouldSwitchToAutoMode, getModeDecisionReason } from '@/app/lib/conversation-mode-analyzer'
import { isAutoresponder, getAutoresponderReason } from '@/app/lib/autoresponder-detector'
import { sendAlertNotification, shouldSendNotification } from '@/app/lib/alert-notifier'
import { isConfirmationFromJohn } from '@/app/lib/confirmation-extractor'
import { extractCustomerName, isLikelyValidName } from '@/app/lib/customer-name-extractor'
import { shouldAIRespond, isSimpleQuery } from '@/app/lib/simple-query-detector'
import { analyzeMessage } from '@/app/lib/unified-message-analyzer'
import { getModulesForAnalysis, logModuleSelection } from '@/app/lib/module-selector'

/**
 * Calculate similarity between two strings (0 = completely different, 1 = identical)
 * Uses simple word overlap comparison
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings - remove signature and extra whitespace
  const normalize = (s: string) => s
    .replace(/Many Thanks,?\s*AI Steve,?\s*New Forest Device Repairs/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  
  const norm1 = normalize(str1)
  const norm2 = normalize(str2)
  
  // If strings are very similar after normalization, they're duplicates
  if (norm1 === norm2) return 1.0
  
  // Check if one contains most of the other
  const shorter = norm1.length < norm2.length ? norm1 : norm2
  const longer = norm1.length < norm2.length ? norm2 : norm1
  
  if (longer.includes(shorter) && shorter.length > 20) {
    return 0.95 // Very similar if one contains the other
  }
  
  // Word-based similarity
  const words1 = norm1.split(/\s+/).filter(w => w.length > 3)
  const words2 = norm2.split(/\s+/).filter(w => w.length > 3)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  const commonWords = words1.filter(w => words2.includes(w))
  const similarity = (commonWords.length * 2) / (words1.length + words2.length)
  
  return similarity
}

/**
 * Webhook endpoint for incoming messages from SMS/WhatsApp/Messenger
 * 
 * Expected payload:
 * {
 *   "from": "+1234567890" or "messenger_id",
 *   "message": "Customer message text",
 *   "channel": "sms" | "whatsapp" | "messenger",
 *   "customerName": "John Doe" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let payload: any = null
  let from: string
  let message: string
  let channel: string
  let customerName: string | undefined
  
  try {
    // Check content type to determine how to parse
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Parse form data
      const formData = await request.formData()
      from = formData.get('from') as string
      message = formData.get('message') as string
      channel = formData.get('channel') as string
      customerName = formData.get('customerName') as string | undefined
      payload = { from, message, channel, customerName }
      console.log('[Incoming] Parsed form data')
    } else {
      // Parse JSON with explicit UTF-8 handling
      const rawBody = await request.text()
      console.log('[Incoming] Raw body length:', rawBody.length)
      console.log('[Incoming] Raw body preview:', rawBody.substring(0, 200))
      
      try {
        payload = JSON.parse(rawBody)
      } catch (jsonError) {
        // If JSON parsing fails, the issue is likely unescaped newlines within string values
        // We need to escape newlines ONLY within quoted strings, not the JSON structure itself
        console.log('[Incoming] JSON parse failed, attempting to fix...')
        
        // More robust approach: escape control chars only within string values
        let inString = false
        let escaped = false
        let fixedBody = ''
        
        for (let i = 0; i < rawBody.length; i++) {
          const char = rawBody[i]
          
          if (char === '"' && !escaped) {
            inString = !inString
            fixedBody += char
          } else if (inString && !escaped) {
            // Inside a string value - escape control characters
            if (char === '\n') {
              fixedBody += '\\n'
            } else if (char === '\r') {
              fixedBody += '\\r'
            } else if (char === '\t') {
              fixedBody += '\\t'
            } else if (char === '\\') {
              fixedBody += '\\\\'
              escaped = true
            } else {
              fixedBody += char
            }
          } else {
            fixedBody += char
            escaped = false
          }
        }
        
        console.log('[Incoming] Fixed body preview:', fixedBody.substring(0, 200))
        payload = JSON.parse(fixedBody)
      }
      
      from = payload.from
      message = payload.message
      channel = payload.channel
      customerName = payload.customerName
      console.log('[Incoming] Parsed JSON')
    }

    if (!from || !message || !channel) {
      const response = NextResponse.json(
        { error: 'Missing required fields: from, message, channel' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      )
      
      // Log failed request
      await logApiCall({
        endpoint: '/api/messages/incoming',
        method: 'POST',
        statusCode: 400,
        requestBody: payload,
        responseBody: { error: 'Missing required fields' },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        startTime,
      })
      
      return response
    }

    const supabase = await createClient()
    const supabaseService = createServiceClient() // For operations that bypass RLS (alerts, etc.)

    // Check if this is an automated message (e.g., eBay, Lebara, Dominos, delivery notifications)
    const isAutomated = isAutoresponder(message, from)
    if (isAutomated) {
      const reason = getAutoresponderReason(message, from)
      console.log('[Autoresponder] Detected automated message')
      console.log('[Autoresponder] From:', from)
      console.log('[Autoresponder] Reason:', reason)
      console.log('[Autoresponder] Message preview:', message.substring(0, 100))
      
      // Still save the message but don't respond
      // Find or create customer for logging purposes
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', from)
        .maybeSingle()
      
      if (!customer) {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({ phone: from, name: 'Automated System' })
          .select()
          .single()
        customer = newCustomer
      }
      
      if (customer) {
        // Find or create conversation
        let { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('customer_id', customer.id)
          .eq('channel', channel)
          .single()
        
        if (!conversation) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              customer_id: customer.id,
              channel,
              status: 'auto',
            })
            .select()
            .single()
          conversation = newConv
        }
        
        if (conversation) {
          // Save the message for record keeping
          await supabase.from('messages').insert({
            conversation_id: conversation.id,
            text: message,
            sender: 'customer',
          })
        }
      }
      
      return NextResponse.json({
        success: true,
        mode: 'ignored',
        message: 'Automated message detected - no response sent',
        reason,
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    }

    // Rate limiting: Max 10 messages per minute per phone number (prevents spam)
    const rateLimit = checkRateLimit(from, 'incoming-sms', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
    })

    if (!rateLimit.allowed) {
      console.log(`[Incoming SMS] Rate limited: ${from}`)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many messages. Please slow down.',
        },
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      )
    }

    // Find or create customer
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', from)
      .single()

    // Compute a safe initial name from payload or message
    const initialNameCandidate = (customerName && typeof customerName === 'string') ? customerName : ''
    const firstWord = initialNameCandidate.trim().split(/\s+/)[0] || ''
    let safeName: string | null = null
    if (firstWord && isLikelyValidName(firstWord)) {
      safeName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase()
    } else {
      const extracted = extractCustomerName(message)
      if (extracted.customerName && isLikelyValidName(extracted.customerName)) {
        safeName = extracted.customerName
      }
    }

    if (!customer) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          name: safeName,
          phone: from,
        })
        .select()
        .single()

      customer = newCustomer
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      )
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          customer_id: customer.id,
          channel,
          status: 'auto',
        })
        .select()
        .single()

      conversation = newConversation
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      )
    }

    // Name extraction is handled by unified analyzer below (lines 629-635)
    // The unified analyzer already extracts names as part of the single AI call
    // No need for separate extraction here

    // CRITICAL: Check if this exact message was already received recently (within 5 seconds)
    // This prevents duplicate processing if MacroDroid sends the webhook twice
    // Use a unique constraint check to prevent race conditions
    const messageHash = `${conversation.id}-${message}-${Date.now().toString().slice(0, -3)}` // Same second
    
    const { data: recentCustomerMessages } = await supabase
      .from('messages')
      .select('created_at, text')
      .eq('conversation_id', conversation.id)
      .eq('sender', 'customer')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (recentCustomerMessages && recentCustomerMessages.length > 0) {
      const lastMessage = recentCustomerMessages[0]
      const timeSinceLastMessage = (Date.now() - new Date(lastMessage.created_at).getTime()) / 1000
      
      // If same message text within 5 seconds, it's a duplicate webhook call
      if (lastMessage.text === message && timeSinceLastMessage < 5) {
        console.log(`[Duplicate Webhook] Same message "${message}" received ${timeSinceLastMessage.toFixed(1)}s ago - ignoring`)
        console.log(`[Duplicate Webhook] This is webhook call #2 for the same message - returning early`)
        return NextResponse.json({
          success: true,
          mode: 'duplicate_ignored',
          message: 'Duplicate webhook call detected - message already processed',
          timeSinceLastMessage: timeSinceLastMessage.toFixed(1)
        }, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        })
      }
    }

    console.log(`[Message Processing] Inserting customer message: "${message.substring(0, 50)}..."`)
    
    // Insert customer message
    const { error: insertError, data: insertedMessage } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender: 'customer',
      text: message,
    }).select('id').single()
    
    if (insertError) {
      console.error('[Message Processing] Failed to insert customer message:', insertError)
      // If insert fails due to duplicate, just return success (message already processed)
      if (insertError.message?.includes('duplicate') || insertError.code === '23505') {
        console.log('[Duplicate Webhook] Insert failed due to duplicate - message already being processed')
        return NextResponse.json({
          success: true,
          mode: 'duplicate_ignored',
          message: 'Message already being processed by another request',
        }, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        })
      }
      throw insertError
    }
    
    const messageId = insertedMessage?.id
    console.log(`[Message Processing] Customer message inserted successfully (ID: ${messageId})`)

    // CRITICAL: Check if AI just sent a message (within last 2 seconds)
    // BUT only skip if customer message is very short/vague (not a real answer)
    const { data: recentAIMessages } = await supabase
      .from('messages')
      .select('created_at, text')
      .eq('conversation_id', conversation.id)
      .eq('sender', 'ai')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (recentAIMessages && recentAIMessages.length > 0) {
      const lastAIMessageTime = new Date(recentAIMessages[0].created_at).getTime()
      const secondsSinceLastAI = (Date.now() - lastAIMessageTime) / 1000
      
      // Only skip if BOTH conditions are true:
      // 1. AI sent message very recently (< 2 seconds)
      // 2. Customer message is very short/vague (likely still typing or acknowledging)
      const isVeryRecent = secondsSinceLastAI < 2
      const messageWords = message.trim().split(/\s+/)
      const isVagueResponse = messageWords.length <= 3 && 
        /^(ok|okay|sure|yes|no|not sure|idk|dunno|hmm|uh|um)$/i.test(message.trim())
      
      if (isVeryRecent && isVagueResponse) {
        console.log(`[Duplicate Prevention] AI sent message ${secondsSinceLastAI.toFixed(1)}s ago and customer sent vague response "${message}" - waiting`)
        console.log(`[Duplicate Prevention] Last AI message: ${recentAIMessages[0].text.substring(0, 100)}`)
        
        return NextResponse.json({
          success: true,
          mode: 'waiting',
          message: 'AI just responded and customer still typing - waiting',
          secondsSinceLastAI: secondsSinceLastAI.toFixed(1)
        }, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        })
      }
      
      // If customer sent a real answer (e.g., "iPhone 15", "Screen is cracked"), process it!
      if (!isVagueResponse) {
        console.log(`[Duplicate Prevention] Customer sent real answer "${message}" - processing even though AI sent ${secondsSinceLastAI.toFixed(1)}s ago`)
      }
    }

    // Check if we should batch this message with others (handles rapid messages)
    const batchResult = await checkMessageBatch(
      customer.id,
      conversation.id,
      message
    )

    // If this is part of a batch, combine all messages for a comprehensive response
    const messageToProcess = batchResult.shouldBatch
      ? batchResult.allMessages.join('\n')
      : message

    if (batchResult.shouldBatch) {
      console.log(`[Batching] Combined ${batchResult.allMessages.length} rapid messages from ${from}`)
    }

    // Only the first resolver should proceed to generate and send the AI response
    if (!batchResult.shouldRespond) {
      console.log('[Batching] Another request will handle the AI response; returning early')
      return NextResponse.json({
        success: true,
        mode: 'batched_wait',
        message: 'Another request elected to respond; this one exits',
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    }

    // ============================================================================
    // UNIFIED MESSAGE ANALYSIS (Sentiment + Intent + Context + Name Extraction)
    // ============================================================================
    console.log('[Unified Analysis] Analyzing customer message...')
    
    // Get recent messages for context
    const { data: contextMessages } = await supabase
      .from('messages')
      .select('sender, text')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Get API key for AI analysis
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('api_key')
      .eq('active', true)
      .single()
    
    // Run unified analysis
    const analysis = await analyzeMessage(
      messageToProcess,
      contextMessages || [],
      aiSettings?.api_key
    )
    
    console.log('[Unified Analysis] Result:', {
      sentiment: analysis.sentiment,
      intent: analysis.intent,
      contentType: analysis.contentType,
      shouldRespond: analysis.shouldAIRespond,
      requiresAttention: analysis.requiresStaffAttention,
      confidence: analysis.overallConfidence
    })
    
    // Save analysis to database (async, don't wait)
    if (messageId) {
      saveAnalysisAsync(analysis, messageId, conversation.id, supabase)
        .catch((err: unknown) => console.error('[Analysis Save] Error:', err))
    }
    
    // Check if requires staff attention IMMEDIATELY
    if (analysis.requiresStaffAttention) {
      console.log('[Mode Decision] Customer requires staff attention - switching to manual')
      
      // Switch to manual mode
      await supabase
        .from('conversations')
        .update({ status: 'manual' })
        .eq('id', conversation.id)
      
      // Create alert
      await supabase.from('alerts').insert({
        conversation_id: conversation.id,
        type: analysis.urgency === 'critical' ? 'urgent' : 'manual_required',
        message: analysis.reasoning
      })
      
      return NextResponse.json({
        success: true,
        mode: 'manual',
        message: analysis.reasoning,
        analysis: {
          sentiment: analysis.sentiment,
          urgency: analysis.urgency,
          intent: analysis.intent,
          contentType: analysis.contentType
        }
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    }
    
    // Check if should NOT respond
    if (!analysis.shouldAIRespond) {
      console.log('[Mode Decision] Should not respond:', analysis.reasoning)
      
      return NextResponse.json({
        success: true,
        mode: 'no_response',
        message: analysis.reasoning
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    }
    
    // Update customer name if found
    if (analysis.customerName && isLikelyValidName(analysis.customerName)) {
      console.log('[Name Extraction] Found customer name:', analysis.customerName)
      await supabase.from('customers').update({ 
        name: analysis.customerName 
      }).eq('id', customer.id)
    }

    // Check global kill switch
    const { data: globalSettings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('automation_enabled')
      .eq('active', true)
      .single()

    console.log('Global settings:', globalSettings)
    console.log('Settings error:', settingsError)

    if (!globalSettings?.automation_enabled) {
      await supabaseService.from('alerts').insert({
        conversation_id: conversation.id,
        type: 'manual_required',
        notified_to: 'admin',
      })

      return NextResponse.json({
        success: true,
        mode: 'manual',
        message: 'Message received - AI automation is disabled',
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    }

    // Check if conversation is blocked (AI permanently disabled)
    if (conversation.status === 'blocked') {
      console.log('[AI Blocked] This conversation is blocked - AI will never respond')
      return NextResponse.json({ 
        success: true, 
        message: 'Message received (conversation blocked - no AI response)',
        ai_blocked: true
      })
    }

    // Track if we just switched to auto mode (to skip blocking checks)
    let justSwitchedToAuto = false

    // Check if conversation is in manual mode
    if (conversation.status !== 'auto') {
      // Check if staff has manually replied in this conversation
      const { data: staffMessages } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('conversation_id', conversation.id)
        .eq('sender', 'staff')
        .order('created_at', { ascending: false })
        .limit(1)
      
      const hasStaffReplied = staffMessages && staffMessages.length > 0
      
      console.log('[Smart Mode] Conversation in manual mode')
      console.log('[Smart Mode] Staff has replied?', hasStaffReplied)
      
      if (hasStaffReplied) {
        // Check how long ago staff replied
        const lastStaffReplyTime = new Date(staffMessages[0].created_at).getTime()
        const minutesSinceStaffReply = (Date.now() - lastStaffReplyTime) / (1000 * 60)
        
        // If staff replied more than 30 minutes ago, auto-switch to AI
        const timeBasedSwitch = minutesSinceStaffReply > 30
        
        // Staff has replied - analyze if we should switch back to auto mode
        const shouldAutoSwitch = timeBasedSwitch || shouldSwitchToAutoMode(message)
        const reason = timeBasedSwitch 
          ? `Staff replied ${minutesSinceStaffReply.toFixed(0)} min ago - switching to auto`
          : getModeDecisionReason(message, shouldAutoSwitch)
        
        console.log('[Smart Mode] Message:', message.substring(0, 50))
        console.log('[Smart Mode] Minutes since staff reply:', minutesSinceStaffReply.toFixed(0))
        console.log('[Smart Mode] Should switch to auto?', shouldAutoSwitch)
        console.log('[Smart Mode] Reason:', reason)
        
        if (shouldAutoSwitch) {
          // Switch back to auto mode - this is a generic question AI can handle
          await supabase
            .from('conversations')
            .update({ 
              status: 'auto',
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversation.id)
          
          console.log('[Smart Mode] ✅ Switched to auto mode -', reason)
          
          // Set flag to skip blocking checks since we just switched to auto
          // This ensures AI responds to the message that triggered the switch
          justSwitchedToAuto = true
          
          // Continue to AI response generation below
          // Don't return here - let the AI handle the message
        } else {
          // Stay in manual mode - send alert to staff
          console.log('[Smart Mode] ⏸️  Staying in manual mode -', reason)
          
          // Check if we should send notification
          const { data: recentAlerts } = await supabase
            .from('alerts')
            .select('created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
          
          const lastAlertTime = recentAlerts?.[0]?.created_at
          
          if (shouldSendNotification(conversation.id, 'manual_required', lastAlertTime ? new Date(lastAlertTime) : undefined)) {
            // Send SMS notification via MacroDroid
            await sendAlertNotification({
              conversationId: conversation.id,
              alertType: 'manual_required',
              customerPhone: customer.phone,
              customerName: customer.name,
              lastMessage: message,
            })
          }
          
          await supabaseService.from('alerts').insert({
            conversation_id: conversation.id,
            type: 'manual_required',
            notified_to: 'admin',
          })

          return NextResponse.json({
            success: true,
            mode: 'manual',
            message: 'Message received - manual response required',
            reason,
          }, {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
          })
        }
      } else {
        // No staff reply yet - check if we should switch to auto based on message type
        console.log('[Smart Mode] No staff reply yet - checking if should switch to auto')
        
        const shouldAutoSwitch = shouldSwitchToAutoMode(message)
        const reason = getModeDecisionReason(message, shouldAutoSwitch)
        
        console.log('[Smart Mode] Should switch to auto?', shouldAutoSwitch)
        console.log('[Smart Mode] Reason:', reason)
        
        if (shouldAutoSwitch) {
          // Switch to auto mode - this is a generic question AI can handle
          await supabase
            .from('conversations')
            .update({ 
              status: 'auto',
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversation.id)
          
          console.log('[Smart Mode] ✅ Switched to auto mode -', reason)
          
          // Set flag to skip blocking checks
          justSwitchedToAuto = true
          
          // Continue to AI response generation below
        } else {
          // Stay in manual mode
          console.log('[Smart Mode] ⏸️  Staying in manual mode -', reason)
          
          await supabaseService.from('alerts').insert({
            conversation_id: conversation.id,
            type: 'manual_required',
            notified_to: 'admin',
          })

          return NextResponse.json({
            success: true,
            mode: 'manual',
            message: 'Message received - manual response required (no staff reply yet)',
            reason,
          }, {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
          })
        }
      }
    }

    // Check if staff has recently replied
    // If staff replied within last 30 minutes, only respond to simple queries (hours, directions, etc)
    // UNLESS we just switched to auto mode (then always respond)
    
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('sender, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentStaffMessage = recentMessages?.find(
      (msg) => msg.sender === 'staff'
    )

    if (recentStaffMessage && !justSwitchedToAuto) {
      const minutesSinceStaffMessage = 
        (Date.now() - new Date(recentStaffMessage.created_at).getTime()) / 1000 / 60

      // Check if AI should respond based on time and message type
      const aiResponseDecision = shouldAIRespond(minutesSinceStaffMessage, message)
      
      console.log('[Staff Activity Check] Minutes since staff message:', minutesSinceStaffMessage.toFixed(1))
      console.log('[Staff Activity Check] Should AI respond?', aiResponseDecision.shouldRespond)
      console.log('[Staff Activity Check] Reason:', aiResponseDecision.reason)
      
      if (!aiResponseDecision.shouldRespond) {
        // Staff replied recently and this isn't a simple query - don't respond
        // Send alert to notify staff of new message
        await supabaseService.from('alerts').insert({
          conversation_id: conversation.id,
          type: 'manual_required',
          notified_to: 'admin',
        })

        return NextResponse.json({
          success: true,
          mode: 'paused',
          message: aiResponseDecision.reason,
          minutesSinceStaffMessage: minutesSinceStaffMessage.toFixed(1),
        }, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        })
      }
      
      // AI can respond - either it's been 30+ minutes or it's a simple query
      console.log('[Staff Activity Check] ✅ AI will respond:', aiResponseDecision.reason)
    } else if (justSwitchedToAuto) {
      console.log('[Staff Activity Check] ✅ Just switched to auto mode - AI will respond')
    }

    // CONTEXT CONFIDENCE CHECK: Does this message make sense to respond to?
    // Context check already handled by unified analyzer earlier
    // Proceeding with AI response generation

    // Select modules based on analysis
    const modulesToLoad = getModulesForAnalysis(analysis)
    logModuleSelection(analysis, modulesToLoad)

    // Generate AI response with smart state-aware generator (using batched message if applicable)
    console.log('[Smart AI] Generating response with state awareness...')
    const aiResult = await generateSmartResponse({
      customerMessage: messageToProcess,
      conversationId: conversation.id,
      customerPhone: from, // Pass customer phone for history lookup
      modules: modulesToLoad,  // NEW: Load only relevant modules based on analysis
    })
    
    console.log('[Smart AI] Response generated:', {
      state: aiResult.context.state,
      intent: aiResult.context.intent,
      confidence: aiResult.confidence,
      validationPassed: aiResult.analytics.validationPassed,
      cost: aiResult.analytics.costUsd
    })

    // Check if AI response indicates manual handoff (more specific patterns)
    const handoffPhrases = [
      /i'?ll pass.*(?:onto|on to|to).*john/i,
      /i'?ll check.*with.*john/i,
      /let me.*check.*with.*john/i,
      /i'?ll.*forward.*(?:this|that|it).*to.*john/i,
      /i'?ll.*ask.*john/i,
      /john.*will.*(?:get back|contact|call)/i,
      /need.*to.*(?:check|speak|talk).*with.*john/i,
      /i'?ll.*have.*john.*(?:contact|call|reach out)/i,
    ]
    
    const indicatesHandoff = handoffPhrases.some(pattern => 
      pattern.test(aiResult.response)
    )

    // Handle multiple messages (split by |||)
    // Send each message separately with a delay between them
    console.log(`[AI Response] Generated ${aiResult.responses.length} message(s)`)
    console.log(`[AI Response] Messages:`, aiResult.responses.map((r, i) => `${i + 1}. ${r.substring(0, 50)}...`))
    
    // CRITICAL: Remove duplicate messages from responses array
    // Sometimes AI generates similar responses - only send unique ones
    const uniqueResponses = aiResult.responses.filter((response, index, self) => {
      // Check if this response is substantially similar to any previous response
      for (let j = 0; j < index; j++) {
        const similarity = calculateSimilarity(response, self[j])
        if (similarity > 0.7) {  // Lowered from 0.8 to catch more duplicates
          console.log(`[Duplicate Prevention] Skipping response ${index + 1} - ${(similarity * 100).toFixed(0)}% similar to response ${j + 1}`)
          console.log(`[Duplicate Prevention] Response ${j + 1}: "${self[j].substring(0, 80)}..."`)
          console.log(`[Duplicate Prevention] Response ${index + 1}: "${response.substring(0, 80)}..."`)
          return false
        }
      }
      return true
    })
    
    console.log(`[AI Response] After deduplication: ${uniqueResponses.length} unique message(s)`)
    
    // Name extraction already handled by unified analyzer earlier
    
    for (let i = 0; i < uniqueResponses.length; i++) {
      const messageText = uniqueResponses[i]
      
      console.log(`[AI Response] Sending message ${i + 1}/${uniqueResponses.length}`)
      
      // Insert AI response into database
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender: 'ai',
        text: messageText,
        ai_provider: aiResult.provider,
        ai_model: aiResult.model,
        ai_confidence: aiResult.confidence,
      })

      // Send message via MacroDroid webhook
      await sendMessageViaProvider({
        channel: 'sms',
        to: from,
        text: messageText,
      })

      // Add 2-second delay between messages (except after last one)
      if (i < aiResult.responses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // If fallback was triggered or AI indicates manual handoff, create alert
    // Don't switch modes - just notify staff
    if (aiResult.shouldFallback || indicatesHandoff) {
      await supabaseService.from('alerts').insert({
        conversation_id: conversation.id,
        type: indicatesHandoff ? 'manual_required' : 'low_confidence',
        notified_to: 'admin',
      })
    }

    // Track delivery status (all messages sent successfully)
    const deliveryStatus = {
      sent: true,
      provider: 'macrodroid',
    }

    // Update last message with delivery status
    const { data: aiMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversation.id)
      .eq('sender', 'ai')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (aiMessage) {
      await supabase
        .from('messages')
        .update({ 
          delivered: true,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', aiMessage.id)
    }

    const responseBody = {
      success: true,
      response: aiResult.response,
      responses: aiResult.responses,  // Include array of messages
      messageCount: aiResult.responses.length,  // How many messages were sent
      confidence: aiResult.confidence,
      fallback: aiResult.shouldFallback,
      delivered: deliveryStatus.sent,
      deliveryProvider: deliveryStatus.provider,
    }

    // Log successful request
    await logApiCall({
      endpoint: '/api/messages/incoming',
      method: 'POST',
      statusCode: 200,
      requestBody: payload,
      responseBody,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      startTime,
    })

    return NextResponse.json(responseBody, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Incoming message error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process message'
    
    // Log error
    await logApiCall({
      endpoint: '/api/messages/incoming',
      method: 'POST',
      statusCode: 500,
      requestBody: payload,
      error: errorMessage,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      startTime,
    })
    
    return NextResponse.json(
      { error: 'Failed to process message' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    )
  }
}

/**
 * Save unified analysis to database (async, non-blocking)
 */
async function saveAnalysisAsync(
  analysis: any,
  messageId: string,
  conversationId: string,
  supabase: any
): Promise<void> {
  try {
    console.log('[Analysis Save] Saving to database...')
    
    // Save sentiment analysis with intent and contentType
    const { error: insertError } = await supabase
      .from('sentiment_analysis')
      .insert({
        message_id: messageId,
        conversation_id: conversationId,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        confidence: analysis.overallConfidence,
        reasoning: analysis.reasoning,
        keywords: analysis.sentimentKeywords || [],
        requires_staff_attention: analysis.requiresStaffAttention,
        should_ai_respond: analysis.shouldAIRespond,  // NEW!
        intent: analysis.intent,
        content_type: analysis.contentType,
        intent_confidence: analysis.intentConfidence,
        analysis_method: analysis.overallConfidence >= 0.7 ? 'regex' : 'ai'
      })
    
    if (insertError) {
      console.error('[Analysis Save] Failed:', insertError)
      return
    }
    
    console.log('[Analysis Save] ✅ Saved successfully')
  } catch (error) {
    console.error('[Analysis Save] Error:', error)
    // Don't throw - analysis save is non-critical
  }
}
