/**
 * Test script to check message sender roles and name extraction
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
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

async function testMessageRoles() {
  console.log('\n=== Testing Message Sender Roles ===\n')
  
  // Get recent messages with their conversations and customers
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      text,
      sender,
      created_at,
      conversation:conversations(
        id,
        channel,
        customer:customers(
          name,
          phone
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('Error fetching messages:', error)
    return
  }
  
  console.log(`Found ${messages.length} recent messages:\n`)
  
  for (const msg of messages) {
    const customerName = msg.conversation?.customer?.name || 'Unknown'
    const phone = msg.conversation?.customer?.phone || 'Unknown'
    const preview = msg.text.substring(0, 80).replace(/\n/g, ' ')
    
    // Check if message contains signature
    const hasAISteve = msg.text.toLowerCase().includes('ai steve')
    const hasJohn = msg.text.toLowerCase().includes('many thanks, john') || 
                    msg.text.toLowerCase().includes('many thenks, john')
    
    let expectedSender = msg.sender
    if (hasAISteve) {
      expectedSender = 'ai'
    } else if (hasJohn) {
      expectedSender = 'staff'
    }
    
    const isCorrect = msg.sender === expectedSender
    const status = isCorrect ? '✅' : '❌'
    
    console.log(`${status} [${msg.sender}] ${customerName} (${phone})`)
    console.log(`   Text: "${preview}..."`)
    console.log(`   Has AI Steve: ${hasAISteve}, Has John: ${hasJohn}`)
    console.log(`   Expected: ${expectedSender}, Actual: ${msg.sender}`)
    console.log(`   Time: ${new Date(msg.created_at).toLocaleString()}`)
    console.log()
  }
}

async function testNameExtraction() {
  console.log('\n=== Testing Customer Name Extraction ===\n')
  
  // Get customers with their most recent message
  const { data: customers, error } = await supabase
    .from('customers')
    .select(`
      id,
      name,
      phone,
      conversations(
        id,
        messages(
          text,
          sender,
          created_at
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error fetching customers:', error)
    return
  }
  
  console.log(`Found ${customers.length} recent customers:\n`)
  
  for (const customer of customers) {
    console.log(`Customer: ${customer.name || 'NO NAME'} (${customer.phone})`)
    
    // Get first customer message
    const firstCustomerMsg = customer.conversations?.[0]?.messages
      ?.filter(m => m.sender === 'customer')
      ?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())?.[0]
    
    if (firstCustomerMsg) {
      const preview = firstCustomerMsg.text.substring(0, 100).replace(/\n/g, ' ')
      console.log(`   First message: "${preview}..."`)
      
      // Check for name patterns
      const patterns = [
        /(?:hi|hello|hey),?\s+i'?m\s+([a-z]+)/i,
        /my\s+name(?:'s|\s+is)\s+([a-z]+)/i,
        /^this\s+is\s+([a-z]+)/i,
        /it'?s\s+([a-z]+)(?:\s+here)?/i,
        /^([a-z]+)\s+here/i,
        /i\s+am\s+([a-z]+)/i,
      ]
      
      let foundName = null
      for (const pattern of patterns) {
        const match = firstCustomerMsg.text.match(pattern)
        if (match) {
          foundName = match[1]
          break
        }
      }
      
      if (foundName) {
        const isCorrect = customer.name?.toLowerCase() === foundName.toLowerCase()
        const status = isCorrect ? '✅' : '⚠️'
        console.log(`   ${status} Found name in message: "${foundName}"`)
        console.log(`   Stored name: "${customer.name}"`)
      } else {
        console.log(`   ⚠️  No name pattern found in first message`)
      }
    } else {
      console.log(`   No customer messages found`)
    }
    console.log()
  }
}

async function main() {
  await testMessageRoles()
  await testNameExtraction()
  process.exit(0)
}

main()
