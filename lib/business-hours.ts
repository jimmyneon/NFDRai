import { createClient } from '@/lib/supabase/server'

interface BusinessInfo {
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
}

interface BusinessHoursStatus {
  isOpen: boolean
  currentTime: string
  todayHours: string
  nextOpenTime: string | null
  formattedSchedule: string
  googleMapsUrl: string | null
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

/**
 * Get current business hours status with real-time checking
 */
export async function getBusinessHoursStatus(): Promise<BusinessHoursStatus> {
  const supabase = await createClient()
  
  // Get business info
  const { data: businessInfo, error } = await supabase
    .from('business_info')
    .select('*')
    .single()

  if (error || !businessInfo) {
    // Fallback to default hours if no data
    return {
      isOpen: false,
      currentTime: new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      }),
      todayHours: 'Hours not configured',
      nextOpenTime: null,
      formattedSchedule: getDefaultSchedule(),
      googleMapsUrl: null
    }
  }

  const info = businessInfo as BusinessInfo
  
  // Get current time in business timezone
  const now = new Date()
  const currentTime = now.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: info.timezone
  })
  
  // Get current day (0 = Sunday, 6 = Saturday)
  const currentDay = new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    timeZone: info.timezone 
  }).toLowerCase() as typeof DAYS[number]
  
  const currentDayIndex = DAYS.indexOf(currentDay)
  
  // Get today's hours
  const openKey = `${currentDay}_open` as keyof BusinessInfo
  const closeKey = `${currentDay}_close` as keyof BusinessInfo
  const todayOpen = info[openKey] as string | null
  const todayClose = info[closeKey] as string | null
  
  let isOpen = false
  let todayHours = 'Closed'
  
  if (todayOpen && todayClose) {
    todayHours = `${formatTime(todayOpen)} - ${formatTime(todayClose)}`
    
    // Check if currently open
    const currentMinutes = timeToMinutes(currentTime)
    const openMinutes = timeToMinutes(todayOpen)
    const closeMinutes = timeToMinutes(todayClose)
    
    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes
  }
  
  // Find next opening time if closed
  let nextOpenTime: string | null = null
  if (!isOpen) {
    nextOpenTime = findNextOpenTime(info, currentDayIndex, currentTime)
  }
  
  // Format full schedule
  const formattedSchedule = formatFullSchedule(info)
  
  return {
    isOpen,
    currentTime,
    todayHours,
    nextOpenTime,
    formattedSchedule,
    googleMapsUrl: info.google_maps_url
  }
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Format time from 24h to 12h format
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Find the next time the business will open
 */
function findNextOpenTime(info: BusinessInfo, currentDayIndex: number, currentTime: string): string | null {
  const currentMinutes = timeToMinutes(currentTime)
  
  // Check remaining days in the week
  for (let i = 0; i < 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7
    const day = DAYS[dayIndex]
    const openKey = `${day}_open` as keyof BusinessInfo
    const openTime = info[openKey] as string | null
    
    if (openTime) {
      // If same day, check if opening time is later today
      if (i === 0) {
        const openMinutes = timeToMinutes(openTime)
        if (openMinutes > currentMinutes) {
          return `Today at ${formatTime(openTime)}`
        }
      } else {
        // Different day
        const dayName = DAY_NAMES[dayIndex]
        return `${dayName} at ${formatTime(openTime)}`
      }
    }
  }
  
  return null
}

/**
 * Format the full weekly schedule
 */
function formatFullSchedule(info: BusinessInfo): string {
  const schedule: string[] = []
  
  for (let i = 0; i < 7; i++) {
    const day = DAYS[i]
    const dayName = DAY_NAMES[i]
    const openKey = `${day}_open` as keyof BusinessInfo
    const closeKey = `${day}_close` as keyof BusinessInfo
    const openTime = info[openKey] as string | null
    const closeTime = info[closeKey] as string | null
    
    if (openTime && closeTime) {
      schedule.push(`${dayName}: ${formatTime(openTime)} - ${formatTime(closeTime)}`)
    } else {
      schedule.push(`${dayName}: Closed`)
    }
  }
  
  if (info.special_hours_note) {
    schedule.push(`\nNote: ${info.special_hours_note}`)
  }
  
  return schedule.join('\n')
}

/**
 * Get default schedule fallback
 */
function getDefaultSchedule(): string {
  return `Monday-Friday: 9:00 AM - 6:00 PM
Saturday: 10:00 AM - 4:00 PM
Sunday: Closed`
}

/**
 * Generate a formatted message about business hours for AI responses
 */
export function formatBusinessHoursMessage(status: BusinessHoursStatus): string {
  let message = `**Current Status:** ${status.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}\n`
  message += `**Current Time:** ${status.currentTime}\n`
  message += `**Today's Hours:** ${status.todayHours}\n`
  
  if (!status.isOpen && status.nextOpenTime) {
    message += `**Next Open:** ${status.nextOpenTime}\n`
  }
  
  message += `\n**Full Schedule:**\n${status.formattedSchedule}`
  
  if (status.googleMapsUrl) {
    message += `\n\n**Live Hours:** Check our [Google Maps listing](${status.googleMapsUrl}) for real-time updates and holiday hours.`
  }
  
  return message
}
