'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UsageData {
  totalUsage: number
  dailyUsage: number
  error?: string
  lastUpdated?: string
}

export function OpenAIUsageCard() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/openai/usage')
      const data = await response.json()
      setUsage(data)
    } catch (error) {
      console.error('Failed to fetch OpenAI usage:', error)
      setUsage({ totalUsage: 0, dailyUsage: 0, error: 'Failed to load usage data' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            OpenAI Usage
          </CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (usage?.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            OpenAI Usage
          </CardTitle>
          <CardDescription>Unable to load usage data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{usage.error}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchUsage}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              OpenAI Usage
            </CardTitle>
            <CardDescription>Current billing period</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchUsage}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {formatCurrency(usage?.totalUsage || 0)}
            </span>
            <span className="text-sm text-muted-foreground">this month</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today</span>
            <span className="font-medium">{formatCurrency(usage?.dailyUsage || 0)}</span>
          </div>
        </div>

        {usage?.lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Updated {new Date(usage.lastUpdated).toLocaleTimeString()}
          </div>
        )}

        <div className="pt-2 border-t">
          <a 
            href="https://platform.openai.com/usage" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View detailed usage on OpenAI
            <TrendingUp className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
