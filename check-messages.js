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

async function checkMessages() {
  console.log('\n=== CHECKING RECENT MESSAGES ===\n')
  
  // Get ALL recent conversations
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, customer:customers(name, phone), updated_at')
    .order('updated_at', { ascending: false })
    .limit(5)
  
  if (!convs || convs.length === 0) {
    console.log('No conversations found')
    return
  }
  
  console.log(`Found ${convs.length} recent conversations:\n`)
  
  for (const conv of convs) {
    const time = new Date(conv.updated_at).toLocaleTimeString()
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`Conversation: ${conv.id}`)
    console.log(`Customer: ${conv.customer?.name || 'Unknown'} (${conv.customer?.phone})`)
    console.log(`Last updated: ${time}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    // Get messages for this conversation
    const { data: messages } = await supabase
      .from('messages')
      .select('id, sender, text, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (!messages || messages.length === 0) {
      console.log('  No messages found\n')
      continue
    }
    
    console.log(`  ${messages.length} messages:\n`)
    
    messages.reverse().forEach((msg, i) => {
      const time = new Date(msg.created_at).toLocaleTimeString()
      const preview = msg.text.substring(0, 100).replace(/\n/g, ' ')
      const icon = msg.sender === 'customer' ? '👤' : msg.sender === 'ai' ? '🤖' : '👨‍💼'
      console.log(`  ${i + 1}. ${icon} [${msg.sender.toUpperCase()}] ${time}`)
      console.log(`     ${preview}${msg.text.length > 100 ? '...' : ''}`)
      console.log('')
    })
    
    // Check for sender distribution
    const senderCounts = messages.reduce((acc, msg) => {
      acc[msg.sender] = (acc[msg.sender] || 0) + 1
      return acc
    }, {})
    
    console.log('  Distribution:')
    Object.entries(senderCounts).forEach(([sender, count]) => {
      console.log(`    ${sender}: ${count}`)
    })
  }
}

checkMessages().catch(console.error)
