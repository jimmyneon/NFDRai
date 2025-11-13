// Test script to check if incoming webhook is working
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

async function testIncoming() {
  console.log('\n=== TESTING INCOMING MESSAGE WEBHOOK ===\n')
  
  const testMessage = {
    from: '447833454000',
    message: 'Test message from customer',
    channel: 'sms'
  }
  
  console.log('Sending test message:', testMessage)
  console.log('')
  
  try {
    const response = await fetch('http://localhost:3000/api/messages/incoming', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    })
    
    const data = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('\n✅ SUCCESS - Message processed')
      console.log('Mode:', data.mode)
      console.log('Reason:', data.message || data.reason)
    } else {
      console.log('\n❌ FAILED')
      console.log('Error:', data.error)
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
  }
}

testIncoming()
