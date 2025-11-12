import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExtractionsList } from '@/components/extractions/extractions-list'

export default async function ExtractionsPage() {
  const supabase = await createClient()

  // Fetch all staff message extractions with related data
  const { data: extractions, error } = await supabase
    .from('staff_message_extractions')
    .select(`
      *,
      message:messages(
        id,
        text,
        created_at,
        sender
      ),
      conversation:conversations(
        id,
        customer:customers(
          id,
          name,
          phone
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[Extractions] Query error:', error)
  }

  // Calculate stats
  const stats = {
    total: extractions?.length || 0,
    highConfidence: extractions?.filter(e => e.extraction_confidence >= 0.8).length || 0,
    lowConfidence: extractions?.filter(e => e.extraction_confidence < 0.5).length || 0,
    withNames: extractions?.filter(e => e.customer_name).length || 0,
    ready: extractions?.filter(e => e.repair_status === 'ready').length || 0,
    quoted: extractions?.filter(e => e.repair_status === 'quoted').length || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff Message Extractions</h1>
        <p className="text-muted-foreground mt-1">
          Audit and manage information extracted from staff messages
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Extractions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Last 100 messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.highConfidence}</div>
            <p className="text-xs text-muted-foreground">
              ≥80% confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowConfidence}</div>
            <p className="text-xs text-muted-foreground">
              &lt;50% confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Names Extracted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withNames}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.withNames / stats.total) * 100)}% of messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Extractions List */}
      <ExtractionsList extractions={extractions || []} />
    </div>
  )
}
