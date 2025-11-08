/**
 * Conversation State Machine
 * Tracks where we are in the conversation flow to prevent AI confusion
 */

export type ConversationState = 
  | 'new_inquiry'           // First message from customer
  | 'gathering_device_info' // Asked for device, waiting for answer
  | 'gathering_issue_info'  // Asked for issue, waiting for answer
  | 'presenting_options'    // Showed pricing options
  | 'confirming_choice'     // Customer said yes, confirming which option
  | 'upselling'            // Offered battery/additional service
  | 'ready_to_visit'       // All info gathered, ready for walk-in
  | 'follow_up'            // Customer asking about existing repair
  | 'general_inquiry'      // Non-repair question
  | 'handoff_required';    // Needs John

export type ConversationIntent =
  | 'screen_repair'
  | 'battery_replacement'
  | 'diagnostic'
  | 'buyback'
  | 'sell_device'
  | 'warranty_claim'
  | 'general_info'
  | 'status_check'
  | 'unknown';

export interface ConversationContext {
  state: ConversationState;
  intent: ConversationIntent;
  deviceType?: 'iphone' | 'ipad' | 'macbook' | 'laptop' | 'samsung' | 'phone' | 'tablet' | 'watch' | 'other';
  deviceModel?: string;
  issue?: string;
  quotedPrice?: number;
  customerName?: string;
  lastStateChange: Date;
  stateHistory: Array<{ state: ConversationState; timestamp: Date }>;
}

/**
 * Determines the current conversation state based on message history
 */
export function analyzeConversationState(messages: Array<{
  sender: 'customer' | 'ai' | 'staff';
  text: string;
  created_at: string;
}>): ConversationContext {
  
  if (messages.length === 0) {
    return {
      state: 'new_inquiry',
      intent: 'unknown',
      lastStateChange: new Date(),
      stateHistory: [{ state: 'new_inquiry', timestamp: new Date() }]
    };
  }

  const lastAIMessage = messages.filter(m => m.sender === 'ai').slice(-1)[0];
  const lastCustomerMessage = messages.filter(m => m.sender === 'customer').slice(-1)[0];
  
  // CHECK TIME DECAY: If last message was >4 hours ago, treat as NEW conversation
  const lastMessageTime = lastCustomerMessage ? new Date(lastCustomerMessage.created_at) : new Date();
  const hoursSinceLastMessage = (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60);
  const isStaleContext = hoursSinceLastMessage > 4;
  
  // If context is stale OR customer says generic greeting, reset context
  const isGenericGreeting = lastCustomerMessage?.text.toLowerCase().match(/^(hi|hello|hey|good morning|good afternoon)$/);
  const shouldResetContext = isStaleContext || isGenericGreeting;
  
  // Only use recent messages for context (last 5 messages OR messages from last 4 hours)
  const recentMessages = shouldResetContext 
    ? [lastCustomerMessage].filter(Boolean) // Only current message if context is stale
    : messages.filter(m => {
        const msgTime = new Date(m.created_at);
        const hoursAgo = (Date.now() - msgTime.getTime()) / (1000 * 60 * 60);
        return hoursAgo <= 4;
      }).slice(-5); // Last 5 messages within 4 hours
  
  const allText = recentMessages.map(m => m.text.toLowerCase()).join(' ');

  // Extract device info if mentioned (only from recent context)
  const deviceType = extractDeviceType(allText);
  const deviceModel = extractDeviceModel(allText);
  const customerName = extractCustomerName(recentMessages);

  // Determine intent from conversation (only recent messages)
  const intent = determineIntent(allText);

  // Determine state based on conversation flow
  let state: ConversationState = 'new_inquiry';

  // Check if asking about existing repair
  if (allText.includes('ready') || allText.includes('done') || allText.includes('finished')) {
    state = 'follow_up';
  }
  // Check if ready for visit
  else if (deviceModel && intent !== 'unknown' && lastAIMessage?.text.toLowerCase().includes('pop in')) {
    state = 'ready_to_visit';
  }
  // Check if we're in upsell phase (mentioned battery combo)
  else if (lastAIMessage?.text.includes('£20 off battery')) {
    state = 'upselling';
  }
  // Check if AI presented pricing options and customer responded positively
  else if (lastAIMessage?.text.includes('£') && 
           (lastAIMessage?.text.includes('OLED') || lastAIMessage?.text.includes('genuine')) &&
           lastCustomerMessage?.text.toLowerCase().match(/yes|yeah|ok|sure|interested|please/)) {
    state = 'confirming_choice';
  }
  // Check if AI presented pricing options (waiting for response)
  else if (lastAIMessage?.text.includes('£') && 
           (lastAIMessage?.text.includes('OLED') || lastAIMessage?.text.includes('genuine'))) {
    state = 'presenting_options';
  }
  // Check if AI asked about the issue
  else if (lastAIMessage?.text.toLowerCase().includes('what can i help') ||
           lastAIMessage?.text.toLowerCase().includes('what\'s wrong')) {
    state = 'gathering_issue_info';
  }
  // Check if AI asked for device info and customer hasn't provided it
  else if (lastAIMessage?.text.toLowerCase().includes('what make and model') ||
      lastAIMessage?.text.toLowerCase().includes('which device')) {
    state = 'gathering_device_info';
  }

  return {
    state,
    intent,
    deviceType,
    deviceModel,
    customerName,
    lastStateChange: new Date(),
    stateHistory: [{ state, timestamp: new Date() }]
  };
}

