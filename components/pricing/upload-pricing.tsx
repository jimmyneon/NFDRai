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
import { Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import Papa from 'papaparse'

export function UploadPricingButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const prices = results.data
          .filter((row: any) => row.device && row.repair_type && row.cost)
          .map((row: any) => ({
            device: row.device,
            repair_type: row.repair_type,
            cost: parseFloat(row.cost),
            turnaround: row.turnaround || 'TBC',
            expiry: row.expiry || null,
          }))

        if (prices.length === 0) {
          toast({
            title: 'Error',
            description: 'No valid prices found in CSV',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        const { error } = await supabase.from('prices').insert(prices)

        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to upload prices',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Success',
            description: `${prices.length} prices uploaded successfully`,
          })
          setOpen(false)
          window.location.reload()
        }

        setLoading(false)
      },
      error: () => {
        toast({
          title: 'Error',
          description: 'Failed to parse CSV file',
          variant: 'destructive',
        })
        setLoading(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Pricing CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-xl text-sm">
            <p className="font-medium mb-2">CSV Format:</p>
            <code className="text-xs">
              device,repair_type,cost,turnaround,expiry
              <br />
              iPhone 14,Screen Replacement,149.99,Same Day,2024-12-31
            </code>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={loading}
            className="w-full"
          />

          {loading && <p className="text-sm text-muted-foreground">Uploading...</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
