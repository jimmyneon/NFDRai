'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export function ExportButton() {
  const supabase = createClient()
  const { toast } = useToast()

  const handleExport = async () => {
    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        *,
        customer:customers(*),
        messages(*)
      `)

    if (!conversations) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      })
      return
    }

    // Convert to CSV
    const csv = [
      ['Conversation ID', 'Customer', 'Channel', 'Status', 'Messages', 'Created At'].join(','),
      ...conversations.map((conv) =>
        [
          conv.id,
          conv.customer?.name || 'Unknown',
          conv.channel,
          conv.status,
          conv.messages?.length || 0,
          conv.created_at,
        ].join(',')
      ),
    ].join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()

    toast({
      title: 'Success',
      description: 'Analytics exported to CSV',
    })
  }

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  )
}
