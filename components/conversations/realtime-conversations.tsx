'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ConversationList } from './conversation-list'
import { useToast } from '@/components/ui/use-toast'
import { Bell } from 'lucide-react'

type Conversation = {
  id: string
  channel: string
  status: string
  updated_at: string
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

export function RealtimeConversations({ 
  initialConversations 
}: { 
  initialConversations: Conversation[] 
}) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    // Subscribe to conversation changes
    const conversationChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // New conversation created
            const { data: newConv } = await supabase
              .from('conversations')
              .select(`
                *,
                customer:customers(*),
                messages(*)
              `)
              .eq('id', payload.new.id)
              .single()

            if (newConv) {
              setConversations((prev) => [newConv, ...prev])
              
              toast({
                title: 'New Conversation',
                description: `New ${newConv.channel} conversation from ${newConv.customer?.name || 'Unknown'}`,
                action: <Bell className="w-4 h-4" />,
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            // Conversation updated
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === payload.new.id
                  ? { ...conv, ...payload.new }
                  : conv
              )
            )
          } else if (payload.eventType === 'DELETE') {
            // Conversation deleted/archived
            setConversations((prev) =>
              prev.filter((conv) => conv.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Fetch the full message with conversation details
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              conversation:conversations(
                id,
                customer:customers(name)
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (message) {
            // Update the conversation in the list
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id === message.conversation_id) {
                  return {
                    ...conv,
                    messages: [...(conv.messages || []), message],
                    updated_at: message.created_at,
                  }
                }
                return conv
              })
            )

            // Show notification for customer messages
            if (message.sender === 'customer') {
              toast({
                title: 'New Message',
                description: `${message.conversation?.customer?.name || 'Customer'}: ${message.text.substring(0, 50)}...`,
                action: <Bell className="w-4 h-4" />,
              })
            }
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      conversationChannel.unsubscribe()
      messageChannel.unsubscribe()
    }
  }, [supabase, toast])

  return <ConversationList conversations={conversations} />
}