/**
 * Extract device type from conversation text
 */
function extractDeviceType(text: string): ConversationContext['deviceType'] {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('iphone')) return 'iphone';
  if (lowerText.includes('ipad')) return 'ipad';
  if (lowerText.includes('macbook') || lowerText.includes('mac book')) return 'macbook';
  if (lowerText.includes('samsung') || lowerText.includes('galaxy')) return 'samsung';
  if (lowerText.includes('laptop') || lowerText.includes('notebook')) return 'laptop';
  if (lowerText.includes('phone') || lowerText.includes('mobile')) return 'phone';
  if (lowerText.includes('tablet')) return 'tablet';
  if (lowerText.includes('watch') || lowerText.includes('apple watch')) return 'watch';
  return undefined;
}

/**
 * Extract specific device model
 */
function extractDeviceModel(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  // iPhone models - must have number or specific identifier
  const iphoneMatch = text.match(/iphone\s*(1[0-5]|[6-9]|x[rs]?|se|pro\s*max|plus|mini)/i);
  if (iphoneMatch) return iphoneMatch[0];

  // iPad models - only if specific model mentioned
  const ipadMatch = text.match(/ipad\s+(pro|air|mini|\d)/i);
  if (ipadMatch) return ipadMatch[0];

  // Samsung Galaxy models - broader detection
  const samsungMatch = text.match(/galaxy\s*([san]\d+|s\d+\s*(ultra|plus|fe)?|note\s*\d+|fold\s*\d*|flip\s*\d*)/i);
  if (samsungMatch) return samsungMatch[0];

  // MacBook models
  const macbookMatch = text.match(/macbook\s*(pro|air)?(\s*(13|14|15|16))?/i);
  if (macbookMatch && (macbookMatch[1] || macbookMatch[2])) return macbookMatch[0];

  // Generic "just iPad" or "just iPhone" should NOT match - we need specifics
  // This ensures Steve asks for the model
  return undefined;
}

/**
 * Extract customer name from messages
 */
