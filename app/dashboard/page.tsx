import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Bot, User, AlertCircle } from 'lucide-react'
import { GlobalKillSwitch } from '@/components/dashboard/kill-switch'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get stats
  const { count: totalConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })

  const { count: autoResponses } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender', 'ai')

  const { count: manualConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'manual')

  const { count: pausedConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'paused')

  // Get recent activity with messages
  const { data: recentConversations } = await supabase
    .from('conversations')
    .select(`
      *,
      customers:customer_id (
        name,
        phone
      ),
      messages (
        id,
        created_at
      )
    `)
    .order('updated_at', { ascending: false })
    .limit(10)

  // Sort by most recent message timestamp
  const sortedRecentConversations = recentConversations
    ?.map(conv => {
      const lastMessageTime = conv.messages?.[conv.messages.length - 1]?.created_at || conv.updated_at
      return { ...conv, lastMessageTime }
    })
    .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
    .slice(0, 5)

  const stats = [
    {
      title: 'Total Conversations',
      value: totalConversations || 0,
      icon: MessageSquare,
      color: 'bg-blue-500',
    },
    {
      title: 'Auto Responses',
      value: autoResponses || 0,
      icon: Bot,
      color: 'bg-green-500',
    },
    {
      title: 'Manual Required',
      value: manualConversations || 0,
      icon: User,
      color: 'bg-amber-500',
    },
    {
      title: 'Paused',
      value: pausedConversations || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to New Forest Device Repairs AI Admin
          </p>
        </div>
        <GlobalKillSwitch />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="tile-button">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedRecentConversations && sortedRecentConversations.length > 0 ? (
              <div className="space-y-3">
                {sortedRecentConversations.map((conv) => (
                  <a
                    key={conv.id}
                    href={`/dashboard/conversations?id=${conv.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {conv.customers?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conv.customers?.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground capitalize">
                        {conv.channel}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          conv.status === 'auto'
                            ? 'bg-green-500'
                            : conv.status === 'manual'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity to display.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <a
              href="/dashboard/conversations"
              className="p-4 rounded-xl border border-border hover:bg-accent transition-colors text-center"
            >
              <MessageSquare className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">View Chats</p>
            </a>
            <a
              href="/dashboard/sandbox"
              className="p-4 rounded-xl border border-border hover:bg-accent transition-colors text-center"
            >
              <Bot className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Test AI</p>
            </a>
            <a
              href="/dashboard/pricing"
              className="p-4 rounded-xl border border-border hover:bg-accent transition-colors text-center"
            >
              <span className="text-2xl mx-auto mb-2 block">£</span>
              <p className="text-sm font-medium">Pricing</p>
            </a>
            <a
              href="/dashboard/settings"
              className="p-4 rounded-xl border border-border hover:bg-accent transition-colors text-center"
            >
              <span className="text-2xl mx-auto mb-2 block">⚙️</span>
              <p className="text-sm font-medium">Settings</p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
