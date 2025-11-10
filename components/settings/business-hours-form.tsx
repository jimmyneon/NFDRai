'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Clock, MapPin, Save, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BusinessHoursFormProps {
  businessInfo: {
    id: string
    business_name: string
    google_maps_url: string | null
    timezone: string
    monday_open: string | null
    monday_close: string | null
    tuesday_open: string | null
    tuesday_close: string | null
    wednesday_open: string | null
    wednesday_close: string | null
    thursday_open: string | null
    thursday_close: string | null
    friday_open: string | null
    friday_close: string | null
    saturday_open: string | null
    saturday_close: string | null
    sunday_open: string | null
    sunday_close: string | null
    special_hours_note: string | null
  } | null
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

export function BusinessHoursForm({ businessInfo }: BusinessHoursFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Helper to format time from database (09:00:00 -> 09:00)
  const formatTime = (time: string | null | undefined) => {
    if (!time) return ''
    // If time includes seconds (09:00:00), remove them
    return time.substring(0, 5)
  }

  const [formData, setFormData] = useState({
    business_name: businessInfo?.business_name || 'New Forest Device Repairs',
    google_maps_url: businessInfo?.google_maps_url || '',
    timezone: businessInfo?.timezone || 'Europe/London',
    monday_open: formatTime(businessInfo?.monday_open),
    monday_close: formatTime(businessInfo?.monday_close),
    tuesday_open: formatTime(businessInfo?.tuesday_open),
    tuesday_close: formatTime(businessInfo?.tuesday_close),
    wednesday_open: formatTime(businessInfo?.wednesday_open),
    wednesday_close: formatTime(businessInfo?.wednesday_close),
    thursday_open: formatTime(businessInfo?.thursday_open),
    thursday_close: formatTime(businessInfo?.thursday_close),
    friday_open: formatTime(businessInfo?.friday_open),
    friday_close: formatTime(businessInfo?.friday_close),
    saturday_open: formatTime(businessInfo?.saturday_open),
    saturday_close: formatTime(businessInfo?.saturday_close),
    sunday_open: formatTime(businessInfo?.sunday_open),
    sunday_close: formatTime(businessInfo?.sunday_close),
    special_hours_note: businessInfo?.special_hours_note || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/business-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update business hours')
      }

      setSuccess(true)
      router.refresh()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business hours')
    } finally {
      setLoading(false)
    }
  }

  const handleDayChange = (day: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      [`${day}_${field}`]: value,
    }))
  }

  const setDayClosed = (day: string) => {
    setFormData(prev => ({
      ...prev,
      [`${day}_open`]: '',
      [`${day}_close`]: '',
    }))
  }

  const copyToAllWeekdays = (day: string) => {
    const openTime = formData[`${day}_open` as keyof typeof formData]
    const closeTime = formData[`${day}_close` as keyof typeof formData]
    
    setFormData(prev => ({
      ...prev,
      monday_open: openTime,
      monday_close: closeTime,
      tuesday_open: openTime,
      tuesday_close: closeTime,
      wednesday_open: openTime,
      wednesday_close: closeTime,
      thursday_open: openTime,
      thursday_close: closeTime,
      friday_open: openTime,
      friday_close: closeTime,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Business hours updated successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Basic information about your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
              placeholder="New Forest Device Repairs"
            />
          </div>

          <div>
            <Label htmlFor="google_maps_url">Google Maps URL</Label>
            <Input
              id="google_maps_url"
              value={formData.google_maps_url}
              onChange={(e) => setFormData(prev => ({ ...prev, google_maps_url: e.target.value }))}
              placeholder="https://www.google.com/maps/..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              AI will provide this link for live hours and holiday closures
            </p>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
              placeholder="Europe/London"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Use standard timezone names (e.g., Europe/London, America/New_York)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Opening Hours
          </CardTitle>
          <CardDescription>
            Set your opening and closing times for each day. Leave blank for closed days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const openValue = formData[`${day.key}_open` as keyof typeof formData] as string
            const closeValue = formData[`${day.key}_close` as keyof typeof formData] as string
            const isClosed = !openValue && !closeValue

            return (
              <div key={day.key} className="flex items-center gap-4">
                <div className="w-28 font-medium">{day.label}</div>
                
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    type="time"
                    value={openValue}
                    onChange={(e) => handleDayChange(day.key, 'open', e.target.value)}
                    className="w-32"
                    placeholder="09:00"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={closeValue}
                    onChange={(e) => handleDayChange(day.key, 'close', e.target.value)}
                    className="w-32"
                    placeholder="18:00"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDayClosed(day.key)}
                  >
                    Closed
                  </Button>
                  {day.key === 'monday' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToAllWeekdays(day.key)}
                      disabled={!openValue || !closeValue}
                    >
                      Copy to Weekdays
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Special Hours / Holiday Closure</CardTitle>
          <CardDescription>
            Build your holiday message with UK holidays or create a custom one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>UK Bank Holidays & Common Closures</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  special_hours_note: 'Closed December 25-26 for Christmas' 
                }))}
              >
                Christmas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  special_hours_note: 'Closed January 1 for New Year' 
                }))}
              >
                New Year
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  special_hours_note: 'Closed for Easter - back on [date]' 
                }))}
              >
                Easter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  special_hours_note: 'Closed for May Bank Holiday - back on [date]' 
                }))}
              >
                May Bank Holiday
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  special_hours_note: 'Closed for Spring Bank Holiday - back on [date]' 
                }))}
              >
                Spring Bank Holiday
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  special_hours_note: 'Closed for Summer Bank Holiday - back on [date]' 
                }))}
              >
                Summer Bank Holiday
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  special_hours_note: 'Closed December 23 - January 2 for Christmas holiday' 
                }))}
              >
                Extended Christmas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  special_hours_note: 'Closed for annual leave - back on [date]' 
                }))}
              >
                Annual Leave
              </Button>
            </div>
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Label className="text-base font-semibold">Custom Holiday Dates</Label>
            <p className="text-sm text-muted-foreground">
              Build your own holiday message with specific dates
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  onChange={(e) => {
                    const startDate = e.target.value
                    if (startDate) {
                      const date = new Date(startDate)
                      const formatted = date.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })
                      // Update the message with the start date
                      const currentMessage = formData.special_hours_note || 'Closed [start] for holiday'
                      const newMessage = currentMessage.includes('[start]') 
                        ? currentMessage.replace('[start]', formatted)
                        : `Closed ${formatted} for holiday`
                      setFormData(prev => ({ ...prev, special_hours_note: newMessage }))
                    }
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  onChange={(e) => {
                    const endDate = e.target.value
                    if (endDate) {
                      const date = new Date(endDate)
                      const formatted = date.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })
                      // Add end date to the message
                      const currentMessage = formData.special_hours_note || 'Closed for holiday'
                      if (currentMessage.includes(' for ')) {
                        const parts = currentMessage.split(' for ')
                        const datePart = parts[0].replace('Closed ', '')
                        const reasonPart = parts[1]
                        const newMessage = `Closed ${datePart} - ${formatted} for ${reasonPart}`
                        setFormData(prev => ({ ...prev, special_hours_note: newMessage }))
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="holiday_reason">Reason</Label>
              <Input
                id="holiday_reason"
                type="text"
                placeholder="e.g., Christmas, annual leave, bank holiday"
                onChange={(e) => {
                  const reason = e.target.value
                  if (reason) {
                    const currentMessage = formData.special_hours_note || 'Closed [dates] for holiday'
                    if (currentMessage.includes(' for ')) {
                      const parts = currentMessage.split(' for ')
                      const newMessage = `${parts[0]} for ${reason}`
                      setFormData(prev => ({ ...prev, special_hours_note: newMessage }))
                    } else {
                      setFormData(prev => ({ ...prev, special_hours_note: `Closed [dates] for ${reason}` }))
                    }
                  }
                }}
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormData(prev => ({ ...prev, special_hours_note: '' }))
                // Reset the date inputs
                const startInput = document.getElementById('start_date') as HTMLInputElement
                const endInput = document.getElementById('end_date') as HTMLInputElement
                const reasonInput = document.getElementById('holiday_reason') as HTMLInputElement
                if (startInput) startInput.value = ''
                if (endInput) endInput.value = ''
                if (reasonInput) reasonInput.value = ''
              }}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_hours_note">Holiday Message (Edit Manually)</Label>
            <Textarea
              id="special_hours_note"
              value={formData.special_hours_note}
              onChange={(e) => setFormData(prev => ({ ...prev, special_hours_note: e.target.value }))}
              placeholder="e.g., Closed December 25-26 for Christmas"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              You can also type or edit the message directly here
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Supported date formats:</strong>
              <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                <li>&quot;December 25-26&quot; - Specific date range</li>
                <li>&quot;Dec 25-26&quot; - Short month names work too</li>
                <li>&quot;December 23 - January 2&quot; - Spans multiple months</li>
                <li>&quot;Closed until January 5&quot; - Open-ended closure</li>
              </ul>
              <p className="mt-2 text-sm">
                <strong>TIP:</strong> Always include specific dates! Holiday mode will only activate on those dates.
              </p>
            </AlertDescription>
          </Alert>

          {formData.special_hours_note && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Preview:</strong> AI will lead with this message when the dates are active:
                <div className="mt-2 p-2 bg-muted rounded text-sm font-mono whitespace-pre-wrap">
                  *** HOLIDAY NOTICE ***
                  {'\n'}
                  {formData.special_hours_note}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  (No emojis - SMS doesn&apos;t support them)
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Business Hours'}
        </Button>
      </div>
    </form>
  )
}
