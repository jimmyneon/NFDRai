import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsCharts } from '@/components/analytics/analytics-charts'
import { ExportButton } from '@/components/analytics/export-button'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Get conversation stats
  const { data: conversations } = await supabase
    .from('conversations')
    .select('status, created_at, channel')

  const { data: messages } = await supabase
    .from('messages')
    .select('sender, created_at, text')

  // Calculate stats
  const totalConversations = conversations?.length || 0
  const autoCount = conversations?.filter((c) => c.status === 'auto').length || 0
  const manualCount = conversations?.filter((c) => c.status === 'manual').length || 0
  
  const autoPercentage = totalConversations > 0 
    ? Math.round((autoCount / totalConversations) * 100) 
    : 0

  // Channel breakdown
  const channelStats = conversations?.reduce((acc, conv) => {
    acc[conv.channel] = (acc[conv.channel] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Most common queries (simple word frequency)
  const queryWords = messages
    ?.filter((m) => m.sender === 'customer')
    .flatMap((m) => m.text.toLowerCase().split(' '))
    .filter((word) => word.length > 4) || []

  const wordFrequency = queryWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topQueries = Object.entries(wordFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Insights and performance metrics
          </p>
        </div>
        <ExportButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Auto Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{autoPercentage}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Manual Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{manualCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{messages?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Channel Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(channelStats).map(([channel, count]) => (
                <div key={channel} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{channel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(count / totalConversations) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Query Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topQueries.map(([word, count]) => (
                <div key={word} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{word}</span>
                  <span className="text-muted-foreground">{count as number} times</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AnalyticsCharts conversations={conversations || []} messages={messages || []} />
    </div>
  )
}
