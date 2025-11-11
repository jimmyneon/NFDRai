/**
 * Check recent message activity and AI response patterns
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load env vars
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

async function checkActivity() {
  console.log('🔍 Checking Recent Message Activity...\n')

  // Get messages from today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: todayMessages } = await supabase
    .from('messages')
    .select(`
      id,
      text,
      sender,
      created_at,
      conversation:conversations(
        id,
        status,
        customer:customers(phone, name)
      )
    `)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  console.log('📨 Messages from today:\n')
  
  let customerMessages = 0
  let aiMessages = 0
  let staffMessages = 0
  
  todayMessages.forEach(msg => {
    const time = new Date(msg.created_at).toLocaleTimeString()
    const senderEmoji = msg.sender === 'customer' ? '👤' : msg.sender === 'ai' ? '🤖' : '👨‍💼'
    const status = msg.conversation?.status || 'unknown'
    const phone = msg.conversation?.customer?.phone || 'unknown'
    const preview = msg.text.substring(0, 50)
    
    console.log(`${senderEmoji} ${time} | ${status.padEnd(8)} | ${phone.padEnd(15)} | ${preview}...`)
    
    if (msg.sender === 'customer') customerMessages++
    if (msg.sender === 'ai') aiMessages++
    if (msg.sender === 'staff') staffMessages++
  })

  console.log(`\n📊 Today's Summary:`)
  console.log(`   👤 Customer messages: ${customerMessages}`)
  console.log(`   🤖 AI messages: ${aiMessages}`)
  console.log(`   👨‍💼 Staff messages: ${staffMessages}`)

  // Check for unanswered customer messages in auto mode
  console.log('\n⚠️  Checking for unanswered customer messages in AUTO mode:\n')
  
  const { data: autoConversations } = await supabase
    .from('conversations')
    .select(`
      id,
      status,
      customer:customers(phone, name),
      messages(id, sender, text, created_at)
    `)
    .eq('status', 'auto')
    .order('updated_at', { ascending: false })
    .limit(10)

  let unansweredCount = 0
  
  autoConversations.forEach(conv => {
    // Sort messages by time
    const sortedMessages = conv.messages.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    const lastMessage = sortedMessages[0]
    
    if (lastMessage && lastMessage.sender === 'customer') {
      unansweredCount++
      const time = new Date(lastMessage.created_at).toLocaleTimeString()
      const phone = conv.customer?.phone || 'unknown'
      const preview = lastMessage.text.substring(0, 40)
      
      console.log(`   ⚠️  ${phone.padEnd(15)} | Last: ${time} | "${preview}..."`)
    }
  })

  if (unansweredCount === 0) {
    console.log('   ✅ No unanswered customer messages in auto mode')
  } else {
    console.log(`\n   ⚠️  Found ${unansweredCount} unanswered customer message(s) in AUTO mode!`)
    console.log('   This suggests AI is not responding automatically.')
  }

  // Check API logs for incoming message errors
  console.log('\n🔍 Checking API logs (if available)...\n')
  
  const { data: apiLogs } = await supabase
    .from('api_logs')
    .select('*')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  if (apiLogs && apiLogs.length > 0) {
    console.log('   Recent API calls:')
    apiLogs.forEach(log => {
      const time = new Date(log.created_at).toLocaleTimeString()
      const status = log.status_code || 'unknown'
      console.log(`   ${time} | ${log.endpoint} | Status: ${status}`)
    })
  } else {
    console.log('   ℹ️  No API logs found (table may not exist)')
  }

  console.log('\n✅ Analysis complete!')
}

checkActivity().catch(console.error)
