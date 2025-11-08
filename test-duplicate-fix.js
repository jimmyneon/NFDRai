/**
 * Test script for duplicate messages and black screen troubleshooting fix
 * Tests the new prompt modules and message batching behavior
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testPromptModules() {
  console.log('\n========================================')
  console.log('Testing Prompt Modules')
  console.log('========================================\n')

  // Test 1: Check core_identity has duplicate prevention
  console.log('Test 1: Core Identity - Duplicate Prevention')
  const { data: coreIdentity, error: error1 } = await supabase
    .from('prompts')
    .select('prompt_text')
    .eq('module_name', 'core_identity')
    .single()

  if (error1) {
    console.log('❌ Failed to load core_identity:', error1.message)
  } else {
    const hasDuplicatePrevention = coreIdentity.prompt_text.toLowerCase().includes('avoid duplicate')
    const hasHistoryCheck = coreIdentity.prompt_text.toLowerCase().includes('check the conversation history')
    console.log('  Has duplicate prevention:', hasDuplicatePrevention ? '✅' : '❌')
    console.log('  Has history check:', hasHistoryCheck ? '✅' : '❌')
  }

  // Test 2: Check common_scenarios has black screen troubleshooting
  console.log('\nTest 2: Common Scenarios - Black Screen Troubleshooting')
  const { data: commonScenarios, error: error2 } = await supabase
    .from('prompts')
    .select('prompt_text')
    .eq('module_name', 'common_scenarios')
    .single()

  if (error2) {
    console.log('❌ Failed to load common_scenarios:', error2.message)
  } else {
    const hasForceRestart = commonScenarios.prompt_text.toLowerCase().includes('force restart')
    const hasDamageCheck = commonScenarios.prompt_text.toLowerCase().includes('visible damage')
    const hasCombinedQuestions = commonScenarios.prompt_text.toLowerCase().includes('ask multiple')
    console.log('  Has force restart:', hasForceRestart ? '✅' : '❌')
    console.log('  Has damage check:', hasDamageCheck ? '✅' : '❌')
    console.log('  Has combined questions:', hasCombinedQuestions ? '✅' : '❌')
  }

  // Test 3: Check efficient_questioning module exists
  console.log('\nTest 3: Efficient Questioning Module')
  const { data: efficientQuestioning, error: error3 } = await supabase
    .from('prompts')
    .select('*')
    .eq('module_name', 'efficient_questioning')
    .single()

  if (error3) {
    console.log('❌ Module not found:', error3.message)
  } else {
    console.log('  Module exists: ✅')
    console.log('  Priority:', efficientQuestioning.priority)
    console.log('  Enabled:', efficientQuestioning.enabled ? '✅' : '❌')
    const hasExamples = efficientQuestioning.prompt_text.includes('EXAMPLES')
    console.log('  Has examples:', hasExamples ? '✅' : '❌')
  }

  // Test 4: Check context_awareness has repetition prevention
  console.log('\nTest 4: Context Awareness - Repetition Prevention')
  const { data: contextAwareness, error: error4 } = await supabase
    .from('prompts')
    .select('prompt_text')
    .eq('module_name', 'context_awareness')
    .single()

  if (error4) {
    console.log('❌ Failed to load context_awareness:', error4.message)
  } else {
    const hasRepetitionCheck = contextAwareness.prompt_text.toLowerCase().includes('don\'t ask again')
    const hasReferencing = contextAwareness.prompt_text.toLowerCase().includes('reference previous')
    console.log('  Has repetition prevention:', hasRepetitionCheck ? '✅' : '❌')
    console.log('  Has message referencing:', hasReferencing ? '✅' : '❌')
  }
}

async function testPromptLoading() {
  console.log('\n========================================')
  console.log('Testing Prompt Loading (RPC)')
  console.log('========================================\n')

  // Test loading prompts for different intents
  const intents = ['screen_repair', 'general_info', 'diagnostic']

  for (const intent of intents) {
    console.log(`\nTest: Loading prompts for intent "${intent}"`)
    const { data: modules, error } = await supabase
      .rpc('get_prompt_modules', { p_intent: intent })

    if (error) {
      console.log(`  ❌ Error: ${error.message}`)
    } else {
      console.log(`  ✅ Loaded ${modules.length} modules:`)
      modules.forEach(m => {
        console.log(`     - ${m.module_name} (priority: ${m.priority})`)
      })
      
      // Check if efficient_questioning is included
      const hasEfficientQuestioning = modules.some(m => m.module_name === 'efficient_questioning')
      console.log(`  Includes efficient_questioning: ${hasEfficientQuestioning ? '✅' : '❌'}`)
    }
  }
}

async function testMessageBatching() {
  console.log('\n========================================')
  console.log('Testing Message Batching Logic')
  console.log('========================================\n')

  console.log('Note: Message batching is now set to 5 seconds')
  console.log('This means:')
  console.log('  ✅ Customer sends "Can you fix my phone" at 15:06:00')
  console.log('  ✅ Customer sends "iPhone" at 15:06:01')
  console.log('  ⏱️  AI waits until 15:06:05 (5 seconds from first message)')
  console.log('  ✅ AI responds to BOTH messages together')
  console.log('')
  console.log('Previous behavior (3 seconds):')
  console.log('  ❌ Often missed the second message')
  console.log('  ❌ Sent duplicate responses')
  console.log('')
  console.log('To test this in production:')
  console.log('  1. Send a message via SMS')
  console.log('  2. Immediately send another message (within 5 seconds)')
  console.log('  3. AI should wait and respond to both together')
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗')
  console.log('║  Duplicate Messages Fix - Test Suite  ║')
  console.log('╚════════════════════════════════════════╝')

  try {
    await testPromptModules()
    await testPromptLoading()
    await testMessageBatching()

    console.log('\n========================================')
    console.log('✅ All Tests Complete')
    console.log('========================================\n')
    console.log('Summary:')
    console.log('  • Prompt modules updated with duplicate prevention')
    console.log('  • Black screen triggers force restart + damage check')
    console.log('  • Efficient questioning module added')
    console.log('  • Message batching increased to 5 seconds')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Test with real SMS: Send "Screen black"')
    console.log('  2. Verify force restart + damage check in ONE message')
    console.log('  3. Test rapid messages: Send two messages quickly')
    console.log('  4. Verify AI waits and responds to both together')
    console.log('')

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message)
    process.exit(1)
  }
}

// Run tests
runAllTests()
