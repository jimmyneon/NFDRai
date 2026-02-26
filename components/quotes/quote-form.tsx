"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface QuoteFormProps {
  quoteRequest: any;
}

export function QuoteForm({ quoteRequest }: QuoteFormProps) {
  const router = useRouter();
  const [quoteAmount, setQuoteAmount] = useState(
    quoteRequest.quoted_price?.toString() || "",
  );
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [requiresPartsOrder, setRequiresPartsOrder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnableToQuote, setIsUnableToQuote] = useState(false);
  const [isDiagnostics, setIsDiagnostics] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!quoteAmount || parseFloat(quoteAmount) <= 0) {
      setError("Please enter a valid quote amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quotes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_id: quoteRequest.id,
          quote_amount: parseFloat(quoteAmount),
          additional_notes: additionalNotes,
          requires_parts_order: requiresPartsOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send quote");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/quotes");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnableToQuote = async () => {
    if (
      !confirm(
        "Send 'Unable to Quote' message? This will inform the customer they need an in-store assessment.",
      )
    ) {
      return;
    }

    setError("");
    setSuccess(false);
    setIsUnableToQuote(true);

    try {
      const response = await fetch("/api/quotes/unable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_id: quoteRequest.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/quotes");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsUnableToQuote(false);
    }
  };

  const handleRejectQuote = async () => {
    if (
      !confirm(
        "Reject this quote request? This will inform the customer you're unable to take on this repair (low value, complexity, etc.).",
      )
    ) {
      return;
    }

    setError("");
    setSuccess(false);
    setIsRejecting(true);

    try {
      const response = await fetch("/api/quotes/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_id: quoteRequest.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/quotes");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDiagnostics = async () => {
    if (
      !confirm(
        "Send 'Diagnostics Required' message? This will ask the customer to bring the device in for a £40 diagnostic fee (deducted from final bill if they proceed).",
      )
    ) {
      return;
    }

    setError("");
    setSuccess(false);
    setIsDiagnostics(true);

    try {
      const response = await fetch("/api/quotes/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_id: quoteRequest.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/quotes");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsDiagnostics(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border rounded-lg p-4 sm:p-6"
    >
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Send Quote</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="quoteAmount">Quote Amount (£)</Label>
          <Input
            id="quoteAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={quoteAmount}
            onChange={(e) => setQuoteAmount(e.target.value)}
            disabled={isSubmitting}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
          <Textarea
            id="additionalNotes"
            placeholder="e.g., Includes screen protector, 1-2 day turnaround"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            disabled={isSubmitting}
            className="mt-1"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            This will be included in the SMS message
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requiresPartsOrder"
            checked={requiresPartsOrder}
            onChange={(e) => setRequiresPartsOrder(e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="requiresPartsOrder" className="cursor-pointer">
            Requires parts to be ordered (next day delivery, excluding weekends)
          </Label>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Quote sent successfully! Redirecting...
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              isUnableToQuote ||
              isDiagnostics ||
              isRejecting ||
              success
            }
            className="w-full sm:flex-1"
          >
            {isSubmitting ? "Sending..." : "Send Quote via SMS"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleDiagnostics}
            disabled={
              isSubmitting ||
              isUnableToQuote ||
              isDiagnostics ||
              isRejecting ||
              success
            }
            className="w-full sm:w-auto"
          >
            {isDiagnostics ? "Sending..." : "Diagnostics Required"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleUnableToQuote}
            disabled={
              isSubmitting ||
              isUnableToQuote ||
              isDiagnostics ||
              isRejecting ||
              success
            }
            className="w-full sm:w-auto"
          >
            {isUnableToQuote ? "Sending..." : "Unable to Quote"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRejectQuote}
            disabled={
              isSubmitting ||
              isUnableToQuote ||
              isDiagnostics ||
              isRejecting ||
              success
            }
            className="w-full sm:w-auto"
          >
            {isRejecting ? "Sending..." : "Reject Quote"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/quotes")}
            disabled={
              isSubmitting || isUnableToQuote || isDiagnostics || isRejecting
            }
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
