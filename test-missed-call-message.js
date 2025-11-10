/**
 * Test missed call message improvements
 * Shows before/after comparison
 */

console.log('\n=== Missed Call Message Comparison ===\n')

const oldMessage = [
  'Sorry we missed your call. I can help right now with:',
  '- Repair pricing',
  '- Booking you in',
  '- Parts & warranty questions',
  '- Today\'s opening hours',
  '',
  'Just reply with what you need and I\'ll sort it.',
  '',
  'Many Thanks,',
  'AI Steve,',
  'New Forest Device Repairs'
].join('\n')

const newMessage = [
  'Sorry we missed your call!',
  '',
  'I can help with pricing, bookings, or any questions you have. Just text back and I\'ll get you sorted straight away.',
  '',
  'Many thanks,',
  'AI Steve',
  'New Forest Device Repairs'
].join('\n')

console.log('📱 OLD MESSAGE:')
console.log('─'.repeat(60))
console.log(oldMessage)
console.log('─'.repeat(60))
console.log(`Length: ${oldMessage.length} characters`)
console.log(`Lines: ${oldMessage.split('\n').length}`)
console.log(`Word count: ${oldMessage.split(/\s+/).length}`)
console.log()

console.log('📱 NEW MESSAGE:')
console.log('─'.repeat(60))
console.log(newMessage)
console.log('─'.repeat(60))
console.log(`Length: ${newMessage.length} characters`)
console.log(`Lines: ${newMessage.split('\n').length}`)
console.log(`Word count: ${newMessage.split(/\s+/).length}`)
console.log()

console.log('📊 IMPROVEMENTS:')
console.log('─'.repeat(60))

const improvements = [
  {
    aspect: 'Tone',
    old: 'Formal, robotic',
    new: 'Friendly, conversational',
    impact: '✅ More approachable'
  },
  {
    aspect: 'Length',
    old: `${oldMessage.length} chars, ${oldMessage.split('\n').length} lines`,
    new: `${newMessage.length} chars, ${newMessage.split('\n').length} lines`,
    impact: `✅ ${Math.round((1 - newMessage.length / oldMessage.length) * 100)}% shorter`
  },
  {
    aspect: 'Urgency',
    old: 'No emphasis on speed',
    new: '"straight away"',
    impact: '✅ Emphasizes quick response'
  },
  {
    aspect: 'Readability',
    old: 'Bullet list (6 lines)',
    new: 'Single sentence (1 line)',
    impact: '✅ Faster to scan'
  },
  {
    aspect: 'AI Disclosure',
    old: 'Signs as "AI Steve,"',
    new: 'Signs as "AI Steve"',
    impact: '✅ Still clear, less formal'
  },
  {
    aspect: 'Call to Action',
    old: '"Just reply with what you need"',
    new: '"Just text back"',
    impact: '✅ More natural language'
  }
]

improvements.forEach((item, index) => {
  console.log(`\n${index + 1}. ${item.aspect}`)
  console.log(`   Old: ${item.old}`)
  console.log(`   New: ${item.new}`)
  console.log(`   ${item.impact}`)
})

console.log('\n' + '─'.repeat(60))
console.log('\n✅ OVERALL IMPROVEMENTS:')
console.log('   • Warmer, more conversational tone')
console.log('   • Shorter and easier to read')
console.log('   • Emphasizes quick response time')
console.log('   • Maintains clear AI disclosure')
console.log('   • More natural call to action')
console.log()

console.log('🤖 AI DISCLOSURE:')
console.log('   ✅ Still signs as "AI Steve"')
console.log('   ✅ Transparent about being automated')
console.log('   ✅ Positioned as helpful assistant')
console.log('   ✅ Consistent with other AI messages')
console.log()

console.log('📈 EXPECTED IMPACT:')
console.log('   • Higher response rate (friendlier tone)')
console.log('   • Faster engagement (shorter message)')
console.log('   • Better first impression (emphasizes speed)')
console.log('   • Maintained trust (clear AI disclosure)')
console.log()
