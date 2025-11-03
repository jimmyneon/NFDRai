'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, Phone, User } from 'lucide-react'
import { ConversationDialog } from './conversation-dialog'

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

export function ConversationList({ conversations }: { conversations: Conversation[] }) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'auto':
        return 'bg-green-500'
      case 'manual':
        return 'bg-amber-500'
      case 'paused':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return '💬'
      case 'whatsapp':
        return '📱'
      case 'messenger':
        return '💌'
      default:
        return '📧'
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
                      <span className="text-2xl">{getChannelIcon(conversation.channel)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {conversation.customer?.name || 'Unknown Customer'}
                        </h3>
                        <Badge className={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Badge>
                      </div>
                      
                      {conversation.customer?.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <Phone className="w-3 h-3" />
                          {conversation.customer.phone}
                        </p>
                      )}
                      
                      {lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage.sender === 'customer' ? '👤' : lastMessage.sender === 'ai' ? '🤖' : '👨‍💼'}{' '}
                          {lastMessage.text}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(conversation.updated_at)}
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
