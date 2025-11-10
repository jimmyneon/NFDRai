'use client'

import { useState, useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { User, Bot, UserCog, Check, CheckCheck, Ban, Unlock } from 'lucide-react'

type Message = {
  id: string
  text: string
  sender: string
  created_at: string
  ai_provider?: string | null
  ai_confidence?: number | null
  delivered?: boolean | null
  delivered_at?: string | null
}

type Conversation = {
  id: string
  status: string
  channel: string
  customer: {
    name: string | null
    phone: string | null
  }
  messages: Message[]
}

export function ConversationDialog({
  conversation,
  open,
  onClose,
}: {
  conversation: Conversation
  open: boolean
  onClose: () => void
}) {
  const [staffNote, setStaffNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>(conversation.messages || [])
  const [conversationStatus, setConversationStatus] = useState(conversation.status)
  const supabase = createClient()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const initialMessageCountRef = useRef(messages.length)
  const hasScrolledToBottomRef = useRef(false)

  // Update local state when conversation prop changes
  useEffect(() => {
    setMessages(conversation.messages || [])
    setConversationStatus(conversation.status)
    initialMessageCountRef.current = conversation.messages?.length || 0
    hasScrolledToBottomRef.current = false
  }, [conversation])
  
  // Reset scroll flag when dialog closes
  useEffect(() => {
    if (!open) {
      hasScrolledToBottomRef.current = false
    }
  }, [open])

  // Scroll to bottom when dialog opens or messages change
  useEffect(() => {
    if (!open) return
    
    const scrollToBottom = () => {
      const container = messagesContainerRef.current
      if (container) {
        // Force scroll to bottom using scrollTop
        container.scrollTop = container.scrollHeight
        console.log('[Scroll] Scrolled to:', container.scrollTop, 'of', container.scrollHeight)
      } else {
        console.log('[Scroll] Container ref not available')
      }
    }
    
    // Determine if this is initial open or new message
    const isInitialOpen = !hasScrolledToBottomRef.current
    const isNewMessage = messages.length > initialMessageCountRef.current
    
    console.log('[Scroll] Effect triggered:', { open, isInitialOpen, isNewMessage, messageCount: messages.length })
    
    if (isInitialOpen) {
      // On initial open, scroll instantly and aggressively with more retries
      scrollToBottom()
      setTimeout(scrollToBottom, 0)
      setTimeout(scrollToBottom, 10)
      setTimeout(scrollToBottom, 50)
      setTimeout(scrollToBottom, 100)
      setTimeout(scrollToBottom, 200)
      setTimeout(scrollToBottom, 300)
      setTimeout(() => {
        scrollToBottom()
        hasScrolledToBottomRef.current = true
      }, 500)
    } else if (isNewMessage) {
      // For new messages, also force scroll
      scrollToBottom()
      setTimeout(scrollToBottom, 50)
      initialMessageCountRef.current = messages.length
    }
  }, [open, messages])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!open) return

    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversation.id}`,
        },
        (payload) => {
          const updated = payload.new as any
          setConversationStatus(updated.status)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, conversation.id, supabase])

  const handleTakeOver = async () => {
    setLoading(true)
    
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'manual' })
      .eq('id', conversation.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to take over conversation',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Conversation switched to manual mode',
      })
      onClose()
      window.location.reload()
    }
    
    setLoading(false)
  }

  const handleResume = async () => {
    setLoading(true)
    
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'auto' })
      .eq('id', conversation.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to resume automation',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Conversation resumed in auto mode',
      })
      onClose()
      window.location.reload()
    }
    
    setLoading(false)
  }

  const handleBlock = async () => {
    setLoading(true)
    
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'blocked' })
      .eq('id', conversation.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to block AI',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'AI permanently blocked for this conversation',
      })
      onClose()
      window.location.reload()
    }
    
    setLoading(false)
  }

  const handleUnblock = async () => {
    setLoading(true)
    
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'manual' })
      .eq('id', conversation.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to unblock AI',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'AI unblocked - conversation in manual mode',
      })
      onClose()
      window.location.reload()
    }
    
    setLoading(false)
  }

  const handleAddNote = async () => {
    if (!staffNote.trim()) return

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('staff_notes')
      .insert({
        conversation_id: conversation.id,
        user_id: user?.id || '',
        note: staffNote,
      })

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Note added',
      })
      setStaffNote('')
    }
    
    setLoading(false)
  }

  // Sort messages by created_at ascending (oldest first, newest last)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{conversation.customer?.name || 'Unknown Customer'}</span>
              <span className="text-xs text-muted-foreground">(v2)</span>
            </div>
            <Badge variant={conversationStatus === 'auto' ? 'default' : 'secondary'}>
              {conversationStatus === 'auto' ? '🤖 AI Mode' : '👨‍💼 Manual Mode'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 space-y-3 overflow-y-auto scroll-smooth p-4"
          >
            {sortedMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'customer' ? '' : 'flex-row-reverse'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {message.sender === 'customer' ? (
                    <User className="w-4 h-4" />
                  ) : message.sender === 'ai' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <UserCog className="w-4 h-4" />
                  )}
                </div>
                
                <div className={`flex-1 ${message.sender === 'customer' ? '' : 'text-right'}`}>
                  <div
                    className={`inline-block p-3 rounded-xl ${
                      message.sender === 'customer'
                        ? 'bg-muted'
                        : message.sender === 'staff'
                        ? 'bg-blue-500 text-white'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatDate(message.created_at)}</span>
                    {message.ai_provider && (
                      <>
                        <span>•</span>
                        <span>{message.ai_provider}</span>
                      </>
                    )}
                    {message.ai_confidence && (
                      <>
                        <span>•</span>
                        <span>{message.ai_confidence}% confidence</span>
                      </>
                    )}
                    {(message.sender === 'ai' || message.sender === 'staff' || message.sender === 'system') && (
                      <>
                        <span>•</span>
                        {message.delivered ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCheck className="w-3 h-3" />
                            Delivered
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Sent
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              {conversation.status === 'blocked' ? (
                <Button onClick={handleUnblock} disabled={loading} className="flex-1" variant="outline">
                  <Unlock className="w-4 h-4 mr-2" />
                  Unblock AI
                </Button>
              ) : conversation.status === 'auto' ? (
                <Button onClick={handleTakeOver} disabled={loading} className="flex-1">
                  Take Over (Manual Mode)
                </Button>
              ) : (
                <Button onClick={handleResume} disabled={loading} className="flex-1">
                  Resume Auto Mode
                </Button>
              )}
            </div>
            {conversation.status !== 'blocked' && (
              <Button 
                onClick={handleBlock} 
                disabled={loading} 
                variant="destructive" 
                className="w-full"
                size="sm"
              >
                <Ban className="w-4 h-4 mr-2" />
                Block AI Permanently
              </Button>
            )}
          </div>

          {/* Staff Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Internal Note</label>
            <Textarea
              placeholder="Add a note for your team..."
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
            />
            <Button onClick={handleAddNote} disabled={loading || !staffNote.trim()}>
              Add Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
