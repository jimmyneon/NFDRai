/**
 * Message batching utility to handle rapid incoming messages
 * Prevents AI from responding individually to each message when customer sends multiple quick messages
 */

interface PendingBatch {
  customerId: string
  conversationId: string
  messages: string[]
  timer: NodeJS.Timeout
  resolve: (value: { shouldBatch: boolean; allMessages: string[] }) => void
}

const pendingBatches = new Map<string, PendingBatch>()

const BATCH_WINDOW_MS = 5000 // Wait 5 seconds for more messages (increased to catch rapid typing)
const MIN_MESSAGES_FOR_BATCH = 2 // Minimum messages to trigger batching

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
  
  // Check if there's already a pending batch for this customer
  const existingBatch = pendingBatches.get(batchKey)
  
  if (existingBatch) {
    // Add this message to the existing batch
    existingBatch.messages.push(message)
    
    // Return a promise that will be resolved when the timer expires
    return new Promise((resolve) => {
      // Update the resolve function to the latest one
      existingBatch.resolve = resolve
    })
  }
  
  // Start a new batch
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const batch = pendingBatches.get(batchKey)
      if (batch) {
        const shouldBatch = batch.messages.length >= MIN_MESSAGES_FOR_BATCH
        
        // Resolve the promise with batch info
        batch.resolve({
          shouldBatch,
          allMessages: batch.messages,
        })
        
        // Clean up
        pendingBatches.delete(batchKey)
      }
    }, BATCH_WINDOW_MS)
    
    pendingBatches.set(batchKey, {
      customerId,
      conversationId,
      messages: [message],
      timer,
      resolve,
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
    batch.resolve({ shouldBatch: false, allMessages: batch.messages })
    pendingBatches.delete(batchKey)
  }
}
