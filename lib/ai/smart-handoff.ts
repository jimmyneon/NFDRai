/**
 * Smart Handoff System
 * Determines pricing confidence and handoff strategy
 */

import { createClient } from '@/lib/supabase/server'

export interface PricingConfidence {
  tier: 'confident' | 'soft_confirmation' | 'handoff'
  price?: number
  priceRangeMin?: number
  priceRangeMax?: number
  message: string
  shouldHandoff: boolean
  requiresAssessment: boolean
}

export interface CustomerHistory {
  name?: string
  customerType: 'new' | 'returning' | 'regular' | 'vip'
  totalConversations: number
  totalRepairs: number
  devicesOwned: string[]
  isReturning: boolean
}

export interface UpsellRecommendation {
  shouldUpsell: boolean
  upsellType?: 'battery' | 'screen_protector' | 'case'
  reason?: string
}

/**
 * Get pricing confidence and appropriate response strategy
 */
export async function getPricingConfidence(params: {
  device: string
  repairType: string
  additionalIssues?: string[]
}): Promise<PricingConfidence> {
  const supabase = await createClient()
  const { device, repairType, additionalIssues = [] } = params

  // Check for complexity triggers that require handoff
  const complexityTriggers = [
    'water damage',
    'liquid damage',
    'dropped in water',
    'won\'t turn on',
    'multiple issues',
    'custom',
    'bulk order',
    'business'
  ]

  const hasComplexity = additionalIssues.some(issue =>
    complexityTriggers.some(trigger => issue.toLowerCase().includes(trigger))
  )

  if (hasComplexity) {
    return {
      tier: 'handoff',
      shouldHandoff: true,
      requiresAssessment: true,
      message: "That's a bit more complex - let me get John to assess it properly and give you an accurate quote. He'll message you back ASAP"
    }
  }

  // Get price with confidence level from database
  const { data: priceData } = await supabase
    .rpc('get_price_with_confidence', {
      p_device: device,
      p_repair_type: repairType
    })
    .single()

  if (!priceData) {
    // No price in database - handoff required
    return {
      tier: 'handoff',
      shouldHandoff: true,
      requiresAssessment: true,
      message: "I don't have pricing for that specific repair. Let me get John to give you a proper quote - he'll message you back ASAP"
    }
  }

  const price = priceData as any

  // Determine tier based on confidence level
  switch (price.confidence_level) {
    case 'standard':
      return {
        tier: 'confident',
        price: price.cost,
        shouldHandoff: false,
        requiresAssessment: false,
        message: `Our standard price for ${device} ${repairType} is £${price.cost}${price.turnaround ? ` - ${price.turnaround}` : ''}. Pop in anytime!`
      }

    case 'estimated':
      return {
        tier: 'soft_confirmation',
        price: price.cost,
        priceRangeMin: price.price_range_min || price.cost * 0.9,
        priceRangeMax: price.price_range_max || price.cost * 1.3,
        shouldHandoff: false,
        requiresAssessment: true,
        message: `${device} ${repairType} typically ranges from £${Math.round(price.price_range_min || price.cost * 0.9)} to £${Math.round(price.price_range_max || price.cost * 1.3)} depending on the exact model and condition. Pop in and John will confirm the exact price when he sees it`
      }

    case 'quote_required':
    default:
      return {
        tier: 'handoff',
        shouldHandoff: true,
        requiresAssessment: true,
        message: "That needs a proper assessment. Let me get John to take a look and give you an accurate quote - he'll message you back ASAP"
      }
  }
}

/**
 * Get customer history for personalized responses
 */
export async function getCustomerHistory(phone: string): Promise<CustomerHistory> {
  const supabase = await createClient()

  const { data } = await supabase
    .rpc('get_customer_history', { p_phone: phone })
    .single()

  if (!data) {
    return {
      customerType: 'new',
      totalConversations: 0,
      totalRepairs: 0,
      devicesOwned: [],
      isReturning: false
    }
  }

  const history = data as any

  return {
    name: history.name,
    customerType: history.customer_type,
    totalConversations: history.total_conversations,
    totalRepairs: history.total_repairs,
    devicesOwned: history.devices_owned || [],
    isReturning: history.total_conversations > 1
  }
}

/**
 * Update customer history after interaction
 */
export async function updateCustomerHistory(params: {
  phone: string
  name?: string
  device?: string
}): Promise<void> {
  const supabase = await createClient()

  await supabase.rpc('update_customer_history', {
    p_phone: params.phone,
    p_name: params.name || null,
    p_device: params.device || null
  })
}

/**
 * Determine if battery upsell is appropriate
 */
export async function getUpsellRecommendation(params: {
  device: string
  repairType: string
  customerMentionedBattery?: boolean
}): Promise<UpsellRecommendation> {
  const supabase = await createClient()
  const { device, repairType, customerMentionedBattery } = params

  // Don't upsell if not a screen repair
  if (!repairType.toLowerCase().includes('screen')) {
    return { shouldUpsell: false }
  }

  // Don't upsell if customer already mentioned battery
  if (customerMentionedBattery) {
    return { shouldUpsell: false }
  }

  // Check if device age suggests battery replacement
  const { data: shouldUpsell } = await supabase
    .rpc('should_upsell_battery', { p_device_model: device })
    .single()

  if (shouldUpsell) {
    return {
      shouldUpsell: true,
      upsellType: 'battery',
      reason: 'device_age'
    }
  }

  return { shouldUpsell: false }
}

/**
 * Build personalized greeting for returning customers
 */
export function buildPersonalizedGreeting(history: CustomerHistory): string | null {
  if (!history.isReturning) {
    return null
  }

  if (history.name) {
    if (history.customerType === 'regular' || history.customerType === 'vip') {
      return `Hi ${history.name}! Good to hear from you again. What can I help with today?`
    } else {
      return `Hi ${history.name}! What can I help you with today?`
    }
  }

  if (history.customerType === 'returning') {
    return `Hi! Good to hear from you again. What can I help with today?`
  }

  return null
}

/**
 * Build smart upsell message
 */
export function buildUpsellMessage(recommendation: UpsellRecommendation, device: string): string | null {
  if (!recommendation.shouldUpsell) {
    return null
  }

  if (recommendation.upsellType === 'battery' && recommendation.reason === 'device_age') {
    return `By the way, since your ${device} is a few years old, we do £20 off battery replacements when done with a screen - so it'd be £30 instead of £50. Just a heads-up!`
  }

  return null
}
