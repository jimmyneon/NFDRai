import { createClient } from "@/lib/supabase/server";
import { QuoteForm } from "@/components/quotes/quote-form";
import { notFound } from "next/navigation";

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: quoteRequest, error } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !quoteRequest) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quote Request</h1>
        <p className="text-muted-foreground mt-1">
          Enter the quote amount and send via SMS
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{quoteRequest.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{quoteRequest.phone}</p>
            </div>
            {quoteRequest.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{quoteRequest.email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-4">Repair Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Device Make</p>
              <p className="font-medium">{quoteRequest.device_make}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Device Model</p>
              <p className="font-medium">{quoteRequest.device_model}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Issue</p>
              <p className="font-medium">{quoteRequest.issue}</p>
            </div>
          </div>
        </div>

        {quoteRequest.quoted_price && (
          <div className="border-t pt-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                Quote already sent: £{quoteRequest.quoted_price}
              </p>
              {quoteRequest.quoted_at && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Sent on{" "}
                  {new Date(quoteRequest.quoted_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <QuoteForm quoteRequest={quoteRequest} />
    </div>
  );
}
