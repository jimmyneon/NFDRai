'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import {
  Bot,
  User,
  PlayCircle,
  PauseCircle,
  UserCheck,
  AlertTriangle,
} from 'lucide-react'

type ConversationControlsProps = {
  conversationId: string
  currentStatus: 'auto' | 'manual' | 'archived'
  assignedTo?: string | null
  onStatusChange?: (newStatus: string) => void
}

export function ConversationControls({
  conversationId,
  currentStatus,
  assignedTo,
  onStatusChange,
}: ConversationControlsProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<'auto' | 'manual' | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const handleTakeOver = () => {
    setPendingAction('manual')
    setShowConfirm(true)
  }

  const handleResume = () => {
    setPendingAction('auto')
    setShowConfirm(true)
  }

  const confirmStatusChange = async () => {
    if (!pendingAction) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: pendingAction })
        .eq('id', conversationId)

      if (error) throw error

      setStatus(pendingAction)
      onStatusChange?.(pendingAction)

      toast({
        title: 'Success',
        description:
          pendingAction === 'auto'
            ? 'AI automation resumed'
            : 'Manual mode activated - AI will not respond',
      })

      setShowConfirm(false)
      setPendingAction(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update conversation status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ assigned_to: userId })
        .eq('id', conversationId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Conversation assigned',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign conversation',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mode:</span>
          <Badge
            variant={status === 'auto' ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            {status === 'auto' ? (
              <>
                <Bot className="w-3 h-3" />
                AI Auto
              </>
            ) : (
              <>
                <User className="w-3 h-3" />
                Manual
              </>
            )}
          </Badge>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 ml-auto">
          {status === 'auto' ? (
            <Button
              onClick={handleTakeOver}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <PauseCircle className="w-4 h-4 mr-2" />
              Take Over
            </Button>
          ) : (
            <Button
              onClick={handleResume}
              disabled={loading}
              size="sm"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Resume AI
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              {pendingAction === 'manual' ? 'Take Over Conversation?' : 'Resume AI Automation?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'manual' ? (
                <>
                  <p className="mb-2">
                    You are about to switch this conversation to <strong>manual mode</strong>.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>AI will <strong>stop responding</strong> to new messages</li>
                    <li>You will need to manually reply to the customer</li>
                    <li>AI will remain paused until you resume it</li>
                    <li>This prevents AI from interfering with your conversation</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="mb-2">
                    You are about to resume <strong>AI automation</strong>.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>AI will <strong>automatically respond</strong> to new messages</li>
                    <li>You can take over again at any time</li>
                    <li>Low confidence responses will still require manual review</li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={loading}>
              {loading ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
