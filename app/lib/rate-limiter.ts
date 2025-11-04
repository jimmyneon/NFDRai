/**
 * Simple in-memory rate limiter to prevent spam
 * Tracks recent requests by phone number and endpoint
 */

interface RateLimitEntry {
  timestamp: number
  count: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.timestamp < fiveMinutesAgo) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export function checkRateLimit(
  identifier: string, // e.g., phone number
  endpoint: string, // e.g., 'missed-call'
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 1 } // Default: 1 per minute
): { allowed: boolean; retryAfter?: number } {
  const key = `${endpoint}:${identifier}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // No previous request or window expired
  if (!entry || now - entry.timestamp > config.windowMs) {
    rateLimitStore.set(key, { timestamp: now, count: 1 })
    return { allowed: true }
  }

  // Within window - check count
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.timestamp + config.windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // Increment count
  entry.count++
  return { allowed: true }
}

export function resetRateLimit(identifier: string, endpoint: string) {
  const key = `${endpoint}:${identifier}`
  rateLimitStore.delete(key)
}
