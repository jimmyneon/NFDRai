'use client'

import { useState, useEffect, useRef } from 'react'
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
import { User, Bot, UserCog } from 'lucide-react'

type Message = {
  id: string
  text: string
  sender: string
  created_at: string
  ai_provider?: string | null
  ai_confidence?: number | null
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
  const supabase = createClient()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when dialog opens or messages change
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, conversation.messages])

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
  const sortedMessages = [...(conversation.messages || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{conversation.customer?.name || 'Unknown Customer'}</span>
            <Badge>{conversation.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Messages */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
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
                  </div>
                </div>
              </div>
            ))}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {conversation.status === 'auto' ? (
              <Button onClick={handleTakeOver} disabled={loading} className="flex-1">
                Take Over (Manual Mode)
              </Button>
            ) : (
              <Button onClick={handleResume} disabled={loading} className="flex-1">
                Resume Auto Mode
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
