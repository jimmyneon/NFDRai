'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Conversation = {
  status: string
  created_at: string
  channel: string
}

type Message = {
  sender: string
  created_at: string
  text: string
}

export function AnalyticsCharts({
  conversations,
  messages,
}: {
  conversations: Conversation[]
  messages: Message[]
}) {
  // Group messages by hour
  const hourlyActivity = messages.reduce((acc, msg) => {
    const hour = new Date(msg.created_at).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const maxActivity = Math.max(...Object.values(hourlyActivity), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity by Hour</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
            const count = hourlyActivity[hour] || 0
            const percentage = (count / maxActivity) * 100

            return (
              <div key={hour} className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">
                  {hour.toString().padStart(2, '0')}:00
                </span>
                <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
