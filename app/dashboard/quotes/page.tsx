import { createClient } from "@/lib/supabase/server";
import { QuotesList } from "@/components/quotes/quotes-list";

export default async function QuotesPage() {
  const supabase = await createClient();

  // Get webchat conversations that have contact details (phone or email)
  // These are leads that need quotes
  const { data: leads, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      created_at,
      updated_at,
      channel,
      status,
      customer:customers(
        id,
        name,
        phone,
        email
      ),
      messages(
        id,
        text,
        sender,
        created_at
      )
    `
    )
    .eq("channel", "webchat")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[Quotes] Error fetching leads:", error);
  }

  // Filter to only those with phone numbers (can send SMS)
  // Note: customer is returned as single object due to foreign key relationship
  const quotableLeads =
    leads?.filter((lead) => {
      const customer = lead.customer as any;
      return customer?.phone && customer.phone.length > 0;
    }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Send Quotes</h1>
        <p className="text-muted-foreground mt-1">
          Review webchat conversations and send quotes via SMS
        </p>
      </div>

      <QuotesList leads={quotableLeads} />
    </div>
  );
}
