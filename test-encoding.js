#!/usr/bin/env node

/**
 * Test script for UTF-8 encoding in API routes
 * Tests special characters like £, German umlauts, and multi-paragraph messages
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const testMessages = [
  {
    name: 'Pound sign (£)',
    message: 'The repair will cost £50 for parts and £25 for labour.',
    from: '+447700900000',
    channel: 'sms'
  },
  {
    name: 'German umlauts',
    message: 'Guten Tag! Ihr Gerät ist fertig. Grüße aus München.',
    from: '+447700900001',
    channel: 'sms'
  },
  {
    name: 'French accents',
    message: 'Bonjour! Votre appareil est prêt. À bientôt!',
    from: '+447700900002',
    channel: 'sms'
  },
  {
    name: 'Spanish characters',
    message: '¡Hola! Tu dispositivo está listo. ¿Cuándo puedes recogerlo?',
    from: '+447700900003',
    channel: 'sms'
  },
  {
    name: 'Multi-paragraph message',
    message: `Hi John,

I have a few questions about my phone repair:

1. When will it be ready?
2. How much will it cost?
3. Do you have a warranty?

Thanks for your help!

Best regards,
Sarah`,
    from: '+447700900004',
    channel: 'sms'
  },
  {
    name: 'Mixed special characters',
    message: 'Price: £50 • Status: ✓ Ready • Contact: 📞 07700900000',
    from: '+447700900005',
    channel: 'sms'
  },
  {
    name: 'Emoji test',
    message: 'Your phone is ready! 📱✨ Come pick it up! 😊',
    from: '+447700900006',
    channel: 'sms'
  }
]

async function testIncomingMessage(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`)
  console.log(`📝 Message: ${testCase.message.substring(0, 50)}...`)
  
  try {
    const response = await fetch(`${BASE_URL}/api/messages/incoming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        from: testCase.from,
        message: testCase.message,
        channel: testCase.channel,
      }),
    })

    const contentType = response.headers.get('content-type')
    console.log(`📋 Response Content-Type: ${contentType}`)
    
    if (!contentType || !contentType.includes('charset=utf-8')) {
      console.log('⚠️  WARNING: Response missing UTF-8 charset!')
    }

    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ Success: ${data.mode || 'processed'}`)
    } else {
      console.log(`❌ Failed: ${data.error}`)
    }
    
    return { success: response.ok, data }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testSendMessage(testCase) {
  console.log(`\n🧪 Testing send: ${testCase.name}`)
  console.log(`📝 Message: ${testCase.message.substring(0, 50)}...`)
  
  try {
    const response = await fetch(`${BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        conversationId: 'lookup-by-phone',
        customerPhone: testCase.from,
        text: testCase.message,
        sender: 'staff',
        trackOnly: true,
      }),
    })

    const contentType = response.headers.get('content-type')
    console.log(`📋 Response Content-Type: ${contentType}`)
    
    if (!contentType || !contentType.includes('charset=utf-8')) {
      console.log('⚠️  WARNING: Response missing UTF-8 charset!')
    }

    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ Success: Message saved`)
    } else {
      console.log(`❌ Failed: ${data.error}`)
    }
    
    return { success: response.ok, data }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 Starting UTF-8 Encoding Tests')
  console.log(`🌐 Base URL: ${BASE_URL}`)
  console.log('=' .repeat(60))

  let passedIncoming = 0
  let failedIncoming = 0
  let passedSend = 0
  let failedSend = 0

  console.log('\n📥 TESTING INCOMING MESSAGES')
  console.log('=' .repeat(60))
  
  for (const testCase of testMessages) {
    const result = await testIncomingMessage(testCase)
    if (result.success) {
      passedIncoming++
    } else {
      failedIncoming++
    }
    await new Promise(resolve => setTimeout(resolve, 500)) // Rate limiting
  }

  console.log('\n📤 TESTING SEND MESSAGES')
  console.log('=' .repeat(60))
  
  for (const testCase of testMessages) {
    const result = await testSendMessage(testCase)
    if (result.success) {
      passedSend++
    } else {
      failedSend++
    }
    await new Promise(resolve => setTimeout(resolve, 500)) // Rate limiting
  }

  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST RESULTS')
  console.log('=' .repeat(60))
  console.log(`📥 Incoming: ${passedIncoming} passed, ${failedIncoming} failed`)
  console.log(`📤 Send: ${passedSend} passed, ${failedSend} failed`)
  console.log(`🎯 Total: ${passedIncoming + passedSend} passed, ${failedIncoming + failedSend} failed`)
  
  if (failedIncoming + failedSend === 0) {
    console.log('\n✨ All tests passed! UTF-8 encoding is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.')
  }
}

// Run tests
runTests().catch(console.error)
