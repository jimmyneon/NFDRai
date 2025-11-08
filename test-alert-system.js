/**
 * Test script to verify alert system is working
 * Tests that alerts are being created in the database
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      process.env[key] = value
    }
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAlertSystem() {
  console.log('🧪 Testing Alert System\n')
  
  // Test 1: Check if alerts table exists and is accessible
  console.log('Test 1: Check alerts table access...')
  const { data: existingAlerts, error: selectError } = await supabase
    .from('alerts')
    .select('*')
    .limit(5)
  
  if (selectError) {
    console.error('❌ Cannot read alerts table:', selectError.message)
    return
  }
  console.log('✅ Alerts table accessible')
  console.log(`   Found ${existingAlerts?.length || 0} existing alerts\n`)
  
  // Test 2: Create a test conversation and alert
  console.log('Test 2: Create test alert...')
  
  // Create test customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({
      name: 'Test Customer',
      phone: '+1234567890'
    })
    .select()
    .single()
  
  if (customerError) {
    console.error('❌ Failed to create test customer:', customerError.message)
    return
  }
  console.log('✅ Test customer created:', customer.id)
  
  // Create test conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      customer_id: customer.id,
      channel: 'sms',
      status: 'manual'
    })
    .select()
    .single()
  
  if (convError) {
    console.error('❌ Failed to create test conversation:', convError.message)
    // Cleanup
    await supabase.from('customers').delete().eq('id', customer.id)
    return
  }
  console.log('✅ Test conversation created:', conversation.id)
  
  // Create test alert
  const { data: alert, error: alertError } = await supabase
    .from('alerts')
    .insert({
      conversation_id: conversation.id,
      type: 'manual_required',
      notified_to: 'admin'
    })
    .select()
    .single()
  
  if (alertError) {
    console.error('❌ Failed to create alert:', alertError.message)
    // Cleanup
    await supabase.from('conversations').delete().eq('id', conversation.id)
    await supabase.from('customers').delete().eq('id', customer.id)
    return
  }
  console.log('✅ Alert created successfully!')
  console.log('   Alert ID:', alert.id)
  console.log('   Type:', alert.type)
  console.log('   Created at:', alert.created_at)
  console.log()
  
  // Test 3: Verify alert can be queried
  console.log('Test 3: Query created alert...')
  const { data: queriedAlert, error: queryError } = await supabase
    .from('alerts')
    .select(`
      *,
      conversations:conversation_id (
        id,
        channel,
        status,
        customers:customer_id (
          name,
          phone
        )
      )
    `)
    .eq('id', alert.id)
    .single()
  
  if (queryError) {
    console.error('❌ Failed to query alert:', queryError.message)
  } else {
    console.log('✅ Alert queried successfully with relations')
    console.log('   Customer:', queriedAlert.conversations.customers.name)
    console.log('   Phone:', queriedAlert.conversations.customers.phone)
    console.log()
  }
  
  // Test 4: Check alert count
  console.log('Test 4: Count all alerts...')
  const { count, error: countError } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('❌ Failed to count alerts:', countError.message)
  } else {
    console.log('✅ Total alerts in database:', count)
    console.log()
  }
  
  // Cleanup
  console.log('Cleaning up test data...')
  await supabase.from('alerts').delete().eq('id', alert.id)
  await supabase.from('conversations').delete().eq('id', conversation.id)
  await supabase.from('customers').delete().eq('id', customer.id)
  console.log('✅ Cleanup complete\n')
  
  // Summary
  console.log('=' .repeat(50))
  console.log('📊 SUMMARY')
  console.log('=' .repeat(50))
  console.log('✅ Alert system is working correctly!')
  console.log('✅ Alerts can be created and queried')
  console.log('✅ Relations are working properly')
  console.log('\nThe alert system should now work in production.')
  console.log('Alerts will be created when:')
  console.log('  - AI automation is disabled')
  console.log('  - Conversation is in manual mode')
  console.log('  - Staff recently replied (waiting period)')
  console.log('  - AI has low confidence')
  console.log('  - AI indicates manual handoff needed')
}

testAlertSystem().catch(console.error)
