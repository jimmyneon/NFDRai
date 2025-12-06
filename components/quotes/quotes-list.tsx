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
  MessageSquare,
  Check,
  Loader2,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

// Helper to get customer object
function getCustomer(lead: Lead): Customer | null {
  if (!lead.customer) return null;
  if (Array.isArray(lead.customer)) {
    return lead.customer[0] || null;
  }
  return lead.customer;
}

// Extract repair details from customer messages
function getRepairDetails(lead: Lead): string {
  const customerMessages = lead.messages
    .filter((m) => m.sender === "customer")
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  // Combine all customer messages to find device/repair info
  const allText = customerMessages.map((m) => m.text).join(" ");

  // Try to extract device type and issue
  const devicePatterns = [
    /iphone\s*\d+\s*(pro\s*)?(max)?/i,
    /ipad\s*(pro|air|mini)?/i,
    /samsung\s*(galaxy\s*)?(s\d+|a\d+|note\s*\d+)?/i,
    /macbook\s*(pro|air)?/i,
    /laptop/i,
    /phone/i,
    /tablet/i,
  ];

  const issuePatterns = [
    /screen\s*(repair|replacement|crack|broken|smash)/i,
    /battery\s*(replacement|issue|drain|dead)/i,
    /charging\s*(port|issue|not charging)/i,
    /water\s*damage/i,
    /not\s*(turning|switching)\s*on/i,
    /broken\s*screen/i,
    /cracked\s*screen/i,
  ];

  let device = "";
  let issue = "";

  for (const pattern of devicePatterns) {
    const match = allText.match(pattern);
    if (match) {
      device = match[0];
      break;
    }
  }

  for (const pattern of issuePatterns) {
    const match = allText.match(pattern);
    if (match) {
      issue = match[0];
      break;
    }
  }

  if (device && issue) {
    return `${device} - ${issue}`;
  } else if (device) {
    return device;
  } else if (issue) {
    return issue;
  }

  // Fallback: first customer message truncated
  return customerMessages[0]?.text?.substring(0, 60) || "Repair enquiry";
}

export function QuotesList({ leads }: QuotesListProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [price, setPrice] = useState("");
  const [diagnosticFee, setDiagnosticFee] = useState("");
  const [repairDetails, setRepairDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);

  // When selecting a lead, auto-fill repair details
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setRepairDetails(getRepairDetails(lead));
    setShowThread(false);
  };

  // Build quote message in AI Steve style
  const buildQuoteMessage = () => {
    const customer = selectedLead ? getCustomer(selectedLead) : null;
    const name = customer?.name || "there";

    // Build diagnostic line if fee is set
    const diagnosticLine = diagnosticFee
      ? `\n\nThere's a £${diagnosticFee} diagnostic fee which goes towards the repair if you proceed.`
      : "";

    return `Hi ${name},

Thanks for getting in touch about your ${repairDetails || "repair"}.

The quote for this is £${price}.${diagnosticLine}

Let us know if you'd like to proceed and we'll arrange that ASAP.

Many thanks,
AI Steve
New Forest Device Repairs`;
  };

  const handleSendQuote = async () => {
    const customer = selectedLead ? getCustomer(selectedLead) : null;
    if (!selectedLead || !price || !customer?.phone) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedLead.id,
          text: buildQuoteMessage(),
          sender: "ai",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSent((prev) => new Set(prev).add(selectedLead.id));
        setPrice("");
        setDiagnosticFee("");
        setRepairDetails("");
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
      {/* Leads List - Clean table-like view */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-3">
          Webchat Leads ({leads.length})
        </h2>

        <div className="border rounded-lg divide-y">
          {leads.map((lead) => {
            const customer = getCustomer(lead);
            const isSent = sent.has(lead.id);
            const isSelected = selectedLead?.id === lead.id;
            const repair = getRepairDetails(lead);

            return (
              <div
                key={lead.id}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-primary/10" : "hover:bg-accent/50"
                } ${isSent ? "opacity-50" : ""}`}
                onClick={() => !isSent && handleSelectLead(lead)}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Name & Contact */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {customer?.name || "Unknown"}
                      </span>
                      {isSent && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Sent
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      {customer?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer?.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Repair Details */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Smartphone className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate max-w-[150px]">{repair}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(lead.updated_at)}
                    </span>
                  </div>
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
            {selectedLead ? (
              <div className="space-y-4">
                {/* Customer Summary */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {getCustomer(selectedLead)?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getCustomer(selectedLead)?.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Repair Details (editable) */}
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Repair Details
                  </label>
                  <Input
                    value={repairDetails}
                    onChange={(e) => setRepairDetails(e.target.value)}
                    placeholder="e.g. iPhone 14 screen repair"
                  />
                </div>

                {/* Price Input */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Quote Price
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
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Diagnostic Fee{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={diagnosticFee}
                        onChange={(e) => setDiagnosticFee(e.target.value)}
                        className="pl-7"
                        step="1"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendQuote}
                  disabled={!price || sending}
                  className="w-full gap-2"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Quote
                </Button>

                {/* Message Preview */}
                {price && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Message Preview:
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 whitespace-pre-line">
                      {buildQuoteMessage()}
                    </p>
                  </div>
                )}

                {/* View Thread Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowThread(!showThread)}
                >
                  {showThread ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Hide conversation
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      View conversation ({selectedLead.messages.length}{" "}
                      messages)
                    </>
                  )}
                </Button>

                {/* Collapsible Thread */}
                {showThread && (
                  <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-muted/50 rounded-lg text-sm">
                    {selectedLead.messages
                      .sort(
                        (a, b) =>
                          new Date(a.created_at).getTime() -
                          new Date(b.created_at).getTime()
                      )
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-2 rounded ${
                            msg.sender === "customer"
                              ? "bg-background"
                              : "bg-primary/10 ml-4"
                          }`}
                        >
                          <span className="text-xs text-muted-foreground block mb-0.5">
                            {msg.sender === "customer"
                              ? "Customer"
                              : "AI Steve"}
                          </span>
                          {msg.text}
                        </div>
                      ))}
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
