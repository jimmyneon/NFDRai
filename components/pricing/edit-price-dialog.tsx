'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

type Price = {
  id: string
  device: string
  repair_type: string
  cost: number
  turnaround: string
  expiry: string | null
}

export function EditPriceDialog({
  price,
  open,
  onClose,
}: {
  price: Price
  open: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    device: price.device,
    repair_type: price.repair_type,
    cost: price.cost.toString(),
    turnaround: price.turnaround,
    expiry: price.expiry ? price.expiry.split('T')[0] : '',
  })
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    setFormData({
      device: price.device,
      repair_type: price.repair_type,
      cost: price.cost.toString(),
      turnaround: price.turnaround,
      expiry: price.expiry ? price.expiry.split('T')[0] : '',
    })
  }, [price])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('prices')
      .update({
        device: formData.device,
        repair_type: formData.repair_type,
        cost: parseFloat(formData.cost),
        turnaround: formData.turnaround,
        expiry: formData.expiry || null,
      })
      .eq('id', price.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update price',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Price updated successfully',
      })
      onClose()
      window.location.reload()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Price</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-device">Device</Label>
            <Input
              id="edit-device"
              value={formData.device}
              onChange={(e) => setFormData({ ...formData, device: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-repair_type">Repair Type</Label>
            <Input
              id="edit-repair_type"
              value={formData.repair_type}
              onChange={(e) => setFormData({ ...formData, repair_type: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cost">Cost (£)</Label>
            <Input
              id="edit-cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-turnaround">Turnaround Time</Label>
            <Input
              id="edit-turnaround"
              value={formData.turnaround}
              onChange={(e) => setFormData({ ...formData, turnaround: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expiry">Expiry Date (Optional)</Label>
            <Input
              id="edit-expiry"
              type="date"
              value={formData.expiry}
              onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update Price'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
