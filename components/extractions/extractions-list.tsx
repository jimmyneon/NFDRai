'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Pencil, Check, X, AlertCircle } from 'lucide-react'

interface Extraction {
  id: string
  customer_name: string | null
  device_type: string | null
  device_model: string | null
  device_issue: string | null
  repair_status: string | null
  price_quoted: number | null
  price_final: number | null
  message_type: string | null
  extraction_confidence: number
  extraction_method: string
  created_at: string
  message: {
    id: string
    text: string
    created_at: string
  }
  conversation: {
    id: string
    customer: {
      id: string
      name: string
      phone: string
    }
  }
}

export function ExtractionsList({ extractions }: { extractions: Extraction[] }) {
  const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null)
  const [editedData, setEditedData] = useState<Partial<Extraction>>({})
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'low-confidence' | 'no-name'>('all')
  const { toast } = useToast()

  const filteredExtractions = extractions.filter(e => {
    if (filter === 'low-confidence') return e.extraction_confidence < 0.5
    if (filter === 'no-name') return !e.customer_name
    return true
  })

  const handleEdit = (extraction: Extraction) => {
    setSelectedExtraction(extraction)
    setEditedData({
      customer_name: extraction.customer_name,
      device_type: extraction.device_type,
      device_model: extraction.device_model,
      device_issue: extraction.device_issue,
      repair_status: extraction.repair_status,
      price_quoted: extraction.price_quoted,
      price_final: extraction.price_final,
      message_type: extraction.message_type,
    })
  }

  const handleSave = async () => {
    if (!selectedExtraction) return

    setSaving(true)
    try {
      const response = await fetch(`/api/extractions/${selectedExtraction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editedData,
          extraction_method: 'manual', // Mark as manually edited
        }),
      })

      if (!response.ok) throw new Error('Failed to update')

      toast({
        title: 'Success',
        description: 'Extraction updated successfully',
      })

      setSelectedExtraction(null)
      window.location.reload() // Refresh to show updated data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update extraction',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-600">High ({Math.round(confidence * 100)}%)</Badge>
    if (confidence >= 0.5) return <Badge className="bg-yellow-600">Medium ({Math.round(confidence * 100)}%)</Badge>
    return <Badge className="bg-red-600">Low ({Math.round(confidence * 100)}%)</Badge>
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    const colors: Record<string, string> = {
      ready: 'bg-green-600',
      in_progress: 'bg-blue-600',
      not_fixed: 'bg-red-600',
      quoted: 'bg-purple-600',
      awaiting_parts: 'bg-orange-600',
      awaiting_customer: 'bg-yellow-600',
    }
    return <Badge className={colors[status] || 'bg-gray-600'}>{status.replace('_', ' ')}</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({extractions.length})
        </Button>
        <Button
          variant={filter === 'low-confidence' ? 'default' : 'outline'}
          onClick={() => setFilter('low-confidence')}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Low Confidence ({extractions.filter(e => e.extraction_confidence < 0.5).length})
        </Button>
        <Button
          variant={filter === 'no-name' ? 'default' : 'outline'}
          onClick={() => setFilter('no-name')}
        >
          No Name ({extractions.filter(e => !e.customer_name).length})
        </Button>
      </div>

      {/* Extractions Grid */}
      <div className="grid gap-4">
        {filteredExtractions.map((extraction) => (
          <Card key={extraction.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {extraction.customer_name || extraction.conversation.customer.name || 'Unknown Customer'}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{new Date(extraction.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <span>{extraction.conversation.customer.phone}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(extraction)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Original Message */}
              <div>
                <Label className="text-xs text-muted-foreground">Original Message</Label>
                <p className="text-sm mt-1 p-2 bg-muted rounded">{extraction.message.text}</p>
              </div>

              {/* Extracted Data */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Customer Name</Label>
                  <p className="text-sm font-medium mt-1">
                    {extraction.customer_name || <span className="text-muted-foreground">Not extracted</span>}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Device</Label>
                  <p className="text-sm font-medium mt-1">
                    {extraction.device_type && extraction.device_model
                      ? `${extraction.device_type} ${extraction.device_model}`
                      : extraction.device_type || <span className="text-muted-foreground">Not extracted</span>}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Issue</Label>
                  <p className="text-sm font-medium mt-1">
                    {extraction.device_issue || <span className="text-muted-foreground">Not extracted</span>}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {extraction.repair_status ? getStatusBadge(extraction.repair_status) : <span className="text-sm text-muted-foreground">Not extracted</span>}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              {(extraction.price_quoted || extraction.price_final) && (
                <div className="flex gap-4">
                  {extraction.price_quoted && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Quoted</Label>
                      <p className="text-sm font-medium mt-1">£{extraction.price_quoted.toFixed(2)}</p>
                    </div>
                  )}
                  {extraction.price_final && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Final</Label>
                      <p className="text-sm font-medium mt-1">£{extraction.price_final.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-2 pt-2 border-t">
                {getConfidenceBadge(extraction.extraction_confidence)}
                <Badge variant="outline">{extraction.extraction_method}</Badge>
                {extraction.message_type && <Badge variant="outline">{extraction.message_type}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!selectedExtraction} onOpenChange={() => setSelectedExtraction(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Extraction</DialogTitle>
            <DialogDescription>
              Manually correct any extraction errors. Changes will be marked as manually edited.
            </DialogDescription>
          </DialogHeader>

          {selectedExtraction && (
            <div className="space-y-4">
              {/* Original Message */}
              <div>
                <Label className="text-xs text-muted-foreground">Original Message</Label>
                <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedExtraction.message.text}</p>
              </div>

              {/* Edit Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    value={editedData.customer_name || ''}
                    onChange={(e) => setEditedData({ ...editedData, customer_name: e.target.value })}
                    placeholder="e.g., Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="device_type">Device Type</Label>
                  <Input
                    id="device_type"
                    value={editedData.device_type || ''}
                    onChange={(e) => setEditedData({ ...editedData, device_type: e.target.value })}
                    placeholder="e.g., iPhone"
                  />
                </div>
                <div>
                  <Label htmlFor="device_model">Device Model</Label>
                  <Input
                    id="device_model"
                    value={editedData.device_model || ''}
                    onChange={(e) => setEditedData({ ...editedData, device_model: e.target.value })}
                    placeholder="e.g., 14 Pro"
                  />
                </div>
                <div>
                  <Label htmlFor="device_issue">Device Issue</Label>
                  <Input
                    id="device_issue"
                    value={editedData.device_issue || ''}
                    onChange={(e) => setEditedData({ ...editedData, device_issue: e.target.value })}
                    placeholder="e.g., cracked screen"
                  />
                </div>
                <div>
                  <Label htmlFor="repair_status">Repair Status</Label>
                  <select
                    id="repair_status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editedData.repair_status || ''}
                    onChange={(e) => setEditedData({ ...editedData, repair_status: e.target.value })}
                  >
                    <option value="">Select status</option>
                    <option value="ready">Ready</option>
                    <option value="in_progress">In Progress</option>
                    <option value="not_fixed">Not Fixed</option>
                    <option value="quoted">Quoted</option>
                    <option value="awaiting_parts">Awaiting Parts</option>
                    <option value="awaiting_customer">Awaiting Customer</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="message_type">Message Type</Label>
                  <select
                    id="message_type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editedData.message_type || ''}
                    onChange={(e) => setEditedData({ ...editedData, message_type: e.target.value })}
                  >
                    <option value="">Select type</option>
                    <option value="ready_notification">Ready Notification</option>
                    <option value="quote">Quote</option>
                    <option value="update">Update</option>
                    <option value="not_fixed">Not Fixed</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="price_quoted">Price Quoted (£)</Label>
                  <Input
                    id="price_quoted"
                    type="number"
                    step="0.01"
                    value={editedData.price_quoted || ''}
                    onChange={(e) => setEditedData({ ...editedData, price_quoted: parseFloat(e.target.value) || null })}
                    placeholder="e.g., 149.99"
                  />
                </div>
                <div>
                  <Label htmlFor="price_final">Price Final (£)</Label>
                  <Input
                    id="price_final"
                    type="number"
                    step="0.01"
                    value={editedData.price_final || ''}
                    onChange={(e) => setEditedData({ ...editedData, price_final: parseFloat(e.target.value) || null })}
                    placeholder="e.g., 149.99"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedExtraction(null)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Check className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
