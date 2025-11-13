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

async function fixDuplicates() {
  console.log('\n=== FIXING DUPLICATE CONVERSATIONS ===\n')
  
  // The two conversations for the same customer
  const conv1 = '3e6a150b-5373-473c-9599-61078ab768ca' // 447833454000 (no +)
  const conv2 = 'd05bee4f-4bf0-411c-9be1-d0ec0fd475a4' // +447833454000 (with +)
  
  console.log('Step 1: Get conversation details...')
  
  const { data: c1 } = await supabase
    .from('conversations')
    .select('*, customer:customers(*)')
    .eq('id', conv1)
    .single()
  
  const { data: c2 } = await supabase
    .from('conversations')
    .select('*, customer:customers(*)')
    .eq('id', conv2)
    .single()
  
  console.log('\nConversation 1:', {
    id: c1.id,
    customer: c1.customer.name,
    phone: c1.customer.phone,
    customer_id: c1.customer_id
  })
  
  console.log('Conversation 2:', {
    id: c2.id,
    customer: c2.customer.name,
    phone: c2.customer.phone,
    customer_id: c2.customer_id
  })
  
  // Count messages in each
  const { data: m1 } = await supabase
    .from('messages')
    .select('id, sender')
    .eq('conversation_id', conv1)
  
  const { data: m2 } = await supabase
    .from('messages')
    .select('id, sender')
    .eq('conversation_id', conv2)
  
  console.log('\nConversation 1 messages:', m1.length, '(all staff)')
  console.log('Conversation 2 messages:', m2.length, '(customer + AI)')
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('SOLUTION: Merge conversations by moving all messages to Conv2')
  console.log('and updating customer phone to normalized format\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  console.log('Step 2: Move messages from Conv1 to Conv2...')
  
  // Move all messages from conv1 to conv2
  const { error: moveError } = await supabase
    .from('messages')
    .update({ conversation_id: conv2 })
    .eq('conversation_id', conv1)
  
  if (moveError) {
    console.error('❌ Error moving messages:', moveError)
    return
  }
  
  console.log('✅ Moved', m1.length, 'messages from Conv1 to Conv2')
  
  console.log('\nStep 3: Update customer phone to normalized format...')
  
  // Normalize phone number to +44 format
  const { error: phoneError } = await supabase
    .from('customers')
    .update({ phone: '+447833454000' })
    .eq('id', c1.customer_id)
  
  if (phoneError) {
    console.error('❌ Error updating phone:', phoneError)
    return
  }
  
  console.log('✅ Updated customer phone to +447833454000')
  
  console.log('\nStep 4: Delete empty conversation...')
  
  // Delete conv1 (now empty)
  const { error: deleteError } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conv1)
  
  if (deleteError) {
    console.error('❌ Error deleting conversation:', deleteError)
    return
  }
  
  console.log('✅ Deleted empty conversation')
  
  console.log('\nStep 5: Verify merged conversation...')
  
  const { data: finalMessages } = await supabase
    .from('messages')
    .select('id, sender, created_at')
    .eq('conversation_id', conv2)
    .order('created_at', { ascending: true })
  
  console.log('\n✅ MERGED CONVERSATION NOW HAS', finalMessages.length, 'MESSAGES:')
  
  const senderCounts = finalMessages.reduce((acc, msg) => {
    acc[msg.sender] = (acc[msg.sender] || 0) + 1
    return acc
  }, {})
  
  Object.entries(senderCounts).forEach(([sender, count]) => {
    const icon = sender === 'customer' ? '👤' : sender === 'ai' ? '🤖' : '👨‍💼'
    console.log(`  ${icon} ${sender}: ${count}`)
  })
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ SUCCESS - All messages now in one conversation!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  console.log('Next: Refresh your dashboard to see all messages')
}

fixDuplicates().catch(console.error)
