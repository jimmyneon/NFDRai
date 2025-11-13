// Test sender detection logic
const { getCorrectSender } = require('./app/lib/sender-detector')

const testMessages = [
  {
    text: "Hi there. Total cost for MacBook A2337 LCD would be £260 in space grey colour I can get that delivered for tomorrow... Let me know if you'd like to proceed? Many thanks John New Forest Device Repairs",
    expected: 'staff'
  },
  {
    text: "That's the total price... Many thanks John New Forest Device Repairs",
    expected: 'staff'
  },
  {
    text: "Hi there. The silver screen would be £300 in total... I can't find anywhere that will do it cheaper for next day delivery. Let me know if you'd like to proceed... Many thanks John New Forest Device Repairs",
    expected: 'staff'
  },
  {
    text: "I understand you're looking for a quote on the MacBook screen repair. Based on the information, it would be around £260-300 depending on the color.\n\nJohn will confirm the exact price when he's back.\n\nMany thanks, AI Steve\nNew Forest Device Repairs",
    expected: 'ai'
  },
  {
    text: "Thanks for that",
    expected: 'customer'
  }
]

console.log('\n=== TESTING SENDER DETECTION ===\n')

testMessages.forEach((test, i) => {
  const detected = getCorrectSender(test.text, 'staff')
  const status = detected === test.expected ? '✅' : '❌'
  
  console.log(`${i + 1}. ${status} Expected: ${test.expected}, Got: ${detected}`)
  console.log(`   Text: ${test.text.substring(0, 60)}...`)
  console.log('')
})