function extractCustomerName(messages: Array<{ sender: string; text: string }>): string | undefined {
  for (const msg of messages) {
    if (msg.sender === 'customer') {
      // Look for "I'm [name]" or "My name is [name]"
      const match = msg.text.match(/(?:i'm|i am|my name is|this is)\s+([A-Z][a-z]+)/i);
      if (match) return match[1];
    }
  }
  return undefined;
}

/**
 * Determine conversation intent
 */
function determineIntent(text: string): ConversationIntent {
  if (text.includes('screen') && (text.includes('crack') || text.includes('broken') || text.includes('smash'))) {
    return 'screen_repair';
  }
  if (text.includes('battery') || text.includes('drain') || text.includes('charge')) {
    return 'battery_replacement';
  }
  if (text.includes('won\'t turn on') || text.includes('not working') || text.includes('dead')) {
    return 'diagnostic';
  }
  if (text.includes('sell') || text.includes('buy') && text.includes('my')) {
    return 'buyback';
  }
  if (text.includes('warranty') || text.includes('still not working')) {
    return 'warranty_claim';
  }
  if (text.includes('ready') || text.includes('done') || text.includes('finished')) {
    return 'status_check';
  }
  return 'unknown';
}

/**
 * Get the appropriate prompt module based on state and intent
 */
export function getPromptForState(context: ConversationContext): string {
  const { state, intent } = context;

  // State-specific guidance
  const stateGuidance: Record<ConversationState, string> = {
    new_inquiry: `
🎯 STATE: New Inquiry
- Customer just started conversation OR context is stale (>4 hours)
- DO NOT assume you know what they want - even if you spoke yesterday
- ALWAYS start fresh: "Hi! What can I help you with today?"
- Let THEM tell you what they need
- If they mention previous conversation, acknowledge it but re-qualify their current need
- Example: "Hi! Are you looking to bring in that iPhone we discussed, or is there something else I can help with?"

DEVICE INFO REQUIREMENTS:
- You MUST get SPECIFIC model (e.g., "iPhone 12", not just "iPhone")
- If customer says just "iPhone" or "iPad", ask "What model is it?"
- Don't proceed with pricing until you have the specific model`,

    gathering_device_info: `
🎯 STATE: Gathering Device Info
- You ALREADY asked for device info
- Customer should be providing it now
- DO NOT ask again - acknowledge their answer
- If unclear, ask for clarification only`,

    gathering_issue_info: `
🎯 STATE: Gathering Issue Info
- Device type: ${context.deviceType || 'unknown'}
- Device model: ${context.deviceModel || 'NOT YET PROVIDED'}
- CRITICAL: If device model is "NOT YET PROVIDED", you MUST ask "What model ${context.deviceType || 'device'} is it?" BEFORE asking about the issue
- Only after you have the SPECIFIC MODEL (e.g., iPhone 12, iPad Pro) can you ask what's wrong
- DO NOT skip the model question - it's required for pricing`,

    presenting_options: `
🎯 STATE: Presenting Options
- You ALREADY showed pricing options
- Wait for customer to choose
- DO NOT repeat pricing
- If they ask questions, answer them`,

    confirming_choice: `
🎯 STATE: Confirming Choice
- Customer showed interest
- CRITICAL: Confirm WHICH option they want (OLED vs Genuine)
- Ask explicitly: "Just to confirm, is that the OLED at £X or genuine at £Y?"`,

    upselling: `
🎯 STATE: Upselling
- You offered battery combo discount
- Wait for their response
- If yes: give total price
- If no: wrap up and invite to visit`,

    ready_to_visit: `
🎯 STATE: Ready to Visit
- All info gathered
- CHECK BUSINESS HOURS and respond accordingly:
  * If closed: "We're closed now - open tomorrow at [time]"
  * If near closing: "We close at [time] - if you can't make it today, we're open tomorrow"
  * If open: "Pop in anytime - we're open until [closing time]!"
- ALWAYS mention turnaround time: "Usually takes about 1 hour"
- ALWAYS mention warranty: "All repairs come with 12-month warranty"
- Keep it brief and helpful`,

    follow_up: `
🎯 STATE: Follow-up / Status Check
- Customer asking about existing repair status
- CRITICAL: You CANNOT check repair status - you don't have access
- DO NOT say "I'll check on your repair" or "Let me check" - you can't
- INSTEAD: "I don't have access to repair statuses, but if you give me your name and device details, I'll pass this to John who'll get back to you ASAP - normally within an hour unless he's really busy"
- Be honest about your limitations but reassuring
- Set realistic expectations: "normally within an hour unless he's really busy"`,

    general_inquiry: `
🎯 STATE: General Inquiry
- Not a repair request
- Answer their question directly
- Keep it concise`,

    handoff_required: `
🎯 STATE: Handoff Required
- This needs John's attention
- Explain why
- Set expectations for response time`
  };

  return stateGuidance[state];
}

/**
 * Validate if AI response matches expected state
 */
export function validateResponseForState(
  response: string,
  context: ConversationContext
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for state-specific violations
  switch (context.state) {
    case 'new_inquiry':
      // Don't assume old context - should ask what they need
      if (response.toLowerCase().includes('check on your repair') || 
          response.toLowerCase().includes('existing repair')) {
        issues.push('Assumed customer wants status check without asking');
      }
      break;

    case 'gathering_device_info':
      if (response.toLowerCase().includes('what make and model')) {
        issues.push('Asked for device info again (already asked)');
      }
      break;

    case 'presenting_options':
      if (response.includes('£') && response.includes('OLED')) {
        issues.push('Repeated pricing options (already presented)');
      }
      break;

    case 'confirming_choice':
      if (!response.toLowerCase().includes('confirm')) {
        issues.push('Did not explicitly confirm customer choice');
      }
      break;

    case 'ready_to_visit':
      if (response.split('\n').length > 10) {
        issues.push('Response too long for ready_to_visit state');
      }
      break;
      
    case 'follow_up':
      // Steve cannot check repair status
      if (response.toLowerCase().includes("i'll check") || 
          response.toLowerCase().includes("let me check")) {
        issues.push('Promised to check status but Steve has no access - should handoff to John');
      }
      break;
  }

  // Check for common mistakes
  if (context.deviceModel && response.toLowerCase().includes('what model')) {
    issues.push(`Already know device model: ${context.deviceModel}`);
  }

  if (context.customerName && response.toLowerCase().includes('what\'s your name')) {
    issues.push(`Already know customer name: ${context.customerName}`);
  }

  // CRITICAL: Check if Steve is giving pricing without knowing the model
  if (!context.deviceModel && context.deviceType) {
    // Has device type (iPhone, iPad) but not specific model
    if (response.includes('£') || response.toLowerCase().includes('price') || 
        response.toLowerCase().includes('cost')) {
      issues.push(`Attempted to quote price without knowing specific model - only know device type: ${context.deviceType}`);
    }
    
    // Check if Steve is asking about the issue before getting model
    if (response.toLowerCase().includes('what\'s wrong') || 
        response.toLowerCase().includes('what can i help') ||
        response.toLowerCase().includes('pop in')) {
      issues.push(`Skipped asking for device model - only know device type: ${context.deviceType}, need specific model (e.g., iPhone 12)`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
