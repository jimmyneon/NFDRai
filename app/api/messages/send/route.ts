import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendMessageViaProvider } from '@/app/lib/messaging/provider'
import { extractConfirmationData } from '@/app/lib/confirmation-extractor'

/**
 * POST /api/messages/send
 * Send an outbound message (manual response from staff)
 * 
 * Expected payload:
 * {
 *   "conversationId": "uuid",
 *   "text": "Message text",
 *   "sendVia": "sms" | "whatsapp" | "messenger" (optional - defaults to conversation channel)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Note: Authentication check removed for MacroDroid compatibility
    // This endpoint is used for tracking sent SMS from MacroDroid
    // which cannot authenticate

    // Check content type and parse accordingly
    const contentType = request.headers.get('content-type') || ''
    let conversationId, text, sendVia, customerPhone, sender, trackOnly
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Parse form data
      const formData = await request.formData()
      // Handle both camelCase and lowercase parameter names from MacroDroid
      conversationId = (formData.get('conversationId') || formData.get('conversationid')) as string
      text = formData.get('text') as string
      sendVia = formData.get('sendVia') as string
      customerPhone = (formData.get('customerPhone') || formData.get('customerphone')) as string
      sender = formData.get('sender') as string
      trackOnly = formData.get('trackOnly') === 'true'
      
      // Trim whitespace from phone number
      if (customerPhone) {
        customerPhone = customerPhone.trim()
      }
      
      // Normalize conversation ID variants
      if (conversationId === 'look-up-byphone' || conversationId === 'lookupbyphone') {
        conversationId = 'lookup-by-phone'
      }
      
      console.log('[Send Message] Parsed form data:', { conversationId, customerPhone, text: text?.substring(0, 30) })
    } else {
      // Try to parse as JSON
      try {
        const rawBody = await request.text()
        console.log('[Send Message] Raw body (first 100):', rawBody.substring(0, 100))
        
        const body = JSON.parse(rawBody)
        conversationId = body.conversationId
        text = body.text
        sendVia = body.sendVia
        customerPhone = body.customerPhone
        sender = body.sender
        trackOnly = body.trackOnly
      } catch (parseError: any) {
        console.error('[Send Message] JSON parse error:', parseError.message)
        return NextResponse.json(
          { 
            error: 'Invalid JSON. Use form-encoded data instead',
            hint: 'Change Content-Type to application/x-www-form-urlencoded in MacroDroid',
            success: false
          },
          { status: 400 }
        )
      }
    }

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      )
    }

    // If trackOnly is true, this is from MacroDroid tracking an already-sent message
    // We should only log it, not send it again
    const isTrackingOnly = trackOnly === true || sender === 'staff'

    // Check if this exact message was recently sent by AI or system (within last 30 seconds)
    // to avoid duplicate tracking from MacroDroid
    if (isTrackingOnly && text) {
      try {
        const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
        
        // Check for exact match in recent messages
        const { data: recentMessages, error: checkError } = await supabase
          .from('messages')
          .select('id, text, sender, created_at')
          .eq('text', text)
          .in('sender', ['ai', 'system'])
          .gte('created_at', thirtySecondsAgo)
          .limit(1)

        if (checkError) {
          console.error('[Track SMS] Error checking duplicates:', checkError)
          // Continue anyway - better to track than to fail
        } else if (recentMessages && recentMessages.length > 0) {
          // This message was just sent by AI/system, don't track it again
          console.log(`[Track SMS] Skipping duplicate - ${recentMessages[0].sender} already sent this message`)
          return NextResponse.json({
            success: true,
            message: 'Skipped - already tracked',
            duplicate: true,
            originalSender: recentMessages[0].sender
          })
        }
      } catch (err) {
        console.error('[Track SMS] Exception checking duplicates:', err)
        // Continue anyway
      }
    }

    // Handle lookup by phone (for MacroDroid sent SMS tracking)
    let actualConversationId = conversationId
    
    if (conversationId === 'lookup-by-phone' && customerPhone) {
      console.log('[Send Message] Looking up conversation for phone:', customerPhone)
      
      // Try multiple phone number formats to handle different formats from MacroDroid
      // Generate all common UK phone formats
      const phoneVariants = []
      const cleanPhone = customerPhone.replace(/\s+/g, '') // Remove all spaces
      
      phoneVariants.push(cleanPhone) // Original
      
      // If starts with +44, add variants
      if (cleanPhone.startsWith('+44')) {
        phoneVariants.push(cleanPhone.substring(1))        // Remove +: 447410381247
        phoneVariants.push('0' + cleanPhone.substring(3))  // UK format: 07410381247
      }
      // If starts with 44 (no +), add variants
      else if (cleanPhone.startsWith('44') && !cleanPhone.startsWith('0')) {
        phoneVariants.push('+' + cleanPhone)               // Add +: +447410381247
        phoneVariants.push('0' + cleanPhone.substring(2))  // UK format: 07410381247
      }
      // If starts with 0, add variants
      else if (cleanPhone.startsWith('0')) {
        phoneVariants.push('+44' + cleanPhone.substring(1)) // International: +447410381247
        phoneVariants.push('44' + cleanPhone.substring(1))  // No +: 447410381247
      }
      
      // Remove duplicates
      const uniqueVariants = [...new Set(phoneVariants)]
      
      console.log('[Send Message] Trying phone variants:', phoneVariants)
      
      let customer = null
      let foundPhone = null
      
      // Try each phone variant
      for (const phoneVariant of phoneVariants) {
        const { data: foundCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', phoneVariant)
          .maybeSingle()
        
        if (foundCustomer) {
          customer = foundCustomer
          foundPhone = phoneVariant
          console.log('[Send Message] Found customer with phone variant:', phoneVariant, 'Customer ID:', customer.id)
          break
        }
      }

      if (!customer) {
        console.log('[Send Message] Customer not found with any phone variant')
      }

      if (customer) {
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .eq('customer_id', customer.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (convError) {
          console.log('[Send Message] Conversation not found for customer:', customer.id, convError.message)
        }

        if (conversation) {
          actualConversationId = conversation.id
          console.log('[Send Message] Found conversation:', actualConversationId, 'for phone:', foundPhone)
        }
      }
    }

    if (!actualConversationId || actualConversationId === 'lookup-by-phone') {
      console.log('[Send Message] No conversation found - this may be a manual SMS not initiated by the system')
      return NextResponse.json(
        { 
          success: false,
          error: 'Conversation not found',
          hint: 'This phone number has no active conversation. SMS may have been sent manually outside the system.'
        },
        { status: 404 }
      )
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', actualConversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Extract customer data from confirmation messages
    const confirmationData = extractConfirmationData(text)
    
    if (confirmationData.isConfirmationMessage) {
      console.log('[Confirmation] Detected confirmation message')
      console.log('[Confirmation] Extracted data:', confirmationData)
      
      // Update customer record with extracted information
      if (confirmationData.customerName || confirmationData.device) {
        const updateData: any = {}
        
        if (confirmationData.customerName) {
          updateData.name = confirmationData.customerName
        }
        
        // Store device in notes if we have it
        if (confirmationData.device) {
          const existingNotes = conversation.customer?.notes || ''
          const deviceNote = `Device: ${confirmationData.device} (ready for collection)`
          
          // Only add if not already in notes
          if (!existingNotes.includes(confirmationData.device)) {
            updateData.notes = existingNotes 
              ? `${existingNotes}\n${deviceNote}` 
              : deviceNote
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', conversation.customer_id)
          
          if (updateError) {
            console.error('[Confirmation] Failed to update customer:', updateError)
          } else {
            console.log('[Confirmation] Updated customer with:', updateData)
          }
        }
      }
    }

    // Insert message into database
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: actualConversationId,
        sender: sender || 'staff',
        text,
      })
      .select()
      .single()

    if (messageError) {
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Only send the message if this is NOT just tracking
    let deliveryStatus = { sent: false, provider: 'none' }
    
    if (!isTrackingOnly) {
      const channel = sendVia || conversation.channel
      const customerPhoneNumber = conversation.customer?.phone

      // Send via MacroDroid webhook (if configured) or external provider
      deliveryStatus = await sendMessageViaProvider({
        channel,
        to: customerPhoneNumber,
        text,
      })
    }

    // Update message with delivery status
    if (deliveryStatus.sent) {
      await supabase
        .from('messages')
        .update({ 
          delivered: true,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', message.id)
    }

    // Update conversation status to manual (staff has taken over)
    await supabase
      .from('conversations')
      .update({ 
        status: 'manual',
        updated_at: new Date().toISOString(),
      })
      .eq('id', actualConversationId)

    return NextResponse.json({
      success: true,
      message,
      deliveryStatus,
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
