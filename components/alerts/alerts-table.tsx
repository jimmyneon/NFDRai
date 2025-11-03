'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'

type Alert = {
  id: string
  type: string
  notified_to: string
  created_at: string
  conversations?: {
    id: string
    channel: string
    status: string
    customers?: {
      name: string | null
      phone: string | null
    }
  }
}

export function AlertsTable({ alerts }: { alerts: Alert[] }) {
  const getAlertTypeColor = (type: string) => {
    if (type === 'low_confidence') {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    }
    if (type === 'manual_required') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  const getAlertTypeLabel = (type: string) => {
    if (type === 'low_confidence') return 'Low Confidence'
    if (type === 'manual_required') return 'Manual Required'
    return type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No alerts yet. System is running smoothly! 🎉</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getAlertTypeColor(alert.type)}>
                {getAlertTypeLabel(alert.type)}
              </Badge>
              {alert.conversations && (
                <Badge variant="outline">{alert.conversations.channel}</Badge>
              )}
            </div>

            {alert.conversations?.customers && (
              <div className="text-sm">
                <span className="font-medium">
                  {alert.conversations.customers.name || 'Unknown Customer'}
                </span>
                {alert.conversations.customers.phone && (
                  <span className="text-muted-foreground ml-2">
                    {alert.conversations.customers.phone}
                  </span>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {formatDate(alert.created_at)} • Notified to {alert.notified_to}
            </div>
          </div>

          {alert.conversations && (
            <Link href={`/dashboard/conversations?id=${alert.conversations.id}`}>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Conversation
              </Button>
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
