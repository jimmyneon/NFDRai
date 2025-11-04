import { createClient } from '@/lib/supabase/server'

interface LogApiCallParams {
  endpoint: string
  method: string
  statusCode: number
  requestBody?: any
  responseBody?: any
  error?: string
  ipAddress?: string
  userAgent?: string
  startTime?: number
}

export async function logApiCall({
  endpoint,
  method,
  statusCode,
  requestBody,
  responseBody,
  error,
  ipAddress,
  userAgent,
  startTime,
}: LogApiCallParams) {
  try {
    const supabase = await createClient()
    
    const durationMs = startTime ? Date.now() - startTime : null

    await supabase.from('api_logs').insert({
      endpoint,
      method,
      status_code: statusCode,
      request_body: requestBody || null,
      response_body: responseBody || null,
      error: error || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      duration_ms: durationMs,
    })
  } catch (err) {
    // Don't throw - logging failures shouldn't break the API
    console.error('Failed to log API call:', err)
  }
}

// Helper to wrap API routes with logging
export function withApiLogging(
  handler: (req: Request) => Promise<Response>,
  endpoint: string
) {
  return async (req: Request) => {
    const startTime = Date.now()
    let requestBody: any = null
    let statusCode = 200
    let responseBody: any = null
    let error: string | undefined

    try {
      // Try to parse request body
      try {
        const clonedReq = req.clone()
        requestBody = await clonedReq.json()
      } catch {
        // Body might not be JSON or already consumed
      }

      // Call the actual handler
      const response = await handler(req)
      statusCode = response.status

      // Try to parse response body
      try {
        const clonedRes = response.clone()
        responseBody = await clonedRes.json()
      } catch {
        // Response might not be JSON
      }

      // Log the call
      await logApiCall({
        endpoint,
        method: req.method,
        statusCode,
        requestBody,
        responseBody,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        startTime,
      })

      return response
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      statusCode = 500

      // Log the error
      await logApiCall({
        endpoint,
        method: req.method,
        statusCode,
        requestBody,
        error,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        startTime,
      })

      throw err
    }
  }
}
