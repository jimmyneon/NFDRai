'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { AlertCircle, DollarSign, Bot } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export function ControlToggles() {
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [priceCheckingEnabled, setPriceCheckingEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase
      .from('ai_settings')
      .select('automation_enabled, price_checking_enabled')
      .eq('active', true)
      .single()

    if (data) {
      setAutomationEnabled(data.automation_enabled ?? true)
      setPriceCheckingEnabled(data.price_checking_enabled ?? false)
    }
    setLoading(false)
  }

  const handleAutomationToggle = async (checked: boolean) => {
    const { error } = await supabase
      .from('ai_settings')
      .update({ automation_enabled: checked })
      .eq('active', true)

    if (!error) {
      setAutomationEnabled(checked)
      toast({
        title: checked ? 'AI Enabled' : 'AI Disabled',
        description: checked
          ? 'AI will now respond to messages automatically'
          : 'AI responses are paused. Manual mode active.',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update automation setting',
        variant: 'destructive',
      })
    }
  }

  const handlePriceCheckingToggle = async (checked: boolean) => {
    const { error } = await supabase
      .from('ai_settings')
      .update({ price_checking_enabled: checked })
      .eq('active', true)

    if (!error) {
      setPriceCheckingEnabled(checked)
      toast({
        title: checked ? 'Price Checking Enabled ✅' : 'Price Checking Disabled ⚠️',
        description: checked
          ? 'AI will now quote prices to customers from your database'
          : 'AI will NOT quote specific prices until you re-enable this',
        variant: checked ? 'default' : 'destructive',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update price checking setting',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Control Panel</CardTitle>
        <CardDescription>
          Global toggles for AI behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Automation Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <Label htmlFor="automation" className="cursor-pointer">
                AI Automation
              </Label>
              <Badge variant={automationEnabled ? 'default' : 'secondary'}>
                {automationEnabled ? 'Active' : 'Paused'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {automationEnabled
                ? 'AI is responding to messages automatically'
                : 'AI responses paused - manual mode only'}
            </p>
          </div>
          <Switch
            id="automation"
            checked={automationEnabled}
            onCheckedChange={handleAutomationToggle}
          />
        </div>

        {/* Price Checking Toggle */}
        <div className={`flex items-center justify-between rounded-lg border p-4 ${
          priceCheckingEnabled 
            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
            : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <Label htmlFor="price-checking" className="cursor-pointer">
                Price Checking
              </Label>
              <Badge variant={priceCheckingEnabled ? 'default' : 'destructive'}>
                {priceCheckingEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {priceCheckingEnabled
                ? 'AI will quote prices from your database'
                : 'AI will NOT quote prices - verify your prices first!'}
            </p>
          </div>
          <Switch
            id="price-checking"
            checked={priceCheckingEnabled}
            onCheckedChange={handlePriceCheckingToggle}
          />
        </div>

        {/* Warning when price checking is disabled */}
        {!priceCheckingEnabled && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/20 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Price checking is disabled
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                AI will not quote specific prices to customers. Enable this once you've verified
                all prices in your database are correct.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
