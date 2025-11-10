/**
 * Extract structured information from staff messages
 * Captures device details, repair status, pricing, and customer information
 */

import { extractCustomerNameSmart } from './ai-name-extractor'

export interface ExtractedInfo {
  customerName?: string
  deviceType?: string
  deviceModel?: string
  deviceIssue?: string
  repairStatus?: 'ready' | 'in_progress' | 'not_fixed' | 'quoted' | 'awaiting_parts' | 'awaiting_customer'
  repairNotes?: string
  priceQuoted?: number
  priceFinal?: number
  messageType?: 'ready_notification' | 'quote' | 'update' | 'not_fixed' | 'other'
  extractionConfidence: number
  rawData: Record<string, any>
}

/**
 * Extract customer name from staff message (using AI + regex fallback)
 */
async function extractCustomerName(message: string, apiKey?: string): Promise<string | undefined> {
  const result = await extractCustomerNameSmart(message, apiKey)
  return result.name || undefined
}

/**
 * Extract device information
 */
function extractDeviceInfo(message: string): {
  deviceType?: string
  deviceModel?: string
  deviceIssue?: string
} {
  const lowerMessage = message.toLowerCase()
  let deviceType: string | undefined
  let deviceModel: string | undefined
  let deviceIssue: string | undefined
  
  // Device types
  if (/iphone/i.test(message)) {
    deviceType = 'iPhone'
    // Extract model
    const modelMatch = message.match(/iphone\s*(1[0-5]|[6-9]|x[rs]?|se|pro\s*max|plus|mini)/i)
    if (modelMatch) {
      deviceModel = `iPhone ${modelMatch[1]}`
    }
  } else if (/ipad/i.test(message)) {
    deviceType = 'iPad'
    const modelMatch = message.match(/ipad\s*(pro|air|mini|\d)/i)
    if (modelMatch) {
      deviceModel = `iPad ${modelMatch[1]}`
    }
  } else if (/macbook/i.test(message)) {
    deviceType = 'MacBook'
    const modelMatch = message.match(/macbook\s*(pro|air)?/i)
    if (modelMatch && modelMatch[1]) {
      deviceModel = `MacBook ${modelMatch[1]}`
    }
  } else if (/samsung|galaxy/i.test(message)) {
    deviceType = 'Samsung'
    const modelMatch = message.match(/galaxy\s*([san]\d+|s\d+\s*(?:ultra|plus|fe)?|note\s*\d+|fold\s*\d*|flip\s*\d*)/i)
    if (modelMatch) {
      deviceModel = `Galaxy ${modelMatch[1]}`
    }
  } else if (/laptop/i.test(message)) {
    deviceType = 'Laptop'
  } else if (/phone/i.test(message)) {
    deviceType = 'Phone'
  }
  
  // Device issues
  if (/screen/i.test(lowerMessage)) {
    if (/crack|smash|shatter|broken screen/i.test(lowerMessage)) {
      deviceIssue = 'cracked screen'
    } else if (/screen replacement/i.test(lowerMessage)) {
      deviceIssue = 'screen replacement'
    } else {
      deviceIssue = 'screen repair'
    }
  } else if (/battery/i.test(lowerMessage)) {
    deviceIssue = 'battery replacement'
  } else if (/charging|charge port/i.test(lowerMessage)) {
    deviceIssue = 'charging port'
  } else if (/water damage/i.test(lowerMessage)) {
    deviceIssue = 'water damage'
  } else if (/back glass/i.test(lowerMessage)) {
    deviceIssue = 'back glass'
  }
  
  return { deviceType, deviceModel, deviceIssue }
}

/**
 * Extract pricing information
 */
function extractPricing(message: string): {
  priceQuoted?: number
  priceFinal?: number
} {
  const pricePatterns = [
    /£(\d+(?:\.\d{2})?)/g,
    /(\d+(?:\.\d{2})?)\s*(?:pounds?|quid)/gi,
  ]
  
  const prices: number[] = []
  
  for (const pattern of pricePatterns) {
    let match
    while ((match = pattern.exec(message)) !== null) {
      const price = parseFloat(match[1])
      if (price > 0 && price < 10000) { // Sanity check
        prices.push(price)
      }
    }
  }
  
  if (prices.length === 0) return {}
  
  // If multiple prices, assume first is quote, last is final
  if (prices.length === 1) {
    return { priceQuoted: prices[0] }
  } else {
    return { priceQuoted: prices[0], priceFinal: prices[prices.length - 1] }
  }
}

