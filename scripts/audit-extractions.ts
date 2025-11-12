/**
 * AI Batch Audit Script for Staff Message Extractions
 * 
 * This script uses AI to review all extractions and flag potential errors:
 * - Wrong names (e.g., "Mrs" instead of "Smith")
 * - Missing device info
 * - Incorrect status
 * - Wrong pricing
 * 
 * Run: npx ts-node scripts/audit-extractions.ts
 */

import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiKey })

interface AuditResult {
  extractionId: string
  hasErrors: boolean
  errors: string[]
  suggestions: {
    field: string
    currentValue: any
    suggestedValue: any
    reason: string
  }[]
  confidence: number
}

async function auditExtraction(
  extraction: any,
  originalMessage: string
): Promise<AuditResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are an extraction auditor. Review extracted data from staff messages and identify errors.

COMMON ERRORS TO CHECK:
1. Name Extraction:
   - "Mrs" or "Mr" extracted as name (should be surname after title)
   - Common words extracted as names ("there", "away", "out")
   - Missing name when clearly present

2. Device Extraction:
   - Wrong device type or model
   - Missing device info when mentioned

3. Status Extraction:
   - Wrong repair status
   - Missing status when mentioned

4. Pricing Extraction:
   - Wrong price or missing price
   - Quoted vs final price confusion

OUTPUT FORMAT (JSON only):
{
  "hasErrors": true/false,
  "errors": ["Error description 1", "Error description 2"],
  "suggestions": [
    {
      "field": "customer_name",
      "currentValue": "Mrs",
      "suggestedValue": "Smith",
      "reason": "Extracted title instead of surname"
    }
  ],
  "confidence": 0.0-1.0
}

If extraction looks correct, return:
{
  "hasErrors": false,
  "errors": [],
  "suggestions": [],
  "confidence": 1.0
}`
        },
        {
          role: 'user',
          content: `Original Message: "${originalMessage}"

Extracted Data:
- Customer Name: ${extraction.customer_name || 'null'}
- Device Type: ${extraction.device_type || 'null'}
- Device Model: ${extraction.device_model || 'null'}
- Device Issue: ${extraction.device_issue || 'null'}
- Repair Status: ${extraction.repair_status || 'null'}
- Price Quoted: ${extraction.price_quoted ? `£${extraction.price_quoted}` : 'null'}
- Price Final: ${extraction.price_final ? `£${extraction.price_final}` : 'null'}
- Message Type: ${extraction.message_type || 'null'}

Review this extraction and identify any errors.`
        }
      ]
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      return {
        extractionId: extraction.id,
        hasErrors: false,
        errors: [],
        suggestions: [],
        confidence: 0
      }
    }

    const result = JSON.parse(content)
    
    return {
      extractionId: extraction.id,
      hasErrors: result.hasErrors,
      errors: result.errors || [],
      suggestions: result.suggestions || [],
      confidence: result.confidence || 0
    }
  } catch (error) {
    console.error('[Audit] Error auditing extraction:', extraction.id, error)
    return {
      extractionId: extraction.id,
      hasErrors: false,
      errors: ['Audit failed'],
      suggestions: [],
      confidence: 0
    }
  }
}

async function main() {
  console.log('🔍 Starting AI Batch Audit of Staff Message Extractions\n')

  // Fetch all extractions with messages
  const { data: extractions, error } = await supabase
    .from('staff_message_extractions')
    .select(`
      *,
      message:messages(text)
    `)
    .order('created_at', { ascending: false })
    .limit(100) // Audit last 100

  if (error) {
    console.error('❌ Failed to fetch extractions:', error)
    process.exit(1)
  }

  if (!extractions || extractions.length === 0) {
    console.log('✅ No extractions to audit')
    process.exit(0)
  }

  console.log(`📊 Auditing ${extractions.length} extractions...\n`)

  const results: AuditResult[] = []
  let processed = 0

  for (const extraction of extractions) {
    processed++
    console.log(`[${processed}/${extractions.length}] Auditing extraction ${extraction.id.substring(0, 8)}...`)

    const result = await auditExtraction(extraction, extraction.message.text)
    results.push(result)

    if (result.hasErrors) {
      console.log(`  ⚠️  ERRORS FOUND:`)
      result.errors.forEach(err => console.log(`     - ${err}`))
      if (result.suggestions.length > 0) {
        console.log(`  💡 SUGGESTIONS:`)
        result.suggestions.forEach(sug => {
          console.log(`     - ${sug.field}: "${sug.currentValue}" → "${sug.suggestedValue}"`)
          console.log(`       Reason: ${sug.reason}`)
        })
      }
    } else {
      console.log(`  ✅ Looks good`)
    }

    // Rate limiting (avoid hitting OpenAI limits)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Summary
  console.log('\n📊 AUDIT SUMMARY\n')
  console.log(`Total Audited: ${results.length}`)
  console.log(`With Errors: ${results.filter(r => r.hasErrors).length}`)
  console.log(`No Errors: ${results.filter(r => !r.hasErrors).length}`)

  // Group errors by type
  const errorsByField: Record<string, number> = {}
  results.forEach(r => {
    r.suggestions.forEach(s => {
      errorsByField[s.field] = (errorsByField[s.field] || 0) + 1
    })
  })

  if (Object.keys(errorsByField).length > 0) {
    console.log('\n🔍 ERRORS BY FIELD:')
    Object.entries(errorsByField)
      .sort(([, a], [, b]) => b - a)
      .forEach(([field, count]) => {
        console.log(`  ${field}: ${count} errors`)
      })
  }

  // Save audit results to file
  const fs = require('fs')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `audit-results-${timestamp}.json`
  
  fs.writeFileSync(
    filename,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalAudited: results.length,
      withErrors: results.filter(r => r.hasErrors).length,
      results: results.filter(r => r.hasErrors), // Only save problematic ones
    }, null, 2)
  )

  console.log(`\n💾 Detailed results saved to: ${filename}`)
  console.log('\n✅ Audit complete!')
}

main().catch(console.error)
