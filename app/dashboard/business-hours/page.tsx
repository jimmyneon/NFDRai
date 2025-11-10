import { createClient } from '@/lib/supabase/server'
import { BusinessHoursForm } from '@/components/settings/business-hours-form'
import { PriceRangesForm } from '@/components/settings/price-ranges-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Info } from 'lucide-react'

export default async function BusinessHoursPage() {
  const supabase = await createClient()

  const { data: businessInfo } = await supabase
    .from('business_info')
    .select('*')
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Hours & Pricing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your opening hours, location, and AI price estimates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BusinessHoursForm businessInfo={businessInfo} />
          <PriceRangesForm businessInfo={businessInfo} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Real-Time Checking</p>
                <p className="text-muted-foreground">
                  The AI checks your current open/closed status in real-time for every response.
                </p>
              </div>
              <div>
                <p className="font-medium">Accurate Responses</p>
                <p className="text-muted-foreground">
                  When customers ask "are you open?", the AI uses your actual current status.
                </p>
              </div>
              <div>
                <p className="font-medium">Google Maps Fallback</p>
                <p className="text-muted-foreground">
                  AI provides your Google Maps link for holiday hours and live updates.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Time Format</p>
                <p className="text-muted-foreground">
                  Use 24-hour format (e.g., 09:00 for 9 AM, 18:00 for 6 PM)
                </p>
              </div>
              <div>
                <p className="font-medium">Closed Days</p>
                <p className="text-muted-foreground">
                  Click "Closed" to mark a day as closed, or leave times blank
                </p>
              </div>
              <div>
                <p className="font-medium">Copy to Weekdays</p>
                <p className="text-muted-foreground">
                  Set Monday's hours, then click "Copy to Weekdays" to apply to Mon-Fri
                </p>
              </div>
              <div>
                <p className="font-medium">Special Hours</p>
                <p className="text-muted-foreground">
                  Use the special hours note for holidays or temporary closures
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Example Responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-green-600">When Open:</p>
                <p className="text-muted-foreground italic">
                  "Yes, we're currently open! Our hours today are 9:00 AM - 6:00 PM."
                </p>
              </div>
              <div>
                <p className="font-medium text-red-600">When Closed:</p>
                <p className="text-muted-foreground italic">
                  "We're currently closed. We'll be open tomorrow at 9:00 AM. Check our Google Maps for live hours."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
