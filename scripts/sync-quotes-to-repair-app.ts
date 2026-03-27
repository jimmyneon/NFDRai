/**
 * Bulk sync existing quotes to Repair App
 * Run this once to sync all existing quotes from the last 90 days
 * 
 * Usage: npx tsx scripts/sync-quotes-to-repair-app.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const webhookUrl = process.env.REPAIR_APP_WEBHOOK_URL!;
const webhookSecret = process.env.REPAIR_APP_WEBHOOK_SECRET!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!webhookUrl || !webhookSecret) {
  console.error('❌ Missing Repair App webhook configuration');
  console.error('   Set REPAIR_APP_WEBHOOK_URL and REPAIR_APP_WEBHOOK_SECRET in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncQuoteToRepairApp(quote: any): Promise<boolean> {
  try {
    const payload = {
      quote_request_id: quote.id,
      customer_name: quote.name,
      customer_phone: quote.phone,
      customer_email: quote.email || undefined,
      device_make: quote.device_make,
      device_model: quote.device_model,
      issue: quote.issue,
      description: quote.description || undefined,
      additional_issues: quote.additional_issues || undefined,
      quoted_price: quote.quoted_price || undefined,
      status: quote.status || 'pending',
      type: quote.type || 'repair',
      source_page: quote.page || undefined,
      source: quote.source || 'website',
      requires_parts_order: quote.requires_parts_order || false,
      conversation_id: quote.conversation_id || undefined,
      created_at: quote.created_at,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`   ❌ Failed: ${response.status} - ${error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function bulkSyncQuotes() {
  console.log('🔄 Starting bulk quote sync to Repair App...\n');

  // Calculate date 90 days ago
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  console.log(`📅 Fetching quotes from ${ninetyDaysAgo.toISOString().split('T')[0]} onwards...`);

  // Fetch all quotes from last 90 days
  const { data: quotes, error } = await supabase
    .from('quote_requests')
    .select('*')
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch quotes:', error);
    process.exit(1);
  }

  if (!quotes || quotes.length === 0) {
    console.log('ℹ️  No quotes found to sync');
    return;
  }

  console.log(`📊 Found ${quotes.length} quotes to sync\n`);
  console.log('─'.repeat(80));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < quotes.length; i++) {
    const quote = quotes[i];
    const progress = `[${i + 1}/${quotes.length}]`;
    
    process.stdout.write(`${progress} ${quote.name} - ${quote.device_make} ${quote.device_model}... `);

    const success = await syncQuoteToRepairApp(quote);
    
    if (success) {
      console.log('✅');
      successCount++;
    } else {
      failCount++;
    }

    // Rate limit: 100ms between requests
    if (i < quotes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('─'.repeat(80));
  console.log('\n📈 Sync Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed:  ${failCount}`);
  console.log(`   📊 Total:   ${quotes.length}`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Some quotes failed to sync. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All quotes synced successfully!');
  }
}

// Run the sync
bulkSyncQuotes().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
