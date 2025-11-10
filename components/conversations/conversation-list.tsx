'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, Phone, User, AlertTriangle, AlertCircle } from 'lucide-react'
import { ConversationDialog } from './conversation-dialog'

type Conversation = {
  id: string
  channel: string
  status: string
  updated_at: string
  last_sentiment?: string | null
  last_urgency?: string | null
  requires_urgent_attention?: boolean
  customer: {
    name: string | null
    phone: string | null
  }
  messages: Array<{
    id: string
    text: string
    sender: string
    created_at: string
  }>
}

export function ConversationList({ conversations: initialConversations }: { conversations: Conversation[] }) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const supabase = createClient()

  // Helper function to sort conversations by last message time
  const sortByLastMessage = (convos: any[]) => {
    return convos.sort((a, b) => {
      // Get the last message timestamp for each conversation
      const aLastMsg = a.messages?.[a.messages.length - 1]?.created_at
      const bLastMsg = b.messages?.[b.messages.length - 1]?.created_at
      
      // If no messages, use conversation updated_at
      const aTime = aLastMsg || a.updated_at
      const bTime = bLastMsg || b.updated_at
      
      // Sort descending (most recent first)
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  }

  // Initialize with sorted conversations
  const [conversations, setConversations] = useState<Conversation[]>(sortByLastMessage([...initialConversations]))

  useEffect(() => {
    setConversations(sortByLastMessage([...initialConversations]))
  }, [initialConversations])

  useEffect(() => {
    const channel = supabase
      .channel('realtime-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        async () => {
          const { data } = await supabase
            .from('conversations')
            .select('*, customer:customers(*), messages(*)')
            .order('updated_at', { ascending: false })
          if (data) {
            setConversations(sortByLastMessage(data))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async () => {
          const { data } = await supabase
            .from('conversations')
            .select('*, customer:customers(*), messages(*)')
            .order('updated_at', { ascending: false })
          if (data) {
            setConversations(sortByLastMessage(data))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        async () => {
          const { data } = await supabase
            .from('conversations')
            .select('*, customer:customers(*), messages(*)')
            .order('updated_at', { ascending: false })
          if (data) {
            setConversations(sortByLastMessage(data))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'auto':
        return 'bg-green-500'
      case 'manual':
        return 'bg-amber-500'
      case 'blocked':
        return 'bg-red-500'
      case 'paused':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return 'SMS'
      case 'whatsapp':
        return 'WA'
      case 'messenger':
        return 'MSG'
      default:
        return 'MSG'
    }
  }

  if (!conversations || conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No conversations yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {conversations.map((conversation) => {
          const lastMessage = conversation.messages?.[conversation.messages.length - 1]
          
          return (
            <Card
              key={conversation.id}
              className="tile-button cursor-pointer hover:shadow-lg"
              onClick={() => setSelectedConversation(conversation)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">{getChannelIcon(conversation.channel)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {conversation.customer?.name || 'Unknown Customer'}
                        </h3>
                        <Badge className={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Badge>
                        {conversation.requires_urgent_attention && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            {conversation.last_sentiment === 'angry' ? (
                              <><AlertCircle className="w-3 h-3" /> Angry</>
                            ) : (
                              <><AlertTriangle className="w-3 h-3" /> Frustrated</>
                            )}
                          </Badge>
                        )}
                      </div>
                      
                      {conversation.customer?.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <Phone className="w-3 h-3" />
                          {conversation.customer.phone}
                        </p>
                      )}
                      
                      {lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          <span className="font-semibold">
                            {lastMessage.sender === 'customer' ? 'Customer' : lastMessage.sender === 'ai' ? 'AI' : 'Staff'}:
                          </span>{' '}
                          {lastMessage.text}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(lastMessage?.created_at || conversation.updated_at)}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {conversation.messages?.length || 0} msgs
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedConversation && (
        <ConversationDialog
          conversation={selectedConversation}
          open={!!selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </>
  )
}
