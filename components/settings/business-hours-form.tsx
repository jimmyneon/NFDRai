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
          <CardTitle>Special Hours Note</CardTitle>
          <CardDescription>
            Add notes about holiday hours or temporary closures (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.special_hours_note}
            onChange={(e) => setFormData(prev => ({ ...prev, special_hours_note: e.target.value }))}
            placeholder="e.g., Closed December 25-26 for Christmas"
            rows={3}
          />
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
