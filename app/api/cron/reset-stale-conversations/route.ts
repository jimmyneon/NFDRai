import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Cron job to reset conversations stuck in manual mode
 * Runs every 5 minutes via Vercel Cron
 * 
 * Resets conversations to auto mode if:
 * 1. In manual mode for 30+ minutes with no staff reply
 * 2. In manual mode and staff replied 30+ minutes ago
 */
export async function GET(request: Request) {
  // Verify this is a cron request (Vercel sets this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const startTime = Date.now()

  try {
    console.log('[Cron] Starting stale conversation reset...')

    // Get all manual conversations
    const { data: manualConversations, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        id,
        status,
        updated_at,
        customer:customers(phone, name),
        messages(id, sender, created_at)
      `)
      .eq('status', 'manual')

    if (fetchError) {
      console.error('[Cron] Error fetching conversations:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log(`[Cron] Found ${manualConversations.length} manual conversations`)

    let resetCount = 0
    const conversationsToReset: string[] = []

    for (const convo of manualConversations) {
      // Find last staff message
      const staffMessages = convo.messages
        .filter((m: any) => m.sender === 'staff')
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const lastStaffMessage = staffMessages[0]

      const customerPhone = Array.isArray(convo.customer) ? convo.customer[0]?.phone : convo.customer?.phone
      
      if (!lastStaffMessage) {
        // No staff message ever - reset to auto
        conversationsToReset.push(convo.id)
        console.log(`[Cron] Reset ${customerPhone || 'unknown'} - no staff reply`)
      } else {
        // Check how long ago staff replied
        const minutesSinceStaff = (Date.now() - new Date(lastStaffMessage.created_at).getTime()) / (1000 * 60)

        if (minutesSinceStaff > 30) {
          // Staff replied more than 30 min ago - reset to auto
          conversationsToReset.push(convo.id)
          console.log(`[Cron] Reset ${customerPhone || 'unknown'} - staff replied ${Math.floor(minutesSinceStaff)} min ago`)
        }
      }
    }

    // Batch update all conversations
    if (conversationsToReset.length > 0) {
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ 
          status: 'auto',
          updated_at: new Date().toISOString()
        })
        .in('id', conversationsToReset)

      if (updateError) {
        console.error('[Cron] Error updating conversations:', updateError)
        return NextResponse.json({ error: 'Update error' }, { status: 500 })
      }

      resetCount = conversationsToReset.length
    }

    const duration = Date.now() - startTime

    console.log(`[Cron] ✅ Reset ${resetCount} conversations in ${duration}ms`)

    return NextResponse.json({
      success: true,
      resetCount,
      totalManual: manualConversations.length,
      durationMs: duration,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
