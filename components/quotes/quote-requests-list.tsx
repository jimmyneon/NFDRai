"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Phone,
  Mail,
  Check,
  Loader2,
  Smartphone,
  Clock,
  Globe,
  MessageSquare,
} from "lucide-react";

interface QuoteRequest {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  device_make: string;
  device_model: string;
  issue: string;
  status: string;
  quoted_price: number | null;
  sms_sent: boolean;
  source: string;
  conversation_id: string | null;
  created_at: string;
}

interface QuoteRequestsListProps {
  quoteRequests: QuoteRequest[];
}

// Quote type options
type QuoteType = "fixed" | "diagnostic" | "estimate";

const QUOTE_TYPES = [
  {
    value: "fixed" as QuoteType,
    label: "Fixed Quote",
    description: "Standard repair with fixed price",
  },
  {
    value: "diagnostic" as QuoteType,
    label: "Diagnostic First",
    description: "Need to inspect before quoting",
  },
  {
    value: "estimate" as QuoteType,
    label: "Estimate",
    description: "Approximate price, may vary",
  },
];

export function QuoteRequestsList({ quoteRequests }: QuoteRequestsListProps) {
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(
    null
  );
  const [price, setPrice] = useState("");
  const [diagnosticFee, setDiagnosticFee] = useState("20");
  const [quoteType, setQuoteType] = useState<QuoteType>("fixed");
  const [repairDescription, setRepairDescription] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleSelectRequest = (request: QuoteRequest) => {
    setSelectedRequest(request);
    setPrice(request.quoted_price?.toString() || "");
    setRepairDescription(
      `${request.device_make} ${request.device_model} ${request.issue}`
    );
    setCustomMessage("");

    // Auto-detect if diagnostic might be needed
    const needsDiagnostic =
      /won'?t\s+(turn|power|switch)\s+on|no\s+power|dead|water\s+damage|not\s+working|unknown/i.test(
        request.issue
      );
    setQuoteType(needsDiagnostic ? "diagnostic" : "fixed");
  };

  const buildQuoteMessage = () => {
    if (!selectedRequest) return "";
    const firstName = selectedRequest.name.split(" ")[0];

    // If custom message is set, use it
    if (customMessage.trim()) {
      return customMessage;
    }

    // Build message based on quote type
    if (quoteType === "diagnostic") {
      return `Hi ${firstName},

Thanks for your repair enquiry about your ${repairDescription}.

As this issue could have multiple causes, we'd need to run a diagnostic first to give you an accurate quote.

The diagnostic fee is £${diagnosticFee}, which goes towards the repair if you proceed.

Let us know if you'd like to proceed and we'll arrange that ASAP.

Many thanks,
John
New Forest Device Repairs`;
    }

    if (quoteType === "estimate") {
      return `Hi ${firstName},

Thanks for your repair enquiry!

For your ${repairDescription}, the estimated cost would be around £${price}.

The final price may vary slightly once we've had a look at it.

Let us know if you'd like to proceed and we'll arrange that ASAP.

Many thanks,
John
New Forest Device Repairs`;
    }

    // Fixed quote (default)
    return `Hi ${firstName},

Thanks for your repair enquiry!

The quote for your ${repairDescription} is £${price}.

Let us know if you'd like to proceed and we'll arrange that ASAP.

Many thanks,
John
New Forest Device Repairs`;
  };

  const handleSendQuote = async () => {
    if (!selectedRequest) return;
    // For diagnostic, we don't need a price
    if (quoteType !== "diagnostic" && !price) return;

    setSending(true);
    setError(null);

    try {
      // Send SMS via the messaging provider
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "lookup-by-phone",
          customerPhone: selectedRequest.phone,
          text: buildQuoteMessage(),
          sender: "staff",
        }),
      });

      const result = await response.json();

      if (result.success || result.sent) {
        // Update quote request status
        await fetch(`/api/quotes/${selectedRequest.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "quoted",
            quoted_price: parseFloat(price),
          }),
        });

        setSent((prev) => new Set(prev).add(selectedRequest.id));
        setPrice("");
        setSelectedRequest(null);
      } else {
        setError(result.error || "Failed to send quote");
      }
    } catch (err) {
      setError("Failed to send quote. Please try again.");
      console.error("[QuoteRequests] Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "quoted":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Quoted
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Accepted
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (quoteRequests.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quote Requests List */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          Quote Requests ({quoteRequests.length})
        </h2>

        <div className="border rounded-lg divide-y">
          {quoteRequests.map((request) => {
            const isSent = sent.has(request.id) || request.status === "quoted";
            const isSelected = selectedRequest?.id === request.id;

            return (
              <div
                key={request.id}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-primary/10" : "hover:bg-accent/50"
                } ${isSent ? "opacity-60" : ""}`}
                onClick={() => handleSelectRequest(request)}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Name & Contact */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {request.name}
                      </span>
                      {request.source === "webchat" ? (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Chat
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Web
                        </Badge>
                      )}
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {request.phone}
                      </span>
                      {request.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" />
                          {request.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Device & Issue */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Smartphone className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate max-w-[150px]">
                        {request.device_make} {request.device_model}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                      <Clock className="w-3 h-3" />
                      {formatTime(request.created_at)}
                    </div>
                  </div>
                </div>

                {/* Issue */}
                <div className="mt-1 text-sm text-muted-foreground">
                  Issue: {request.issue}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quote Panel */}
      <div className="lg:sticky lg:top-24 h-fit">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Send Quote</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRequest ? (
              <div className="space-y-4">
                {/* Customer Summary */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedRequest.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.phone}
                  </p>
                  {selectedRequest.email && (
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.email}
                    </p>
                  )}
                </div>

                {/* Quote Type Selection */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Quote Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {QUOTE_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setQuoteType(type.value)}
                        className={`p-2 text-xs rounded-lg border transition-colors ${
                          quoteType === type.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-accent border-border"
                        }`}
                      >
                        <div className="font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {
                      QUOTE_TYPES.find((t) => t.value === quoteType)
                        ?.description
                    }
                  </p>
                </div>

                {/* Repair Description (editable) */}
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Repair Description
                  </label>
                  <Input
                    value={repairDescription}
                    onChange={(e) => setRepairDescription(e.target.value)}
                    placeholder="e.g. iPhone 14 Pro screen repair"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Edit to clarify what the quote is for
                  </p>
                </div>

                {/* Price Input - only show for fixed/estimate */}
                {quoteType !== "diagnostic" && (
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      {quoteType === "estimate"
                        ? "Estimated Price"
                        : "Quote Price"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pl-7"
                        step="1"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {/* Diagnostic fee input */}
                {quoteType === "diagnostic" && (
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Diagnostic Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        placeholder="20"
                        value={diagnosticFee}
                        onChange={(e) => setDiagnosticFee(e.target.value)}
                        className="pl-7"
                        step="1"
                        min="0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Goes towards the repair if customer proceeds
                    </p>
                  </div>
                )}

                {/* Custom Message (optional) */}
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Custom Message (optional)
                  </label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Leave blank to use auto-generated message, or write your own..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                {/* Message Preview */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Message Preview:
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 whitespace-pre-line text-xs">
                    {buildQuoteMessage()}
                  </p>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendQuote}
                  disabled={
                    (quoteType !== "diagnostic" && !price) ||
                    sending ||
                    selectedRequest.status === "quoted"
                  }
                  className="w-full gap-2"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send{" "}
                  {quoteType === "diagnostic" ? "Diagnostic Request" : "Quote"}
                </Button>

                {selectedRequest.status === "quoted" && (
                  <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    <Check className="w-4 h-4 inline mr-1" />
                    Quote already sent (£{selectedRequest.quoted_price})
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a quote request to respond</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
