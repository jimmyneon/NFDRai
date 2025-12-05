"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Phone, Mail, MessageSquare, Check, Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  channel: string;
  status: string;
  customer: Customer | Customer[] | null;
  messages: Array<{
    id: string;
    text: string;
    sender: string;
    created_at: string;
  }>;
}

interface QuotesListProps {
  leads: Lead[];
}

// Helper to get customer object (handles both single object and array from Supabase)
function getCustomer(lead: Lead): Customer | null {
  if (!lead.customer) return null;
  if (Array.isArray(lead.customer)) {
    return lead.customer[0] || null;
  }
  return lead.customer;
}

export function QuotesList({ leads }: QuotesListProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [price, setPrice] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleSendQuote = async () => {
    const customer = selectedLead ? getCustomer(selectedLead) : null;
    if (!selectedLead || !price || !customer?.phone) return;

    setSending(true);
    setError(null);

    try {
      // Get customer name and device info from conversation
      const customerName = customer.name || "there";

      // Build the quote message
      const quoteMessage = `Hi ${customerName}, thanks for your enquiry! The quote for your repair is £${price}. Just pop in during opening hours - no appointment needed. We're open Mon-Fri 10am-5pm, Sat 10am-3pm. Many thanks, John, New Forest Device Repairs`;

      // Send via the messages API
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: selectedLead.id,
          text: quoteMessage,
          sender: "staff",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSent((prev) => new Set(prev).add(selectedLead.id));
        setPrice("");
        setSelectedLead(null);
      } else {
        setError(result.error || "Failed to send quote");
      }
    } catch (err) {
      setError("Failed to send quote. Please try again.");
      console.error("[Quotes] Send error:", err);
    } finally {
      setSending(false);
    }
  };

  // Get a summary of the conversation
  const getConversationSummary = (lead: Lead) => {
    const customerMessages = lead.messages
      .filter((m) => m.sender === "customer")
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    return customerMessages
      .map((m) => m.text)
      .join(" | ")
      .substring(0, 200);
  };

  // Format relative time
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

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No leads with phone numbers</h3>
          <p className="text-muted-foreground mt-1">
            Webchat visitors who provide their mobile number will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Leads List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Webchat Leads ({leads.length})
        </h2>
        {leads.map((lead) => {
          const isSent = sent.has(lead.id);
          const isSelected = selectedLead?.id === lead.id;

          return (
            <Card
              key={lead.id}
              className={`cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-primary" : "hover:bg-accent/50"
              } ${isSent ? "opacity-60" : ""}`}
              onClick={() => !isSent && setSelectedLead(lead)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {getCustomer(lead)?.name || "Unknown"}
                      </span>
                      {isSent && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Sent
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                      {getCustomer(lead)?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {getCustomer(lead)?.phone}
                        </span>
                      )}
                      {getCustomer(lead)?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {getCustomer(lead)?.email}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getConversationSummary(lead) || "No messages"}
                    </p>
                  </div>

                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(lead.updated_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quote Panel */}
      <div className="lg:sticky lg:top-24 h-fit">
        <Card>
          <CardHeader>
            <CardTitle>Send Quote</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLead ? (
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">
                    {getCustomer(selectedLead)?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getCustomer(selectedLead)?.phone}
                  </p>
                </div>

                {/* Conversation */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Conversation</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-muted/50 rounded-lg">
                    {selectedLead.messages
                      .sort(
                        (a, b) =>
                          new Date(a.created_at).getTime() -
                          new Date(b.created_at).getTime()
                      )
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`text-sm p-2 rounded ${
                            msg.sender === "customer"
                              ? "bg-background"
                              : "bg-primary/10 ml-4"
                          }`}
                        >
                          <span className="text-xs text-muted-foreground block mb-1">
                            {msg.sender === "customer"
                              ? "Customer"
                              : "AI Steve"}
                          </span>
                          {msg.text}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Price Input */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Quote Price (£)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pl-7"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <Button
                      onClick={handleSendQuote}
                      disabled={!price || sending}
                      className="gap-2"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                {price && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Message Preview:
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      Hi {getCustomer(selectedLead)?.name || "there"}, thanks
                      for your enquiry! The quote for your repair is £{price}.
                      Just pop in during opening hours - no appointment needed.
                      We're open Mon-Fri 10am-5pm, Sat 10am-3pm. Many thanks,
                      John, New Forest Device Repairs
                    </p>
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a lead to send a quote</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
