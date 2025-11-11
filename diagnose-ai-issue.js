/**
 * Diagnostic script to check why AI isn't responding
 * Run: node diagnose-ai-issue.js
 */

const { createClient } = require('@supabase/supabase-js')

// Load from .env.local manually
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnose() {
  console.log('🔍 Diagnosing AI Response Issues...\n')

  // 1. Check conversation statuses
  console.log('1️⃣ Checking conversation statuses:')
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, status, channel, customer:customers(name, phone)')
    .order('created_at', { ascending: false })
    .limit(10)

  if (convError) {
    console.error('❌ Error fetching conversations:', convError)
    return
  }

  console.log(`   Found ${conversations.length} recent conversations:\n`)
  conversations.forEach(conv => {
    const statusEmoji = conv.status === 'blocked' ? '🚫' : conv.status === 'auto' ? '🤖' : '👨‍💼'
    console.log(`   ${statusEmoji} ${conv.status.toUpperCase().padEnd(8)} | ${conv.customer?.phone || 'Unknown'} | ${conv.customer?.name || 'No name'}`)
  })

  // Count by status
  const { data: statusCounts } = await supabase
    .from('conversations')
    .select('status')

  const counts = statusCounts.reduce((acc, conv) => {
    acc[conv.status] = (acc[conv.status] || 0) + 1
    return acc
  }, {})

  console.log('\n   Status Summary:')
  Object.entries(counts).forEach(([status, count]) => {
    console.log(`   - ${status}: ${count}`)
  })

  // 2. Check for blocked conversations
  console.log('\n2️⃣ Checking blocked conversations:')
  const { data: blocked } = await supabase
    .from('conversations')
    .select('id, customer:customers(phone, name)')
    .eq('status', 'blocked')

  if (blocked && blocked.length > 0) {
    console.log(`   ⚠️  Found ${blocked.length} blocked conversation(s):`)
    blocked.forEach(conv => {
      console.log(`   - ${conv.customer?.phone || 'Unknown'} (${conv.customer?.name || 'No name'})`)
    })
  } else {
    console.log('   ✅ No blocked conversations found')
  }

  // 3. Check AI settings
  console.log('\n3️⃣ Checking AI settings:')
  const { data: aiSettings } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('active', true)
    .single()

  if (aiSettings) {
    console.log(`   ✅ Active AI settings found:`)
    console.log(`   - Provider: ${aiSettings.provider}`)
    console.log(`   - Model: ${aiSettings.model}`)
    console.log(`   - API Key: ${aiSettings.api_key ? '✅ Set' : '❌ Missing'}`)
  } else {
    console.log('   ❌ No active AI settings found!')
  }

  // 4. Check recent messages
  console.log('\n4️⃣ Checking recent messages:')
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('id, sender, created_at, conversation:conversations(status, customer:customers(phone))')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('   Last 10 messages:')
  recentMessages.forEach(msg => {
    const senderEmoji = msg.sender === 'customer' ? '👤' : msg.sender === 'ai' ? '🤖' : '👨‍💼'
    const time = new Date(msg.created_at).toLocaleString()
    const status = msg.conversation?.status || 'unknown'
    console.log(`   ${senderEmoji} ${msg.sender.padEnd(8)} | ${status.padEnd(8)} | ${time}`)
  })

  // 5. Check for customer name extraction issues
  console.log('\n5️⃣ Checking customer name extraction:')
  const { data: customersWithoutNames } = await supabase
    .from('customers')
    .select('id, phone, name, created_at')
    .is('name', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (customersWithoutNames && customersWithoutNames.length > 0) {
    console.log(`   ⚠️  Found ${customersWithoutNames.length} customers without names:`)
    customersWithoutNames.forEach(cust => {
      console.log(`   - ${cust.phone} (created ${new Date(cust.created_at).toLocaleDateString()})`)
    })
  } else {
    console.log('   ✅ All recent customers have names')
  }

  // 6. Recommendations
  console.log('\n📋 Recommendations:')
  
  if (blocked && blocked.length > 0) {
    console.log('   ⚠️  You have blocked conversations. To unblock:')
    console.log('      1. Open the conversation in the dashboard')
    console.log('      2. Click "Unblock AI" button')
  }
  
  if (!aiSettings || !aiSettings.api_key) {
    console.log('   ❌ AI settings missing or incomplete!')
    console.log('      1. Go to Settings → AI Configuration')
    console.log('      2. Add your OpenAI API key')
    console.log('      3. Set it as active')
  }

  const autoCount = counts['auto'] || 0
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0)
  if (autoCount === 0 && totalCount > 0) {
    console.log('   ⚠️  No conversations in auto mode!')
    console.log('      - All conversations are in manual or blocked mode')
    console.log('      - Click "Resume Auto Mode" to enable AI responses')
  }

  console.log('\n✅ Diagnosis complete!')
}

diagnose().catch(console.error)
