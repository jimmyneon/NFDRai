'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle } from 'lucide-react'

export function GlobalKillSwitch() {
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    const { data } = await supabase
      .from('ai_settings')
      .select('active')
      .eq('active', true)
      .single()

    setEnabled(!!data)
  }

  const toggleAutomation = async (checked: boolean) => {
    setLoading(true)

    if (!checked) {
      // Pause all auto conversations
      await supabase
        .from('conversations')
        .update({ status: 'paused' })
        .eq('status', 'auto')
    } else {
      // Resume paused conversations
      await supabase
        .from('conversations')
        .update({ status: 'auto' })
        .eq('status', 'paused')
    }

    // Update AI settings
    await supabase
      .from('ai_settings')
      .update({ active: checked })
      .eq('active', !checked)

    setEnabled(checked)
    setLoading(false)

    toast({
      title: checked ? 'Automation Enabled' : 'Automation Paused',
      description: checked
        ? 'AI responses are now active'
        : 'All conversations paused - manual mode only',
    })
  }

  return (
    <Card className="p-4 flex items-center gap-3">
      <AlertCircle className={enabled ? 'text-green-500' : 'text-red-500'} />
      <div className="flex-1">
        <Label htmlFor="kill-switch" className="font-semibold">
          AI Automation
        </Label>
        <p className="text-xs text-muted-foreground">
          {enabled ? 'Active' : 'Paused'}
        </p>
      </div>
      <Switch
        id="kill-switch"
        checked={enabled}
        onCheckedChange={toggleAutomation}
        disabled={loading}
      />
    </Card>
  )
}
