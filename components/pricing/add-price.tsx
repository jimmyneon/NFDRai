'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export function AddPriceButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    device: '',
    repair_type: '',
    cost: '',
    turnaround: '',
    expiry: '',
  })
  const supabase = createClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('prices').insert({
      device: formData.device,
      repair_type: formData.repair_type,
      cost: parseFloat(formData.cost),
      turnaround: formData.turnaround,
      expiry: formData.expiry || null,
    })

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add price',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Price added successfully',
      })
      setOpen(false)
      setFormData({ device: '', repair_type: '', cost: '', turnaround: '', expiry: '' })
      window.location.reload()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Price
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Price</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device">Device</Label>
            <Input
              id="device"
              placeholder="e.g., iPhone 14"
              value={formData.device}
              onChange={(e) => setFormData({ ...formData, device: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repair_type">Repair Type</Label>
            <Input
              id="repair_type"
              placeholder="e.g., Screen Replacement"
              value={formData.repair_type}
              onChange={(e) => setFormData({ ...formData, repair_type: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost (£)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="99.99"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="turnaround">Turnaround Time</Label>
            <Input
              id="turnaround"
              placeholder="e.g., Same Day"
              value={formData.turnaround}
              onChange={(e) => setFormData({ ...formData, turnaround: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date (Optional)</Label>
            <Input
              id="expiry"
              type="date"
              value={formData.expiry}
              onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Price'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
