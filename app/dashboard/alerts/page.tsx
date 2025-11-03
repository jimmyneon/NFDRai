import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertsTable } from '@/components/alerts/alerts-table'
import { AlertCircle, Bell } from 'lucide-react'

export default async function AlertsPage() {
  const supabase = await createClient()

  const { data: alerts } = await supabase
    .from('alerts')
    .select(`
      *,
      conversations:conversation_id (
        id,
        channel,
        status,
        customers:customer_id (
          name,
          phone
        )
      )
    `)
    .order('created_at', { ascending: false })

  const totalAlerts = alerts?.length || 0
  const lowConfidenceAlerts = alerts?.filter((a) => a.type === 'low_confidence').length || 0
  const manualRequiredAlerts = alerts?.filter((a) => a.type === 'manual_required').length || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            System notifications and manual intervention requests
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAlerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{lowConfidenceAlerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Manual Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{manualRequiredAlerts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertsTable alerts={alerts || []} />
        </CardContent>
      </Card>
    </div>
  )
}
