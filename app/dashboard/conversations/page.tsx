import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConversationList } from '@/components/conversations/conversation-list'
import { formatRelativeTime } from '@/lib/utils'

export default async function ConversationsPage() {
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      customer:customers(*),
      messages(id, text, sender, created_at)
    `)
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-muted-foreground mt-1">
          Manage customer conversations and AI responses
        </p>
      </div>

      <ConversationList conversations={conversations || []} />
    </div>
  )
}
