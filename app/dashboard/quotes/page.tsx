import { createClient } from "@/lib/supabase/server";
import { QuotesList } from "@/components/quotes/quotes-list";
import { QuoteRequestsList } from "@/components/quotes/quote-requests-list";

export default async function QuotesPage() {
  const supabase = await createClient();

  // Get quote requests from the API (website form submissions)
  const { data: quoteRequests, error: quoteError } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (quoteError) {
    console.error("[Quotes] Error fetching quote requests:", quoteError);
  }

  // Get webchat conversations that have contact details (phone or email)
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
  const quotableLeads =
    leads?.filter((lead) => {
      const customer = lead.customer as any;
      return customer?.phone && customer.phone.length > 0;
    }) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Send Quotes</h1>
        <p className="text-muted-foreground mt-1">
          Review quote requests and webchat leads, then send quotes via SMS
        </p>
      </div>

      {/* Website Quote Requests (from API) */}
      {quoteRequests && quoteRequests.length > 0 && (
        <QuoteRequestsList quoteRequests={quoteRequests} />
      )}

      {/* Webchat Leads */}
      {quotableLeads.length > 0 && (
        <div className="pt-4 border-t">
          <QuotesList leads={quotableLeads} />
        </div>
      )}

      {/* Empty state */}
      {(!quoteRequests || quoteRequests.length === 0) &&
        quotableLeads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No quote requests or webchat leads yet</p>
          </div>
        )}
    </div>
  );
}
