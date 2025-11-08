# Database Tables Usage Analysis

## Tables Currently Used

### 1. **customers** ✅ ACTIVE
**Purpose:** Store customer information
**Used in:**
- `/api/messages/incoming/route.ts` - Create/find customers
- `/api/messages/send/route.ts` - Find customers by phone, update names
- `/api/messages/missed-call/route.ts` - Create/find customers
- `/api/conversations/[id]/route.ts` - Join with conversations

**Columns:**
- `id` - Primary key
- `phone` - Customer phone number (unique)
- `name` - Customer name (nullable)
- `created_at` - When customer was created
- `updated_at` - Last update time

**Usage frequency:** HIGH - Every message creates/finds customer

---

### 2. **conversations** ✅ ACTIVE
**Purpose:** Track conversations between customers and business
**Used in:**
- `/api/messages/incoming/route.ts` - Create/find conversations
- `/api/messages/send/route.ts` - Find/create conversations
- `/api/messages/missed-call/route.ts` - Create/find conversations
- `/api/conversations/[id]/route.ts` - CRUD operations
- `/components/conversations/conversation-list.tsx` - Display conversations

**Columns:**
- `id` - Primary key
- `customer_id` - Foreign key to customers
- `channel` - 'sms', 'whatsapp', etc.
- `status` - 'active', 'manual', 'archived'
- `created_at` - When conversation started
- `updated_at` - Last message time

**Usage frequency:** HIGH - Every message uses this

---

### 3. **messages** ✅ ACTIVE
**Purpose:** Store all messages in conversations
**Used in:**
- `/api/messages/incoming/route.ts` - Insert customer messages
- `/api/messages/send/route.ts` - Insert staff/AI messages, check duplicates
- `/api/messages/missed-call/route.ts` - Insert system messages
- `/api/messages/delivery-confirmation/route.ts` - Update delivery status
- `/components/conversations/conversation-dialog.tsx` - Display messages
- `/lib/ai/smart-response-generator.ts` - Get message history

**Columns:**
- `id` - Primary key
- `conversation_id` - Foreign key to conversations
- `text` - Message content
- `sender` - 'customer', 'ai', 'staff', 'system'
- `delivered` - Delivery status (boolean)
- `delivered_at` - When delivered
- `ai_confidence` - AI confidence score (nullable)
- `created_at` - When message was sent

**Usage frequency:** VERY HIGH - Every message creates a row

---

### 4. **global_settings** ✅ ACTIVE
**Purpose:** Store system-wide settings
**Used in:**
- `/api/messages/incoming/route.ts` - Check if automation enabled
- `/api/settings/route.ts` - CRUD operations
- `/app/dashboard/settings/page.tsx` - Display settings

**Columns:**
- `id` - Primary key
- `automation_enabled` - Enable/disable AI responses
- `provider` - AI provider ('openai', 'anthropic')
- `model_name` - AI model to use
- `temperature` - AI temperature setting
- `max_tokens` - Max tokens per response
- `system_prompt` - AI system prompt (deprecated - now using prompts table)
- `created_at` - When created
- `updated_at` - Last update

**Usage frequency:** MEDIUM - Read on every message, updated rarely

---

### 5. **business_info** ✅ ACTIVE
**Purpose:** Store business information (hours, location, etc.)
**Used in:**
- `/api/business-hours/route.ts` - CRUD operations
- `/lib/ai/business-hours.ts` - Get current hours status
- `/lib/ai/smart-response-generator.ts` - Include in AI context

**Columns:**
- `id` - Primary key
- `business_name` - Business name
- `google_maps_url` - Maps link
- `monday_open`, `monday_close` - Hours for each day
- `tuesday_open`, `tuesday_close`
- ... (same for all days)
- `created_at` - When created
- `updated_at` - Last update

**Usage frequency:** MEDIUM - Read on every AI response

---

### 6. **prompts** ✅ ACTIVE
**Purpose:** Modular AI prompts (NEW - replaces system_prompt)
**Used in:**
- `/lib/ai/smart-response-generator.ts` - Load relevant prompts via RPC
- Migrations 012-019 - Populate with prompt modules

**Columns:**
- `id` - Primary key
- `module_name` - Unique module identifier
- `category` - 'core', 'repair', 'sales', 'support', 'operational'
- `intent` - Intent this module applies to (nullable)
- `prompt_text` - The actual prompt content
- `priority` - Loading priority (higher = loaded first)
- `active` - Enable/disable module
- `usage_count` - How many times used
- `last_used` - Last usage timestamp
- `created_at` - When created
- `updated_at` - Last update

**Usage frequency:** HIGH - Every AI response loads 2-5 modules

---

### 7. **ai_analytics** ⚠️ PARTIALLY USED
**Purpose:** Track AI performance metrics
**Used in:**
- `/lib/ai/smart-response-generator.ts` - Insert analytics after each response
- `/app/dashboard/analytics/page.tsx` - Display analytics (if exists)

**Columns:**
- `id` - Primary key
- `conversation_id` - Foreign key to conversations
- `message_id` - Foreign key to messages
- `intent` - Detected intent
- `confidence` - Intent confidence score
- `provider` - AI provider used
- `model` - AI model used
- `prompt_tokens` - Tokens in prompt
- `completion_tokens` - Tokens in completion
- `total_tokens` - Total tokens
- `cost_usd` - Estimated cost
- `response_time_ms` - Response time
- `validation_passed` - Did response pass validation
- `validation_issues` - Issues found (JSON)
- `created_at` - When created

**Usage frequency:** HIGH - Every AI response creates a row
**Status:** Data is being inserted but may not be displayed anywhere yet

---

## Tables Potentially Unused or Deprecated

### 8. **users** ❓ UNKNOWN
**Purpose:** User authentication (Supabase Auth)
**Used in:**
- `/api/conversations/[id]/route.ts` - Check user role for delete
- Supabase Auth system

**Status:** May be used by Supabase Auth but not heavily used in app code
**Recommendation:** Keep - needed for authentication

---

### 9. **prices** ❓ POSSIBLY UNUSED
**Purpose:** Store repair pricing
**Used in:**
- `/lib/ai/smart-response-generator.ts` - Load prices for AI context

**Status:** Loaded by AI but may not have data
**Recommendation:** Check if table has data and if AI actually uses it

---

### 10. **conversation_states** ❌ DOESN'T EXIST
**Purpose:** Track conversation state machine
**Status:** Referenced in old code but table doesn't exist
**Recommendation:** Remove references or create table if needed

---

## Tables to Check

Run `list_all_tables.sql` to see:
1. All tables that exist
2. Row counts for each
3. Table sizes
4. Which tables have no data

---

## Recommendations

### Keep (Active)
- ✅ customers
- ✅ conversations  
- ✅ messages
- ✅ global_settings
- ✅ business_info
- ✅ prompts
- ✅ ai_analytics

### Check (May be unused)
- ❓ users (needed for auth)
- ❓ prices (check if has data)
- ❓ Any other tables found by list_all_tables.sql

### Remove (If found)
- ❌ conversation_states (doesn't exist, remove references)
- ❌ Any tables with 0 rows and no code references

---

## Next Steps

1. Run `list_all_tables.sql` to see all tables
2. Check which tables have 0 rows
3. Search codebase for references to empty tables
4. Create migration to drop unused tables (if any)
