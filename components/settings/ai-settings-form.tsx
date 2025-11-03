'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

type Settings = {
  id: string
  provider: string
  api_key: string
  model_name: string
  temperature: number
  max_tokens: number
  system_prompt: string
  confidence_threshold: number
  fallback_message: string
  active: boolean
}

export function AISettingsForm({ settings }: { settings: Settings | null }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    provider: settings?.provider || 'openai',
    api_key: settings?.api_key || '',
    model_name: settings?.model_name || 'gpt-4o-mini',
    temperature: settings?.temperature || 0.7,
    max_tokens: settings?.max_tokens || 500,
    system_prompt: settings?.system_prompt || '',
    confidence_threshold: settings?.confidence_threshold || 70,
    fallback_message: settings?.fallback_message || "I'll pass this to a team member for confirmation.",
    active: settings?.active ?? true,
  })
  const supabase = createClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const data = {
      provider: formData.provider,
      api_key: formData.api_key,
      model_name: formData.model_name,
      temperature: formData.temperature,
      max_tokens: formData.max_tokens,
      system_prompt: formData.system_prompt,
      confidence_threshold: formData.confidence_threshold,
      fallback_message: formData.fallback_message,
      active: formData.active,
    }

    let error
    if (settings?.id) {
      const result = await supabase
        .from('ai_settings')
        .update(data)
        .eq('id', settings.id)
      error = result.error
    } else {
      const result = await supabase.from('ai_settings').insert(data)
      error = result.error
    }

    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    }

    setLoading(false)
  }

  const modelOptions: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    mistral: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
    deepseek: ['deepseek-chat', 'deepseek-coder'],
    gemini: ['gemini-1.5-flash-002', 'gemini-1.5-pro-002', 'gemini-1.0-pro'],
    custom: ['custom-model'],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="active">AI Automation Active</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable AI responses globally
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  provider: value,
                  model_name: modelOptions[value]?.[0] || '',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                <SelectItem value="mistral">Mistral AI</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="custom">Custom Endpoint</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              placeholder="sk-..."
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model_name">Model</Label>
            <Select
              value={formData.model_name}
              onValueChange={(value) => setFormData({ ...formData, model_name: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions[formData.provider]?.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature ({formData.temperature})</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                min="50"
                max="4000"
                value={formData.max_tokens}
                onChange={(e) =>
                  setFormData({ ...formData, max_tokens: parseInt(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence_threshold">
              Confidence Threshold (%) - {formData.confidence_threshold}%
            </Label>
            <Input
              id="confidence_threshold"
              type="number"
              min="0"
              max="100"
              value={formData.confidence_threshold}
              onChange={(e) =>
                setFormData({ ...formData, confidence_threshold: parseFloat(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt</Label>
            <Textarea
              id="system_prompt"
              placeholder="You are a helpful customer service assistant..."
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              required
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fallback_message">Fallback Message</Label>
            <Textarea
              id="fallback_message"
              placeholder="Message to send when AI confidence is low..."
              value={formData.fallback_message}
              onChange={(e) => setFormData({ ...formData, fallback_message: e.target.value })}
              required
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
