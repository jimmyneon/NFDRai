/**
 * Run database cleanup scripts
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

async function fixMessageSenders() {
  console.log('\n=== Fixing Message Senders ===\n')
  
  // Count incorrect AI messages
  const { count: aiCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender', 'customer')
    .ilike('text', '%ai steve%')
  
  console.log(`Found ${aiCount} messages with AI Steve signature marked as customer`)
  
  // Fix AI messages
  const { error: aiError } = await supabase
    .from('messages')
    .update({ sender: 'ai' })
    .eq('sender', 'customer')
    .ilike('text', '%ai steve%')
  
  if (aiError) {
    console.error('Error fixing AI messages:', aiError)
  } else {
    console.log(`✅ Fixed ${aiCount} AI messages`)
  }
  
  // Count incorrect John messages (check both patterns separately)
  const { data: johnMessages } = await supabase
    .from('messages')
    .select('id')
    .eq('sender', 'customer')
    .or('text.ilike.%many thanks, john%,text.ilike.%many thenks, john%')
  
  const johnCount = johnMessages?.length || 0
  console.log(`Found ${johnCount} messages with John signature marked as customer`)
  
  if (johnCount > 0) {
    // Fix John messages
    const { error: johnError } = await supabase
      .from('messages')
      .update({ sender: 'staff' })
      .eq('sender', 'customer')
      .or('text.ilike.%many thanks, john%,text.ilike.%many thenks, john%')
    
    if (johnError) {
      console.error('Error fixing John messages:', johnError)
    } else {
      console.log(`✅ Fixed ${johnCount} staff messages`)
    }
  } else {
    console.log('✅ No John messages to fix')
  }
  
  // Show summary
  const { data: summary } = await supabase
    .from('messages')
    .select('sender')
  
  const counts = summary.reduce((acc, msg) => {
    acc[msg.sender] = (acc[msg.sender] || 0) + 1
    return acc
  }, {})
  
  console.log('\nMessage counts by sender:')
  console.log(counts)
}

async function fixCustomerNames() {
  console.log('\n=== Fixing Customer Names ===\n')
  
  const invalidNames = [
    // Titles and honorifics
    'Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Sir', 'Madam',
    // Common words
    'Bad', 'Just', 'Changing', 'Learning', 'Doing', 'Getting', 'Having', 'Being',
    'Going', 'Coming', 'Looking', 'Trying', 'Making', 'Taking', 'Giving',
    'Telling', 'Asking', 'Calling', 'Texting', 'Messaging', 'Sending',
    'About', 'After', 'Before', 'During', 'Between', 'Through', 'Into',
    'From', 'With', 'Without', 'Under', 'Over', 'Above', 'Below',
    'The', 'A', 'An', 'And', 'But', 'For', 'Not', 'Yes', 'Sure', 'Okay', 'Ok',
    'Thanks', 'Thank', 'Please', 'Sorry', 'Hello', 'Hi', 'Hey',
    'Good', 'Great', 'Fine', 'Well', 'Very', 'Much', 'More',
    'Only', 'Also', 'Even', 'Still', 'Back', 'Here', 'There',
    'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Which',
    'Who', 'Why', 'How', 'Can', 'Could', 'Would', 'Should', 'Will',
    'Phone', 'Screen', 'Battery', 'Repair', 'Fix', 'Broken', 'Cracked', 'Lol',
    // Device-related
    'Iphone', 'Samsung', 'Galaxy', 'Ipad', 'Macbook', 'Laptop', 'Device',
    // Random words that might get extracted
    'Ready', 'Quote', 'Price', 'Cost', 'Fixed', 'Done', 'Finished'
  ]
  
  // Find customers with invalid names (case-insensitive)
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, name, phone')
    .not('name', 'is', null)
  
  const invalidCustomers = allCustomers?.filter(c => {
    if (!c.name) return false
    
    // Check against invalid names list (case-insensitive)
    if (invalidNames.some(invalid => invalid.toLowerCase() === c.name.toLowerCase())) {
      return true
    }
    
    // Check for single letters
    if (c.name.length === 1) {
      return true
    }
    
    // Check for numbers in name
    if (/\d/.test(c.name)) {
      return true
    }
    
    // Check for special characters (except spaces, hyphens, apostrophes)
    if (/[^a-zA-Z\s\-']/.test(c.name)) {
      return true
    }
    
    return false
  }) || []
  
  console.log(`Found ${invalidCustomers.length} customers with invalid names:`)
  invalidCustomers.forEach(c => {
    console.log(`  - "${c.name}" (${c.phone})`)
  })
  
  if (invalidCustomers.length === 0) {
    console.log('✅ No invalid names found!')
    return
  }
  
  // Clear invalid names
  const invalidIds = invalidCustomers.map(c => c.id)
  const { error } = await supabase
    .from('customers')
    .update({ name: null })
    .in('id', invalidIds)
  
  if (error) {
    console.error('Error fixing customer names:', error)
  } else {
    console.log(`\n✅ Cleared ${invalidCustomers.length} invalid names`)
  }
  
  // Show summary
  const { data: updatedCustomers } = await supabase
    .from('customers')
    .select('name')
  
  const withName = updatedCustomers?.filter(c => c.name).length || 0
  const withoutName = updatedCustomers?.filter(c => !c.name).length || 0
  
  console.log('\nCustomer name summary:')
  console.log(`  With name: ${withName}`)
  console.log(`  Without name: ${withoutName}`)
}

async function main() {
  try {
    await fixMessageSenders()
    await fixCustomerNames()
    console.log('\n✅ All cleanup complete!\n')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
  process.exit(0)
}

main()
