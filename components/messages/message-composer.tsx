'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  Send, 
  Loader2, 
  Smile,
  FileText,
  Zap,
} from 'lucide-react'

type MessageTemplate = {
  id: string
  name: string
  content: string
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'greeting',
    name: 'Greeting',
    content: 'Hi! Thanks for contacting New Forest Device Repairs. How can I help you today?',
  },
  {
    id: 'quote_sent',
    name: 'Quote Sent',
    content: 'I\'ve sent you a quote for the repair. Please let me know if you have any questions!',
  },
  {
    id: 'ready',
    name: 'Device Ready',
    content: 'Great news! Your device is ready for collection. We\'re open Mon-Sat 9am-6pm.',
  },
  {
    id: 'followup',
    name: 'Follow Up',
    content: 'Just following up on your repair inquiry. Are you still interested in getting this fixed?',
  },
  {
    id: 'thanks',
    name: 'Thank You',
    content: 'Thank you for choosing New Forest Device Repairs! We appreciate your business.',
  },
]

const EMOJIS = ['👍', '😊', '✅', '📱', '💚', '🔧', '⚡', '🎉', '👋', '💯']

export function MessageComposer({
  conversationId,
  onSend,
  disabled = false,
}: {
  conversationId: string
  onSend?: (message: string) => void
  disabled?: boolean
}) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!message.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          text: message,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      toast({
        title: 'Message sent',
        description: 'Your message has been delivered',
      })

      setMessage('')
      onSend?.(message)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    setShowEmojis(false)
  }

  const insertTemplate = (template: MessageTemplate) => {
    setMessage(template.content)
    setShowTemplates(false)
  }

  const charCount = message.length
  const maxChars = 1600 // SMS limit for multiple messages

  return (
    <div className="space-y-3">
      {/* Templates */}
      {showTemplates && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-xl">
          <div className="w-full text-sm font-medium mb-1">Quick Templates:</div>
          {DEFAULT_TEMPLATES.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              onClick={() => insertTemplate(template)}
              className="text-xs"
            >
              <Zap className="w-3 h-3 mr-1" />
              {template.name}
            </Button>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojis && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-xl">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              className="text-2xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="relative">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || loading}
          rows={4}
          className="resize-none pr-20"
        />
        
        {/* Character Count */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          <Badge 
            variant={charCount > maxChars ? 'destructive' : 'outline'}
            className="text-xs"
          >
            {charCount}/{maxChars}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowTemplates(!showTemplates)
              setShowEmojis(false)
            }}
            disabled={disabled || loading}
          >
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowEmojis(!showEmojis)
              setShowTemplates(false)
            }}
            disabled={disabled || loading}
          >
            <Smile className="w-4 h-4 mr-2" />
            Emoji
          </Button>
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || loading || !message.trim() || charCount > maxChars}
          size="lg"
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </div>

      {/* Warning for long messages */}
      {charCount > 160 && charCount <= maxChars && (
        <p className="text-xs text-muted-foreground">
          Message will be sent as {Math.ceil(charCount / 160)} SMS parts
        </p>
      )}
    </div>
  )
}
