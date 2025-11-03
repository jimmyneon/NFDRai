'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import {
  Bell,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Trash2,
  X,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

type Alert = {
  id: string
  type: string
  conversation_id: string | null
  message: string | null
  read: boolean
  created_at: string
  conversation?: {
    id: string
    channel: string
    customer: {
      name: string | null
    }
  }
}

export function NotificationCenter({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadAlerts()
      subscribeToAlerts()
    }
  }, [open])

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          conversation:conversations(
            id,
            channel,
            customer:customers(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setAlerts(data || [])
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToAlerts = () => {
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        async (payload) => {
          const { data: newAlert } = await supabase
            .from('alerts')
            .select(`
              *,
              conversation:conversations(
                id,
                channel,
                customer:customers(name)
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (newAlert) {
            setAlerts((prev) => [newAlert, ...prev])
            
            // Show toast notification
            toast({
              title: getAlertTitle(newAlert.type),
              description: getAlertDescription(newAlert),
              action: <Bell className="w-4 h-4" />,
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)

      if (error) throw error

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      )
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark as read',
        variant: 'destructive',
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('read', false)

      if (error) throw error

      setAlerts((prev) =>
        prev.map((alert) => ({ ...alert, read: true }))
      )

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      })
    }
  }

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error

      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      })
    }
  }

  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading notifications...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`transition-all ${
                    !alert.read
                      ? 'bg-primary/5 border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm">
                              {getAlertTitle(alert.type)}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {getAlertDescription(alert)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatRelativeTime(alert.created_at)}
                            </p>
                          </div>

                          <div className="flex gap-1">
                            {!alert.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(alert.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAlert(alert.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'manual_required':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    case 'low_confidence':
      return <AlertCircle className="w-5 h-5 text-orange-500" />
    case 'new_message':
      return <MessageSquare className="w-5 h-5 text-blue-500" />
    default:
      return <Bell className="w-5 h-5 text-gray-500" />
  }
}

function getAlertTitle(type: string): string {
  switch (type) {
    case 'manual_required':
      return 'Manual Response Required'
    case 'low_confidence':
      return 'Low Confidence Response'
    case 'new_message':
      return 'New Message'
    default:
      return 'Notification'
  }
}

function getAlertDescription(alert: Alert): string {
  const customerName = alert.conversation?.customer?.name || 'Unknown customer'
  const channel = alert.conversation?.channel || 'unknown channel'

  if (alert.message) {
    return alert.message
  }

  switch (alert.type) {
    case 'manual_required':
      return `${customerName} sent a message via ${channel} that requires manual attention`
    case 'low_confidence':
      return `AI response to ${customerName} had low confidence and needs review`
    case 'new_message':
      return `New message from ${customerName} via ${channel}`
    default:
      return 'You have a new notification'
  }
}
