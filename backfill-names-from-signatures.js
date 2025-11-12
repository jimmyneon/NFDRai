/**
 * Backfill customer names from message signatures
 * Finds customers with no name and checks their messages for signatures
 * Run with: node backfill-names-from-signatures.js
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Name extraction function (same as customer-name-extractor.ts)
function extractNameFromSignature(message) {
  // Pattern 9: Email signature
  const pattern = /(?:regards|thanks|thank you|cheers|best regards|kind regards),?\s+([a-z]+)(?:\s*\.)?$/i
  const match = message.match(pattern)
  
  if (match) {
    const name = match[1].trim()
    // Don't extract staff names or common words
    if (name.toLowerCase() !== 'john' && isLikelyValidName(name)) {
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    }
  }
  
  return null
}

function isLikelyValidName(name) {
  const lowerName = name.toLowerCase()
  
  const commonWords = [
    'the', 'a', 'an', 'and', 'but', 'for', 'not', 'yes', 'sure', 'okay', 'ok',
    'thanks', 'thank', 'please', 'sorry', 'hello', 'hi', 'hey',
    'good', 'bad', 'great', 'fine', 'well', 'very', 'much', 'more',
    'just', 'only', 'also', 'even', 'still', 'back', 'here', 'there',
    'phone', 'screen', 'battery', 'repair', 'fix', 'broken', 'cracked',
  ]
  
  if (lowerName.length < 2) return false
  if (commonWords.includes(lowerName)) return false
  if (!/^[a-z]+$/i.test(lowerName)) return false
  
  return true
}

async function backfillNames() {
  console.log('🔍 Finding customers without names...\n')
  
  // Get customers with no name or "Unknown Customer"
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, phone, name')
    .or('name.is.null,name.eq.Unknown Customer')
  
  if (customersError) {
    console.error('❌ Error fetching customers:', customersError)
    return
  }
  
  console.log(`Found ${customers.length} customers without names\n`)
  
  let updated = 0
  let skipped = 0
  
  for (const customer of customers) {
    console.log(`\nChecking customer ${customer.phone}...`)
    
    // Get their messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('text, created_at')
      .eq('conversation_id', (await supabase
        .from('conversations')
        .select('id')
        .eq('customer_id', customer.id)
        .single()
      ).data?.id)
      .eq('sender', 'customer')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (messagesError || !messages || messages.length === 0) {
      console.log('  ⏭️  No messages found')
      skipped++
      continue
    }
    
    // Check each message for a signature
    let nameFound = null
    for (const message of messages) {
      nameFound = extractNameFromSignature(message.text)
      if (nameFound) {
        console.log(`  ✅ Found signature: "${message.text.substring(message.text.length - 50)}"`)
        console.log(`  📝 Extracted name: ${nameFound}`)
        break
      }
    }
    
    if (nameFound) {
      // Update customer name
      const { error: updateError } = await supabase
        .from('customers')
        .update({ name: nameFound })
        .eq('id', customer.id)
      
      if (updateError) {
        console.log(`  ❌ Error updating: ${updateError.message}`)
        skipped++
      } else {
        console.log(`  ✅ Updated customer name to: ${nameFound}`)
        updated++
      }
    } else {
      console.log('  ⏭️  No signature found in recent messages')
      skipped++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`\n📊 Results:`)
  console.log(`   ✅ Updated: ${updated}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   📝 Total: ${customers.length}`)
  
  if (updated > 0) {
    console.log('\n🎉 Names successfully backfilled!')
  }
}

backfillNames().catch(console.error)
