/**
 * Alert notification system - sends SMS via MacroDroid webhook when manual intervention needed
 */

export async function sendAlertNotification(params: {
  conversationId: string
  alertType: string
  customerPhone?: string
  customerName?: string
  lastMessage?: string
}) {
  const { conversationId, alertType, customerPhone, customerName, lastMessage } = params
  
  // Get MacroDroid alert webhook URL from environment
  const macrodroidWebhook = process.env.MACRODROID_ALERT_WEBHOOK_URL || process.env.MACRODROID_WEBHOOK_URL
  
  if (!macrodroidWebhook) {
    console.log('[Alert] MacroDroid alert webhook not configured - skipping notification')
    return { success: false, error: 'Webhook not configured' }
  }
  
  // Build alert message based on type
  let alertMessage = ''
  
  switch (alertType) {
    case 'manual_required':
      alertMessage = `🚨 Manual Response Needed\n\n`
      alertMessage += `Customer: ${customerName || 'Unknown'}\n`
      alertMessage += `Phone: ${customerPhone || 'N/A'}\n`
      if (lastMessage) {
        alertMessage += `Message: "${lastMessage.substring(0, 100)}${lastMessage.length > 100 ? '...' : ''}"\n`
      }
      alertMessage += `\nView: https://nfd-rai.vercel.app/dashboard/conversations?id=${conversationId}`
      break
      
    case 'low_confidence':
      alertMessage = `⚠️ Low Confidence Response\n\n`
      alertMessage += `Customer: ${customerName || 'Unknown'}\n`
      alertMessage += `Phone: ${customerPhone || 'N/A'}\n`
      if (lastMessage) {
        alertMessage += `Message: "${lastMessage.substring(0, 100)}${lastMessage.length > 100 ? '...' : ''}"\n`
      }
      alertMessage += `\nAI responded but confidence was low. Check conversation.`
      break
      
    case 'high_priority':
      alertMessage = `🔴 High Priority Alert\n\n`
      alertMessage += `Customer: ${customerName || 'Unknown'}\n`
      alertMessage += `Phone: ${customerPhone || 'N/A'}\n`
      if (lastMessage) {
        alertMessage += `Message: "${lastMessage.substring(0, 100)}${lastMessage.length > 100 ? '...' : ''}"\n`
      }
      alertMessage += `\nImmediate attention required!`
      break
      
    default:
      alertMessage = `📢 Alert: ${alertType}\n\n`
      alertMessage += `Customer: ${customerName || 'Unknown'}\n`
      alertMessage += `Phone: ${customerPhone || 'N/A'}`
  }
  
  try {
    console.log('[Alert] Sending notification via MacroDroid')
    console.log('[Alert] Type:', alertType)
    console.log('[Alert] Customer:', customerName, customerPhone)
    
    // Send to MacroDroid webhook
    // MacroDroid will receive this and send SMS to your phone
    const response = await fetch(macrodroidWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: alertMessage,
        conversationId: conversationId,
        alertType: alertType,
      }).toString(),
    })
    
    if (!response.ok) {
      console.error('[Alert] MacroDroid webhook failed:', response.status)
      return { success: false, error: `HTTP ${response.status}` }
    }
    
    console.log('[Alert] ✅ Notification sent successfully')
    return { success: true }
    
  } catch (error: any) {
    console.error('[Alert] Failed to send notification:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Check if we should send notification (rate limiting to avoid spam)
 */
export function shouldSendNotification(
  conversationId: string,
  alertType: string,
  lastNotificationTime?: Date
): boolean {
  // Don't spam - only send notification if:
  // 1. No previous notification, OR
  // 2. Last notification was more than 15 minutes ago
  
  if (!lastNotificationTime) {
    return true
  }
  
  const minutesSinceLastNotification = 
    (Date.now() - new Date(lastNotificationTime).getTime()) / 1000 / 60
  
  // For high priority, allow more frequent notifications (5 min)
  if (alertType === 'high_priority' && minutesSinceLastNotification >= 5) {
    return true
  }
  
  // For normal alerts, wait 15 minutes
  if (minutesSinceLastNotification >= 15) {
    return true
  }
  
  console.log('[Alert] Skipping notification - too soon since last alert')
  return false
}
