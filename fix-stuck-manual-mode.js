/**
 * Fix conversations stuck in manual mode
 * Resets conversations to auto mode if staff hasn't replied in 30+ minutes
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load env
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

async function fixStuckConversations() {
  console.log('🔧 Fixing conversations stuck in manual mode...\n')

  // Get all manual conversations
  const { data: manualConvos } = await supabase
    .from('conversations')
    .select(`
      id,
      status,
      updated_at,
      customer:customers(phone, name),
      messages(id, sender, created_at)
    `)
    .eq('status', 'manual')

  console.log(`Found ${manualConvos.length} conversations in manual mode\n`)

  let resetCount = 0
  let keepManualCount = 0

  for (const convo of manualConvos) {
    const phone = convo.customer?.phone || 'unknown'
    
    // Find last staff message
    const staffMessages = convo.messages
      .filter(m => m.sender === 'staff')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    const lastStaffMessage = staffMessages[0]
    
    if (!lastStaffMessage) {
      // No staff message ever - reset to auto
      console.log(`✅ ${phone.padEnd(15)} | No staff reply - resetting to AUTO`)
      await supabase
        .from('conversations')
        .update({ status: 'auto', updated_at: new Date().toISOString() })
        .eq('id', convo.id)
      resetCount++
    } else {
      // Check how long ago staff replied
      const minutesSinceStaff = (Date.now() - new Date(lastStaffMessage.created_at).getTime()) / (1000 * 60)
      
      if (minutesSinceStaff > 30) {
        // Staff replied more than 30 min ago - reset to auto
        console.log(`✅ ${phone.padEnd(15)} | Staff replied ${Math.floor(minutesSinceStaff)} min ago - resetting to AUTO`)
        await supabase
          .from('conversations')
          .update({ status: 'auto', updated_at: new Date().toISOString() })
          .eq('id', convo.id)
        resetCount++
      } else {
        // Staff replied recently - keep in manual
        console.log(`⏸️  ${phone.padEnd(15)} | Staff replied ${Math.floor(minutesSinceStaff)} min ago - keeping MANUAL`)
        keepManualCount++
      }
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Reset to AUTO: ${resetCount}`)
  console.log(`   ⏸️  Kept MANUAL: ${keepManualCount}`)
  
  // Verify
  const { data: statusCounts } = await supabase
    .from('conversations')
    .select('status')

  const counts = statusCounts.reduce((acc, conv) => {
    acc[conv.status] = (acc[conv.status] || 0) + 1
    return acc
  }, {})

  console.log(`\n📈 New Status Distribution:`)
  Object.entries(counts).forEach(([status, count]) => {
    console.log(`   - ${status}: ${count}`)
  })

  console.log('\n✅ Done!')
}

fixStuckConversations().catch(console.error)
