'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function SandboxConsole() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<{
    text: string
    confidence: number
    provider: string
    model: string
    settings?: {
      temperature: number
      maxTokens: number
      confidenceThreshold: number
    }
  } | null>(null)
  const { toast } = useToast()

  const handleTest = async () => {
    if (!query.trim()) return

    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch('/api/sandbox/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Show the actual error message from the API
        toast({
          title: 'AI Error',
          description: data.error || 'Failed to generate response',
          variant: 'destructive',
        })
        return
      }

      setResponse(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate AI response',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Query</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Type a sample customer message here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={8}
            className="resize-none"
          />
          <Button onClick={handleTest} disabled={loading || !query.trim()} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Test AI Response
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          {response ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-xl">
                <p className="whitespace-pre-wrap">{response.text}</p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={response.confidence >= 70 ? 'default' : 'destructive'}>
                    {response.confidence}% Confidence
                  </Badge>
                  <Badge variant="outline">{response.provider}</Badge>
                  <Badge variant="outline">{response.model}</Badge>
                </div>

                {response.settings && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Active Settings
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Temperature:</span>
                        <span className="ml-1 font-medium">{response.settings.temperature}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Tokens:</span>
                        <span className="ml-1 font-medium">{response.settings.maxTokens}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Threshold:</span>
                        <span className="ml-1 font-medium">{response.settings.confidenceThreshold}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {response.confidence < 70 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    ⚠️ Low confidence - fallback message would be used in production
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Enter a query and click "Test AI Response" to see results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
