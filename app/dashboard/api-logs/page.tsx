'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ApiLog {
  id: string
  endpoint: string
  method: string
  status_code: number
  request_body: any
  response_body: any
  error: string | null
  ip_address: string | null
  user_agent: string | null
  duration_ms: number | null
  created_at: string
}

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [tableExists, setTableExists] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [filter])

  async function loadLogs() {
    const supabase = createClient()
    
    let query = supabase
      .from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filter !== 'all') {
      query = query.eq('endpoint', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading logs:', error)
      // Check if table doesn't exist
      if (error.message?.includes('api_logs') || error.code === 'PGRST205') {
        setTableExists(false)
      }
    } else {
      setLogs(data || [])
    }
    setLoading(false)
  }

  function getStatusColor(status: number) {
    if (status >= 200 && status < 300) return 'bg-green-500'
    if (status >= 400 && status < 500) return 'bg-yellow-500'
    if (status >= 500) return 'bg-red-500'
    return 'bg-gray-500'
  }

  function getEndpointBadge(endpoint: string) {
    if (endpoint.includes('incoming')) return 'Incoming SMS'
    if (endpoint.includes('send')) return 'Send SMS'
    if (endpoint.includes('missed-call')) return 'Missed Call'
    return endpoint
  }

  if (!tableExists) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Logs</h1>
          <p className="text-muted-foreground">Monitor API calls and debug issues</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Table Not Found</CardTitle>
            <CardDescription>
              The api_logs table doesn't exist yet. Run this SQL in Supabase:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  request_body JSONB,
  response_body JSONB,
  error TEXT,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON public.api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at DESC);

ALTER TABLE public.api_logs DISABLE ROW LEVEL SECURITY;`}
            </pre>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh After Running SQL
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Logs</h1>
        <p className="text-muted-foreground">Monitor API calls and debug issues</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === '/api/messages/incoming' ? 'default' : 'outline'}
          onClick={() => setFilter('/api/messages/incoming')}
        >
          Incoming
        </Button>
        <Button
          variant={filter === '/api/messages/send' ? 'default' : 'outline'}
          onClick={() => setFilter('/api/messages/send')}
        >
          Send
        </Button>
        <Button
          variant={filter === '/api/messages/missed-call' ? 'default' : 'outline'}
          onClick={() => setFilter('/api/messages/missed-call')}
        >
          Missed Calls
        </Button>
      </div>

      {/* Logs */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No API logs yet. Logs will appear here as API calls are made.
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => (
              <Card key={log.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.method}</Badge>
                      <Badge>{getEndpointBadge(log.endpoint)}</Badge>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(log.status_code)}`} />
                      <span className="text-sm font-mono">{log.status_code}</span>
                      {log.duration_ms && (
                        <span className="text-sm text-muted-foreground">
                          {log.duration_ms}ms
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Request */}
                  {log.request_body && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Request:</h4>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.request_body, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                  {log.response_body && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Response:</h4>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.response_body, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error */}
                  {log.error && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-red-500">Error:</h4>
                      <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto text-red-700">
                        {log.error}
                      </pre>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    {log.ip_address && <div>IP: {log.ip_address}</div>}
                    {log.user_agent && <div>User Agent: {log.user_agent}</div>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
