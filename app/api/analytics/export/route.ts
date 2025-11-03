import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/analytics/export
 * Export analytics data as CSV or JSON
 * 
 * Query params:
 * - format: 'csv' | 'json' (default: csv)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - type: 'conversations' | 'messages' | 'performance' (default: conversations)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') || 'conversations'

    let data: any[] = []
    let headers: string[] = []

    if (type === 'conversations') {
      const result = await exportConversations(supabase, startDate, endDate)
      data = result.data
      headers = result.headers
    } else if (type === 'messages') {
      const result = await exportMessages(supabase, startDate, endDate)
      data = result.data
      headers = result.headers
    } else if (type === 'performance') {
      const result = await exportPerformance(supabase, startDate, endDate)
      data = result.data
      headers = result.headers
    }

    if (format === 'json') {
      return NextResponse.json(data)
    }

    // Generate CSV
    const csv = generateCSV(headers, data)
    const filename = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

async function exportConversations(
  supabase: any,
  startDate: string | null,
  endDate: string | null
) {
  let query = supabase
    .from('conversations')
    .select(`
      id,
      channel,
      status,
      created_at,
      updated_at,
      customer:customers(name, phone),
      messages(count)
    `)

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data: conversations } = await query

  const headers = [
    'Conversation ID',
    'Customer Name',
    'Customer Phone',
    'Channel',
    'Status',
    'Message Count',
    'Created At',
    'Updated At',
  ]

  const data = conversations?.map((conv: any) => ({
    'Conversation ID': conv.id,
    'Customer Name': conv.customer?.name || 'Unknown',
    'Customer Phone': conv.customer?.phone || 'N/A',
    'Channel': conv.channel,
    'Status': conv.status,
    'Message Count': conv.messages?.length || 0,
    'Created At': new Date(conv.created_at).toLocaleString(),
    'Updated At': new Date(conv.updated_at).toLocaleString(),
  })) || []

  return { headers, data }
}

async function exportMessages(
  supabase: any,
  startDate: string | null,
  endDate: string | null
) {
  let query = supabase
    .from('messages')
    .select(`
      id,
      text,
      sender,
      created_at,
      ai_provider,
      ai_model,
      ai_confidence,
      conversation:conversations(
        id,
        channel,
        customer:customers(name, phone)
      )
    `)

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data: messages } = await query

  const headers = [
    'Message ID',
    'Conversation ID',
    'Customer Name',
    'Channel',
    'Sender',
    'Text',
    'AI Provider',
    'AI Model',
    'AI Confidence',
    'Created At',
  ]

  const data = messages?.map((msg: any) => ({
    'Message ID': msg.id,
    'Conversation ID': msg.conversation?.id || 'N/A',
    'Customer Name': msg.conversation?.customer?.name || 'Unknown',
    'Channel': msg.conversation?.channel || 'N/A',
    'Sender': msg.sender,
    'Text': msg.text,
    'AI Provider': msg.ai_provider || 'N/A',
    'AI Model': msg.ai_model || 'N/A',
    'AI Confidence': msg.ai_confidence || 'N/A',
    'Created At': new Date(msg.created_at).toLocaleString(),
  })) || []

  return { headers, data }
}

async function exportPerformance(
  supabase: any,
  startDate: string | null,
  endDate: string | null
) {
  // Get AI performance metrics
  let query = supabase
    .from('messages')
    .select('sender, ai_confidence, created_at')
    .eq('sender', 'ai')

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data: aiMessages } = await query

  // Calculate metrics
  const totalAI = aiMessages?.length || 0
  const avgConfidence = aiMessages?.reduce((sum: number, msg: any) => 
    sum + (msg.ai_confidence || 0), 0) / totalAI || 0
  
  const highConfidence = aiMessages?.filter((msg: any) => 
    (msg.ai_confidence || 0) >= 70).length || 0
  
  const lowConfidence = aiMessages?.filter((msg: any) => 
    (msg.ai_confidence || 0) < 70).length || 0

  const headers = [
    'Metric',
    'Value',
  ]

  const data = [
    { 'Metric': 'Total AI Messages', 'Value': totalAI },
    { 'Metric': 'Average Confidence', 'Value': avgConfidence.toFixed(2) + '%' },
    { 'Metric': 'High Confidence (≥70%)', 'Value': highConfidence },
    { 'Metric': 'Low Confidence (<70%)', 'Value': lowConfidence },
    { 'Metric': 'Success Rate', 'Value': ((highConfidence / totalAI) * 100).toFixed(2) + '%' },
  ]

  return { headers, data }
}

function generateCSV(headers: string[], data: any[]): string {
  const rows = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header] || ''
        // Escape commas and quotes in CSV
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      }).join(',')
    ),
  ]
  return rows.join('\n')
}
