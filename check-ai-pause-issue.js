const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAIPause() {
  console.log('\n=== CHECKING AI PAUSE LOGIC ===\n')
  
  // Get Roger's conversation (the merged one)
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, status, customer:customers(name, phone)')
    .eq('customer_id', '7b1d111d-cbc8-407b-aabe-0b3ca120ff55')
    .single()
  
  console.log('Conversation:', conv.id)
  console.log('Customer:', conv.customer.name, conv.customer.phone)
  console.log('Status:', conv.status)
  console.log('')
  
  // Get all messages in chronological order
  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender, text, created_at')
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: true })
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('MESSAGE TIMELINE:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  let lastStaffTime = null
  
  messages.forEach((msg, i) => {
    const time = new Date(msg.created_at)
    const timeStr = time.toLocaleTimeString()
    const icon = msg.sender === 'customer' ? '👤' : msg.sender === 'ai' ? '🤖' : '👨‍💼'
    const preview = msg.text.substring(0, 80).replace(/\n/g, ' ')
    
    // Calculate time since last staff message
    let timeSinceStaff = ''
    if (msg.sender === 'staff') {
      lastStaffTime = time
    } else if (lastStaffTime) {
      const minutes = (time - lastStaffTime) / 1000 / 60
      timeSinceStaff = ` [${minutes.toFixed(1)} min after staff]`
    }
    
    console.log(`${i + 1}. ${icon} [${msg.sender.toUpperCase()}] ${timeStr}${timeSinceStaff}`)
    console.log(`   ${preview}${msg.text.length > 80 ? '...' : ''}`)
    console.log('')
  })
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('ANALYSIS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // Find instances where AI responded within 30 min of staff
  const issues = []
  lastStaffTime = null
  
  messages.forEach((msg, i) => {
    const time = new Date(msg.created_at)
    
    if (msg.sender === 'staff') {
      lastStaffTime = time
    } else if (msg.sender === 'ai' && lastStaffTime) {
      const minutes = (time - lastStaffTime) / 1000 / 60
      if (minutes < 30) {
        // Check if previous message was customer
        const prevMsg = messages[i - 1]
        if (prevMsg && prevMsg.sender === 'customer') {
          issues.push({
            aiMessageNum: i + 1,
            customerMessage: prevMsg.text.substring(0, 60),
            minutesAfterStaff: minutes.toFixed(1),
            shouldHavePaused: true
          })
        }
      }
    }
  })
  
  if (issues.length === 0) {
    console.log('✅ No issues found - AI pause logic working correctly')
  } else {
    console.log(`❌ Found ${issues.length} instances where AI should have paused:\n`)
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. Message #${issue.aiMessageNum}`)
      console.log(`   Customer said: "${issue.customerMessage}..."`)
      console.log(`   AI responded ${issue.minutesAfterStaff} min after staff`)
      console.log(`   ⚠️  Should have paused (30 min rule)`)
      console.log('')
    })
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('CONVERSATION STATUS:', conv.status)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  if (conv.status === 'auto') {
    console.log('⚠️  Conversation is in AUTO mode')
    console.log('This means AI will respond to everything')
    console.log('')
    console.log('WHY: When you manually reply, conversation should switch to MANUAL')
    console.log('Then AI only responds to simple queries (hours, location, etc.)')
    console.log('After 30 min, it auto-switches back to AUTO')
  } else if (conv.status === 'manual') {
    console.log('✅ Conversation is in MANUAL mode')
    console.log('AI should only respond to simple queries')
  }
}

checkAIPause().catch(console.error)
