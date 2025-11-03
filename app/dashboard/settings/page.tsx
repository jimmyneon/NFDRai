import { createClient } from '@/lib/supabase/server'
import { AISettingsForm } from '@/components/settings/ai-settings-form'
import { ControlToggles } from '@/components/settings/control-toggles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('ai_settings')
    .select('*')
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure AI providers and system behavior
        </p>
      </div>

      <ControlToggles />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AISettingsForm settings={settings} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Temperature</p>
                <p className="text-muted-foreground">
                  Lower (0.3-0.5) = more focused. Higher (0.7-1.0) = more creative.
                </p>
              </div>
              <div>
                <p className="font-medium">Confidence Threshold</p>
                <p className="text-muted-foreground">
                  If AI confidence is below this %, fallback message is used.
                </p>
              </div>
              <div>
                <p className="font-medium">System Prompt</p>
                <p className="text-muted-foreground">
                  Define the AI's personality and behavior. Be specific.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Providers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>OpenAI (GPT-4, GPT-3.5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Anthropic (Claude)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Mistral AI</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>DeepSeek</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Google Gemini</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Custom Endpoint</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