/**
 * Determine repair status from message
 */
function extractRepairStatus(message: string): {
  repairStatus?: ExtractedInfo['repairStatus']
  messageType?: ExtractedInfo['messageType']
} {
  const lowerMessage = message.toLowerCase()
  
  // Ready for pickup
  if (/(?:is\s+)?(?:all\s+)?(?:ready|done|finished|complete|fixed)/i.test(lowerMessage) &&
      /(?:pick\s*up|collect|ready)/i.test(lowerMessage)) {
    return {
      repairStatus: 'ready',
      messageType: 'ready_notification'
    }
  }
  
  // Could not fix
  if (/(?:could\s*n[o']t|can\s*n[o']t|unable\s+to)\s+(?:fix|repair)/i.test(lowerMessage) ||
      /(?:not\s+fixable|beyond\s+repair)/i.test(lowerMessage)) {
    return {
      repairStatus: 'not_fixed',
      messageType: 'not_fixed'
    }
  }
  
  // Quote/pricing
  if (/(?:quote|cost|price|charge|be)\s+(?:is|would\s+be|will\s+be)?.*£/i.test(message) ||
      /£.*(?:for|to\s+(?:fix|repair))/i.test(message)) {
    return {
      repairStatus: 'quoted',
      messageType: 'quote'
    }
  }
  
  // Awaiting parts
  if (/(?:waiting|awaiting|ordered)\s+(?:for\s+)?(?:the\s+)?part/i.test(lowerMessage) ||
      /part.*(?:on\s+order|coming|arrive)/i.test(lowerMessage) ||
      /(?:on\s+order|ordered|coming)/i.test(lowerMessage) && /part/i.test(lowerMessage)) {
    return {
      repairStatus: 'awaiting_parts',
      messageType: 'update'
    }
  }
  
  // In progress
  if (/(?:working\s+on|repairing|fixing)/i.test(lowerMessage)) {
    return {
      repairStatus: 'in_progress',
      messageType: 'update'
    }
  }
  
  // Awaiting customer decision
  if (/(?:let\s+me\s+know|confirm|approve|decision)/i.test(lowerMessage)) {
    return {
      repairStatus: 'awaiting_customer',
      messageType: 'update'
    }
  }
  
  return { messageType: 'other' }
}

/**
 * Main extraction function (now async to support AI name extraction)
 */
export async function extractStaffMessageInfo(message: string, apiKey?: string): Promise<ExtractedInfo> {
  const customerName = await extractCustomerName(message, apiKey)
  const deviceInfo = extractDeviceInfo(message)
  const pricing = extractPricing(message)
  const statusInfo = extractRepairStatus(message)
  
  // Calculate confidence based on how much we extracted
  let confidence = 0
  let fieldsExtracted = 0
  let totalFields = 0
  
  // Count extracted fields
  if (customerName) { fieldsExtracted++; }
  totalFields++
  
  if (deviceInfo.deviceType) { fieldsExtracted++; }
  totalFields++
  
  if (deviceInfo.deviceModel) { fieldsExtracted++; }
  totalFields++
  
  if (deviceInfo.deviceIssue) { fieldsExtracted++; }
  totalFields++
  
  if (pricing.priceQuoted || pricing.priceFinal) { fieldsExtracted++; }
  totalFields++
  
  if (statusInfo.repairStatus) { fieldsExtracted++; }
  totalFields++
  
  confidence = fieldsExtracted / totalFields
  
  // Boost confidence if we got key fields
  if (statusInfo.repairStatus && (deviceInfo.deviceType || customerName)) {
    confidence = Math.min(1.0, confidence + 0.2)
  }
  
  return {
    customerName,
    ...deviceInfo,
    ...pricing,
    ...statusInfo,
    extractionConfidence: Math.round(confidence * 100) / 100,
    rawData: {
      customerName,
      deviceInfo,
      pricing,
      statusInfo,
      messageLength: message.length,
    }
  }
}

/**
 * Check if message is worth extracting (has enough information)
 */
export function shouldExtractFromMessage(message: string): boolean {
  // Too short to have useful info
  if (message.length < 20) return false
  
  // Check if it contains any key indicators
  const indicators = [
    /£\d+/,                           // Price
    /ready|done|finished/i,           // Status
    /iphone|ipad|samsung|macbook/i,   // Device
    /screen|battery|repair/i,         // Issue
  ]
  
  return indicators.some(pattern => pattern.test(message))
}
