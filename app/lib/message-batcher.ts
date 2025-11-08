/**
 * Message batching utility to handle rapid incoming messages
 * Prevents AI from responding individually to each message when customer sends multiple quick messages
 * Uses adaptive timing based on message patterns
 */

interface PendingBatch {
  customerId: string
  conversationId: string
  messages: string[]
  timestamps: number[]
  timer: NodeJS.Timeout
  resolvers: Array<(value: { shouldBatch: boolean; allMessages: string[] }) => void>
}

const pendingBatches = new Map<string, PendingBatch>()

const BATCH_WINDOW_MS = 3000 // Default: Wait 3 seconds for more messages (reduced from 5s)
const BATCH_WINDOW_CORRECTION_MS = 2000 // Shorter wait for obvious corrections/typos (reduced from 2.5s)
const MIN_MESSAGES_FOR_BATCH = 2 // Minimum messages to trigger batching

/**
 * Detect if second message is likely a correction/clarification of first
 */
function isLikelyCorrection(firstMsg: string, secondMsg: string): boolean {
  const first = firstMsg.toLowerCase().trim()
  const second = secondMsg.toLowerCase().trim()
  
  // Very short messages (1-2 words) sent quickly are likely corrections
  if (second.split(/\s+/).length <= 2 && second.length < 15) {
    return true
  }
  
  // Common correction patterns
  const correctionPatterns = [
    /^(i mean|actually|sorry|oops|my bad)/i,
    /^\*/, // Asterisk corrections like "*phone"
  ]
  
  if (correctionPatterns.some(pattern => pattern.test(second))) {
    return true
  }
  
  // Single word that looks like device/model (likely clarification)
  const deviceWords = ['iphone', 'samsung', 'ipad', 'macbook', 'laptop', 'phone', 'tablet', 'apple', 'appl']
  if (deviceWords.some(word => second.includes(word)) && second.split(/\s+/).length <= 3) {
    return true
  }
  
  // Incomplete words that are clearly corrections (typos mid-typing)
  const incompleteWords = /^(with an? |its? |the |my )/i
  if (incompleteWords.test(second) && second.length < 20) {
    return true
  }
  
  // Typo correction: very similar strings
  if (first.length > 3 && second.length > 3) {
    const similarity = calculateSimilarity(first, second)
    if (similarity > 0.6) { // 60% similar = likely typo correction
      return true
    }
  }
  
  return false
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Check if we should batch this message with others from the same customer
 * Returns a promise that resolves after the batch window or immediately if no batching needed
 */
export async function checkMessageBatch(
  customerId: string,
  conversationId: string,
  message: string
): Promise<{ shouldBatch: boolean; allMessages: string[] }> {
  const batchKey = `${customerId}:${conversationId}`
  
  const now = Date.now()
  
  // Check if there's already a pending batch for this customer
  const existingBatch = pendingBatches.get(batchKey)
  
  if (existingBatch) {
    // Add this message to the existing batch
    existingBatch.messages.push(message)
    existingBatch.timestamps.push(now)
    
    // Check if this looks like a correction - if so, use shorter wait time
    const lastMessage = existingBatch.messages[existingBatch.messages.length - 2]
    if (lastMessage && isLikelyCorrection(lastMessage, message)) {
      console.log('[Batching] Detected correction/clarification - using shorter wait time')
      
      // Clear existing timer and set shorter one
      clearTimeout(existingBatch.timer)
      existingBatch.timer = setTimeout(() => {
        const batch = pendingBatches.get(batchKey)
        if (batch) {
          const shouldBatch = batch.messages.length >= MIN_MESSAGES_FOR_BATCH
          const result = {
            shouldBatch,
            allMessages: batch.messages,
          }
          // Resolve all pending promises
          batch.resolvers.forEach(resolve => resolve(result))
          pendingBatches.delete(batchKey)
        }
      }, BATCH_WINDOW_CORRECTION_MS)
    }
    
    // Return a promise that will be resolved when the timer expires
    return new Promise((resolve) => {
      // Add this resolve to the array of resolvers
      existingBatch.resolvers.push(resolve)
    })
  }
  
  // Start a new batch
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const batch = pendingBatches.get(batchKey)
      if (batch) {
        const shouldBatch = batch.messages.length >= MIN_MESSAGES_FOR_BATCH
        
        console.log(`[Batching] Batch window expired - ${batch.messages.length} messages collected`)
        
        // Resolve all promises with batch info
        const result = {
          shouldBatch,
          allMessages: batch.messages,
        }
        batch.resolvers.forEach(resolve => resolve(result))
        
        // Clean up
        pendingBatches.delete(batchKey)
      }
    }, BATCH_WINDOW_MS)
    
    pendingBatches.set(batchKey, {
      customerId,
      conversationId,
      messages: [message],
      timestamps: [now],
      timer,
      resolvers: [resolve],
    })
  })
}

/**
 * Cancel a pending batch (e.g., if conversation switches to manual mode)
 */
export function cancelBatch(customerId: string, conversationId: string): void {
  const batchKey = `${customerId}:${conversationId}`
  const batch = pendingBatches.get(batchKey)
  
  if (batch) {
    clearTimeout(batch.timer)
    const result = { shouldBatch: false, allMessages: batch.messages }
    batch.resolvers.forEach(resolve => resolve(result))
    pendingBatches.delete(batchKey)
  }
}
